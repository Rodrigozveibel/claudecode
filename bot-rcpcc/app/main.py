"""Servidor 24h: recebe webhooks do Digisac, agrupa mensagens, responde com Claude."""
from __future__ import annotations

import asyncio
import base64
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Request

from . import agent, audio, db, digisac, origem
from .config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("main")

@asynccontextmanager
async def _lifespan(_app):
    db.conn()
    tasks = [asyncio.create_task(_loop_followup()), asyncio.create_task(_loop_lembrete_reuniao())]
    yield
    for t in tasks:
        t.cancel()


app = FastAPI(title="Robô RCPCC", lifespan=_lifespan)

# mensagens pendentes por contato (o lead costuma mandar 3-4 mensagens seguidas)
_pendentes: dict[str, list[dict]] = {}
_timers: dict[str, asyncio.Task] = {}
_locks: dict[str, asyncio.Lock] = {}

IMAGEM = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/leads")
async def leads(secret: str = ""):
    if secret != settings().webhook_secret:
        raise HTTPException(403)
    return db.listar_leads()


@app.post("/webhook/digisac")
async def webhook(request: Request, secret: str = ""):
    s = settings()
    if s.webhook_secret and secret != s.webhook_secret:
        raise HTTPException(403)
    ev = await request.json()
    if ev.get("event") != "message.created":
        return {"ok": True}
    m = ev.get("data") or {}
    cid = m.get("contactId")
    if not cid or not m.get("id"):
        return {"ok": True}
    atendidas = {x for x in [s.digisac_service_id, *s.lista("rcpcc_service_ids")] if x}
    if atendidas and m.get("serviceId") not in atendidas:
        return {"ok": True}

    if m.get("isFromMe"):
        # mensagem nossa (eco) ou de um atendente humano?
        if not db.existe("enviados", m["id"]) and not m.get("isFromBot") and m.get("type") != "ticket":
            db.get_conversa(cid)
            db.salvar_conversa(cid, pausado_ate=time.time() + s.pausa_humano_horas * 3600)
            log.info("Humano assumiu %s; robô pausado", cid)
        return {"ok": True}
    if m.get("type") == "ticket":
        return {"ok": True}
    if not db.marcar("processados", m["id"]):
        return {"ok": True}  # webhook repetido

    conv = db.get_conversa(cid)  # garante registro
    # define o fluxo no primeiro contato; conversa "geral" vira RCPCC se o criativo aparecer depois
    fluxo, motivo = origem.detectar(ev, m)
    if conv.get("fluxo") is None or (conv["fluxo"] == "geral" and fluxo == "rcpcc"
                                     and conv["status"] == "triagem"):
        db.salvar_conversa(cid, fluxo=fluxo, origem=motivo, service_id=m.get("serviceId"))
        log.info("Contato %s -> fluxo %s (%s)", cid, fluxo, motivo)
    _pendentes.setdefault(cid, []).append(m)
    t = _timers.get(cid)
    if t and not t.done():
        t.cancel()
    _timers[cid] = asyncio.create_task(_processar_depois(cid))
    return {"ok": True}


async def _processar_depois(cid: str):
    try:
        await asyncio.sleep(settings().debounce_segundos)
    except asyncio.CancelledError:
        return
    lock = _locks.setdefault(cid, asyncio.Lock())
    async with lock:
        msgs = _pendentes.pop(cid, [])
        if msgs:
            try:
                await _atender(cid, msgs)
            except Exception:
                log.exception("Falha atendendo %s", cid)


async def _montar_conteudo(msgs: list[dict]) -> tuple[list[dict], bool]:
    """Converte mensagens do WhatsApp em blocos para o Claude. Devolve (blocos, ultima_foi_audio)."""
    agora = datetime.now(ZoneInfo(settings().fuso)).strftime("%d/%m/%Y %H:%M, %A")
    blocos: list[dict] = [{"type": "text", "text": f"[recebido em {agora}]"}]
    ultima_audio = False
    for m in msgs:
        tipo = m.get("type")
        ultima_audio = tipo in ("audio", "ptt", "voice")
        if tipo == "chat" or (not tipo and m.get("text")):
            blocos.append({"type": "text", "text": m.get("text") or ""})
            continue
        arq = await digisac.baixar_arquivo(m)
        if arq is None:
            blocos.append({"type": "text", "text": f"[lead enviou {tipo} que não pôde ser aberto]"})
            continue
        dados, mime = arq
        mime = (mime or "").split(";")[0]
        if ultima_audio or mime.startswith("audio/"):
            ultima_audio = True
            txt = await audio.transcrever(dados, mime)
            blocos.append({"type": "text", "text": f"[áudio do lead, transcrito]: {txt}" if txt else
                           "[lead mandou áudio, mas a transcrição está desligada: peça para escrever]"})
        elif mime in IMAGEM:
            blocos.append({"type": "image", "source": {"type": "base64", "media_type": mime,
                                                       "data": base64.b64encode(dados).decode()}})
        elif mime == "application/pdf":
            blocos.append({"type": "document", "source": {"type": "base64", "media_type": mime,
                                                          "data": base64.b64encode(dados).decode()}})
        else:
            blocos.append({"type": "text", "text": f"[lead enviou arquivo {mime} não suportado]"})
        if m.get("text"):
            blocos.append({"type": "text", "text": m["text"]})
    return blocos, ultima_audio


async def _atender(cid: str, msgs: list[dict]):
    s = settings()
    conv = db.get_conversa(cid)
    if conv["pausado_ate"] > time.time():
        return
    if conv["fluxo"] != "rcpcc" and s.outras_areas_modo == "silencio":
        return  # só atua em lead do criativo; o resto fica com a equipe
    if conv["status"] in ("humano", "agendar_manual", "fechado"):
        return  # equipe já está com o lead
    if conv["status"] == "encerrado":
        conv["status"] = "triagem"  # lead voltou: nova triagem, mesmo histórico

    conteudo, foi_audio = await _montar_conteudo(msgs)
    nota_origem = (f"[sistema: lead veio do anúncio de revisão bancária ({conv['origem']}) - use o fluxo RCPCC]"
                   if conv["fluxo"] == "rcpcc" else
                   "[sistema: lead NÃO veio do anúncio de revisão bancária - aplique o FILTRO RÁPIDO]")
    if not conv["mensagens"] or conv["origem"] != db.get_lead(cid).get("_origem_informada"):
        conteudo.insert(1, {"type": "text", "text": nota_origem})
        lead = db.get_lead(cid); lead["_origem_informada"] = conv["origem"]
        db.salvar_lead(cid, lead, lead.get("_score"), lead.get("_classificacao"))
    if conv["followups"]:
        conteudo.insert(1, {"type": "text", "text": "[nota do sistema: antes desta mensagem você enviou "
                            f"{conv['followups']} lembrete(s) automático(s) porque o lead tinha sumido]"})
    contato = await digisac.get_contato(cid)
    ctx = agent.Contexto(contact_id=cid, telefone=(contato.get("data") or {}).get("number")
                         or contato.get("number") or "", service_id=conv["service_id"])

    texto, historico = await agent.responder(ctx, conv["mensagens"], conteudo)
    if texto:
        enviado_audio = False
        if foi_audio and audio.audio_disponivel() and len(texto) < 600:
            mp3 = await audio.sintetizar(texto)
            if mp3:
                await digisac.enviar_audio(cid, mp3, conv["service_id"])
                enviado_audio = True
        if not enviado_audio:
            for parte in _quebrar(texto):
                await digisac.enviar_texto(cid, parte, conv["service_id"])
                await asyncio.sleep(1.2)

    db.salvar_conversa(cid, mensagens=historico, status=ctx.status_novo or conv["status"],
                       ultimo_contato=time.time(), followups=0)
    if "encerrar" in ctx.eventos:
        await digisac.encerrar_ticket(cid)


def _quebrar(texto: str) -> list[str]:
    """Separa parágrafos em mensagens, como uma pessoa digitando no WhatsApp."""
    partes = [p.strip() for p in texto.split("\n\n") if p.strip()]
    return partes[:4] if len(partes) <= 4 else partes[:3] + ["\n\n".join(partes[3:])]


# (status, nº do lembrete, horas mínimas, horas máximas sem resposta, mensagem, material, fora da janela 24h)
FOLLOWUPS = [
    ("triagem", 0, 3, 20, "Oi{nome}! Conseguiu ver minha última mensagem? Se preferir, me manda uma foto do "
     "contrato que eu já adianto a análise.", None, False),
    ("triagem", 1, 20, 23, "Passando só para saber se ainda quer que a gente analise seus contratos bancários. "
     "Se não for o momento, sem problema, é só me avisar.", None, False),
    ("reuniao", 0, 3, 20, "Oi{nome}! Conseguiu ver os horários para a reunião online com o Dr. Rodrigo? É "
     "gratuita e rapidinha. Me diz o melhor dia e horário para você.", None, False),
    ("oferta", 0, 20, 23, "Olá{nome}, notamos que ainda não recebemos sua confirmação para iniciarmos a revisão "
     "dos seus contratos bancários. Entendemos que entrar com uma ação revisional é uma decisão importante e "
     "estamos à disposição para esclarecer qualquer dúvida. Conte com a nossa equipe.", None, False),
    ("oferta", 1, 44, 70, "Olá{nome}, coloco nossa equipe novamente à disposição para esclarecer dúvidas sobre a "
     "revisão dos seus contratos e sobre o nosso formato de trabalho. Para conhecer um pouco mais o escritório, "
     "este é o Instagram do Dr. Rodrigo: https://www.instagram.com/rodrigozveibeladvogado/", "apresentacao", True),
]


async def _loop_followup():
    """Reengaja leads que pararam de responder, conforme a etapa do funil."""
    from pathlib import Path
    import mimetypes
    pasta = Path(__file__).resolve().parent.parent / "knowledge" / "materiais"
    while True:
        try:
            s = settings()
            hora = datetime.now(ZoneInfo(s.fuso)).hour
            if 8 <= hora < 21:
                for status, n, min_h, max_h, msg, material, fora in FOLLOWUPS:
                    if fora and not s.followup_fora_janela_24h:
                        continue
                    for c in db.conversas_para_followup(min_h, max_h, status):
                        if c["followups"] != n:
                            continue
                        nome = (db.get_lead(c["contact_id"]).get("nome") or "").split(" ")[0]
                        await digisac.enviar_texto(c["contact_id"], msg.format(nome=f", {nome}" if nome else ""),
                                                   c["service_id"])
                        if material and pasta.exists():
                            for f in sorted(pasta.glob(f"{material}*"))[:2]:
                                await digisac.enviar_arquivo(
                                    c["contact_id"], f.read_bytes(),
                                    mimetypes.guess_type(f.name)[0] or "application/octet-stream",
                                    f.name, c["service_id"])
                        db.salvar_conversa(c["contact_id"], followups=n + 1)
        except Exception:
            log.exception("Erro no follow-up")
        await asyncio.sleep(600)


async def _enviar_ou_alertar(r: dict, texto: str, hora: str) -> None:
    """Envia ao lead. Se o WhatsApp recusar (API oficial fora da janela de 24h), avisa o advogado."""
    try:
        await digisac.enviar_texto(r["contact_id"], texto, r["service_id"])
    except Exception:
        log.warning("Lembrete recusado para %s; avisando advogado", r["contact_id"])
        lead = db.get_lead(r["contact_id"])
        if settings().advogado_whatsapp:
            try:
                await digisac.enviar_texto_numero(
                    settings().advogado_whatsapp,
                    f"*Lembrete de reunião NÃO enviado* (WhatsApp bloqueou: lead sem responder há mais de 24h).\n"
                    f"Lead: {lead.get('nome') or r['contact_id']} - reunião às {hora}.\n"
                    f"Mande o link manualmente ou ligue para ele. Mensagem: {texto}")
            except Exception:
                log.exception("Falha ao avisar advogado do lembrete")


async def _loop_lembrete_reuniao():
    """Anti no-show: lembrete 2h antes e link 15 min antes da reunião."""
    while True:
        try:
            s = settings()
            tz = ZoneInfo(s.fuso)
            agora = time.time()
            for r in db.reunioes_proximas():
                ini = r["reuniao_inicio"]
                hora = datetime.fromtimestamp(ini, tz).strftime("%H:%M")
                nome = (db.get_lead(r["contact_id"]).get("nome") or "").split(" ")[0]
                nome = f", {nome}" if nome else ""
                if r["reuniao_avisos"] == 0 and ini - agora <= 2 * 3600 and ini - agora > 15 * 60:
                    await _enviar_ou_alertar(r, f"Oi{nome}! Passando para lembrar da nossa reunião online hoje às "
                                             f"{hora} com o Dr. Rodrigo. Está confirmado?", hora)
                    db.salvar_conversa(r["contact_id"], reuniao_avisos=1)
                elif ini - agora <= 15 * 60:
                    link = s.link_reuniao_online or "(a equipe envia o link em instantes)"
                    await _enviar_ou_alertar(r, f"Oi{nome}, nossa reunião começa às {hora}. É só clicar no link: "
                                             f"{link}", hora)
                    db.salvar_conversa(r["contact_id"], reuniao_avisos=2)
        except Exception:
            log.exception("Erro no lembrete de reunião")
        await asyncio.sleep(60)
