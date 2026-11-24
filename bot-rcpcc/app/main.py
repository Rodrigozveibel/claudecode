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
    task = asyncio.create_task(_loop_followup())
    yield
    task.cancel()


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
    if conv["status"] in ("humano", "agendado", "agendar_manual"):
        return  # equipe já está com o lead
    if conv["status"] == "encerrado":
        conv["status"] = "triagem"  # lead voltou: nova triagem, mesmo histórico

    conteudo, foi_audio = await _montar_conteudo(msgs)
    nota_origem = (f"[sistema: lead veio do anúncio de revisão bancária ({conv['origem']}) - use o fluxo RCPCC]"
                   if conv["fluxo"] == "rcpcc" else
                   "[sistema: lead NÃO veio do anúncio de revisão bancária - faça a triagem geral de área; "
                   "se o caso for revisional de contrato bancário, siga o fluxo RCPCC]")
    if not conv["mensagens"] or conv["origem"] != db.get_lead(cid).get("_origem_informada"):
        conteudo.insert(1, {"type": "text", "text": nota_origem})
        lead = db.get_lead(cid); lead["_origem_informada"] = conv["origem"]
        db.salvar_lead(cid, lead, lead.get("_score"), lead.get("_classificacao"))
    if conv["followups"]:
        conteudo.insert(1, {"type": "text", "text": "[nota do sistema: antes desta mensagem você enviou "
                            f"{conv['followups']} lembrete(s) automático(s) porque o lead tinha sumido]"})
    contato = await digisac.get_contato(cid)
    ctx = agent.Contexto(contact_id=cid, telefone=(contato.get("data") or {}).get("number")
                         or contato.get("number") or "")

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


FOLLOWUPS = [
    "Oi! Conseguiu ver minha última mensagem? Se preferir, pode me mandar uma foto do contrato que eu adianto a análise.",
    "Passando só para saber se ainda quer que o advogado analise seu contrato. Se não for o momento, sem problema, é só me avisar.",
]


async def _loop_followup():
    """Reengaja leads que pararam de responder (3h e 20h depois), dentro da janela de 24h do WhatsApp."""
    while True:
        try:
            for n, (min_h, max_h) in enumerate([(3, 20), (20, 23)]):
                for c in db.conversas_para_followup(min_h, max_h):
                    if c["followups"] != n:
                        continue
                    hora = datetime.now(ZoneInfo(settings().fuso)).hour
                    if not 8 <= hora < 21:
                        continue
                    await digisac.enviar_texto(c["contact_id"], FOLLOWUPS[n], c["service_id"])
                    db.salvar_conversa(c["contact_id"], followups=n + 1)
        except Exception:
            log.exception("Erro no follow-up")
        await asyncio.sleep(600)

