"""Cérebro do robô: Claude + ferramentas de triagem, cálculo, agenda e transferência."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from zoneinfo import ZoneInfo

import anthropic

from . import agenda, audio, bacen, db, digisac
from .config import settings
from .prompts import system_prompt
from .score import pontuar

log = logging.getLogger("agent")
_client: anthropic.AsyncAnthropic | None = None


def client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings().anthropic_api_key or None, max_retries=4)
    return _client


def _nullable(t: str, desc: str, **extra) -> dict:
    return {"type": [t, "null"], "description": desc, **extra}


LEAD_FIELDS = {
    "nome": _nullable("string", "Nome do lead"),
    "cidade_uf": _nullable("string", "Cidade/UF"),
    "banco": _nullable("string", "Banco/financeira"),
    "modalidade": _nullable("string", "Modalidade", enum=[*bacen.SERIES.keys(), "outro", None]),
    "mes_contratacao": _nullable("string", "MM/AAAA"),
    "ano_contrato": _nullable("integer", "Ano do contrato"),
    "valor_financiado": _nullable("number", "Valor liberado/financiado em R$"),
    "parcela": _nullable("number", "Valor da parcela em R$"),
    "n_parcelas": _nullable("integer", "Total de parcelas"),
    "parcelas_pagas": _nullable("integer", "Parcelas já pagas"),
    "parcelas_restantes": _nullable("integer", "Parcelas a vencer"),
    "taxa_mensal_contrato": _nullable("number", "Taxa mensal % do contrato, se conhecida"),
    "em_dia": _nullable("boolean", "Está em dia com as parcelas"),
    "risco_busca_apreensao": _nullable("boolean", "Veículo atrasado com notificação/ação de busca e apreensão"),
    "tem_contrato_em_maos": _nullable("boolean", "Já tem/enviou o contrato"),
    "consegue_obter_contrato": _nullable("boolean", "Consegue obter o contrato"),
    "tem_seguro_ou_tarifas": _nullable("boolean", "Seguro prestamista/tarifas embutidos"),
    "decisor": _nullable("boolean", "Quem conversa é o titular do contrato"),
    "ja_tem_advogado_ou_acao": _nullable("boolean", "Já tem advogado ou ação sobre o contrato"),
    "quitado_ha_mais_de_10_anos": _nullable("boolean", "Contrato quitado há mais de 10 anos"),
    "superendividado": _nullable("boolean", "Várias dívidas comprometendo o mínimo existencial"),
    "observacoes": _nullable("string", "Resumo livre do caso"),
}


def _strict(name: str, desc: str, props: dict) -> dict:
    return {
        "name": name, "description": desc, "strict": True,
        "input_schema": {"type": "object", "properties": props, "required": list(props),
                         "additionalProperties": False},
    }


TOOLS = [
    _strict("analisar_taxa",
            "Compara a taxa do contrato com a média do BACEN da modalidade no mês da contratação. "
            "Se não souber a taxa, passe valor_financiado+parcela+n_parcelas e ela é calculada.",
            {
                "modalidade": {"type": "string", "enum": list(bacen.SERIES)},
                "mes_contratacao": {"type": "string", "description": "MM/AAAA"},
                "taxa_mensal_contrato": _nullable("number", "% ao mês"),
                "valor_financiado": _nullable("number", "R$"),
                "parcela": _nullable("number", "R$"),
                "n_parcelas": _nullable("integer", "total de parcelas"),
            }),
    _strict("registrar_lead",
            "Salva a ficha do lead com TODOS os dados conhecidos até agora (null no que não souber) e "
            "devolve score, classificação (quente/morno/frio/desqualificado) e motivos.",
            LEAD_FIELDS),
    _strict("consultar_horarios", "Lista horários livres na agenda do advogado.", {}),
    _strict("agendar_reuniao",
            "Marca a reunião com o advogado. Só para leads quente/morno que aceitaram.",
            {
                "inicio_iso": _nullable("string", "Horário escolhido, exatamente como veio de consultar_horarios"),
                "preferencia": _nullable("string", "Se não houver agenda automática: dia/turno preferido"),
                "modalidade": {"type": "string", "enum": ["online", "presencial"]},
                "resumo_caso": {"type": "string", "description": "Resumo objetivo do caso para o advogado"},
            }),
    _strict("transferir_humano",
            "Passa a conversa para a equipe humana e avisa o advogado.",
            {
                "motivo": {"type": "string"},
                "urgente": {"type": "boolean"},
                "resumo_caso": {"type": "string"},
            }),
    _strict("encerrar_atendimento",
            "Encerra o atendimento de lead sem perfil, depois de se despedir.",
            {"motivo": {"type": "string"}}),
]


@dataclass
class Contexto:
    contact_id: str
    telefone: str = ""
    status_novo: str | None = None
    eventos: list[str] = field(default_factory=list)


async def _avisar_advogado(ctx: Contexto, titulo: str, corpo: str) -> None:
    s = settings()
    lead = db.get_lead(ctx.contact_id)
    texto = (f"*{titulo}*\n{corpo}\n\nLead: {lead.get('nome') or '-'} | {ctx.telefone or ctx.contact_id}\n"
             f"Score: {lead.get('_score')} ({lead.get('_classificacao')})\n"
             f"Motivos: {', '.join(lead.get('_motivos', []))}")
    if s.advogado_whatsapp:
        try:
            await digisac.enviar_texto_numero(s.advogado_whatsapp, texto)
        except Exception:
            log.exception("Falha ao avisar advogado")


async def executar_tool(ctx: Contexto, nome: str, args: dict) -> str:
    try:
        if nome == "analisar_taxa":
            r = await bacen.comparar(
                args["modalidade"], args["mes_contratacao"], args.get("taxa_mensal_contrato"),
                args.get("valor_financiado"), args.get("parcela"), args.get("n_parcelas"))
            if "erro" not in r:
                lead = db.get_lead(ctx.contact_id)
                lead.update({k: r[k] for k in ("potencial_juros", "multiplo_da_media", "taxa_contrato_am",
                                                "media_bacen_am", "mes_referencia_bacen")})
                db.salvar_lead(ctx.contact_id, lead, lead.get("_score"), lead.get("_classificacao"))
            return json.dumps(r, ensure_ascii=False)

        if nome == "registrar_lead":
            lead = db.get_lead(ctx.contact_id)
            lead.update({k: v for k, v in args.items() if v is not None})
            score, classe, motivos = pontuar(lead)
            lead.update({"_score": score, "_classificacao": classe, "_motivos": motivos})
            db.salvar_lead(ctx.contact_id, lead, score, classe)
            faltando = [k for k in ("modalidade", "mes_contratacao", "valor_financiado", "parcela",
                                    "n_parcelas", "em_dia", "tem_contrato_em_maos")
                        if lead.get(k) is None]
            if lead.get("potencial_juros") is None:
                faltando.append("analisar_taxa ainda não rodou")
            return json.dumps({"score": score, "classificacao": classe, "motivos": motivos,
                               "faltando": faltando}, ensure_ascii=False)

        if nome == "consultar_horarios":
            if not agenda.agenda_configurada():
                return json.dumps({"agenda_automatica": False,
                                   "instrucao": "Pergunte dia e turno preferidos e use agendar_reuniao com 'preferencia'."})
            tz = ZoneInfo(settings().fuso)
            opcoes = await agenda.horarios_livres()
            legiveis = [datetime.fromisoformat(o).astimezone(tz).strftime("%a %d/%m %H:%M") for o in opcoes]
            return json.dumps({"opcoes": [{"inicio_iso": o, "legivel": l} for o, l in zip(opcoes, legiveis)],
                               "dica": "Ofereça 2 ou 3 opções, não todas."}, ensure_ascii=False)

        if nome == "agendar_reuniao":
            lead = db.get_lead(ctx.contact_id)
            if lead.get("_classificacao") in (None, "frio", "desqualificado"):
                return json.dumps({"ok": False, "erro": "Lead não qualificado. Rode registrar_lead primeiro; "
                                   "só agende quente ou morno."})
            if args.get("inicio_iso") and agenda.agenda_configurada():
                r = await agenda.criar_evento(args["inicio_iso"], lead.get("nome") or "Lead",
                                              ctx.telefone, args["resumo_caso"], args["modalidade"])
                if r.get("ok"):
                    ctx.status_novo = "agendado"
                    await _avisar_advogado(ctx, "Reunião agendada (RCPCC)",
                                           f"{r['inicio']} - {r['local']}\n{args['resumo_caso']}")
                    await digisac.transferir_ticket(ctx.contact_id, f"Reunião marcada {r['inicio']}. {args['resumo_caso']}")
                return json.dumps(r, ensure_ascii=False)
            ctx.status_novo = "agendar_manual"
            await _avisar_advogado(ctx, "Lead qualificado quer reunião - CONFIRMAR HORÁRIO",
                                   f"Preferência: {args.get('preferencia')} ({args['modalidade']})\n{args['resumo_caso']}")
            await digisac.transferir_ticket(ctx.contact_id, f"Confirmar reunião: {args.get('preferencia')}")
            return json.dumps({"ok": True, "pendente_confirmacao": True,
                               "instrucao": "Diga que a equipe confirma o horário em breve por aqui."})

        if nome == "transferir_humano":
            ctx.status_novo = "humano"
            titulo = "URGENTE - " if args["urgente"] else ""
            await _avisar_advogado(ctx, f"{titulo}Transferência para humano", f"{args['motivo']}\n{args['resumo_caso']}")
            await digisac.transferir_ticket(ctx.contact_id, f"{titulo}{args['motivo']}: {args['resumo_caso']}")
            return json.dumps({"ok": True, "instrucao": "Avise que um membro da equipe vai continuar o atendimento."})

        if nome == "encerrar_atendimento":
            ctx.status_novo = "encerrado"
            ctx.eventos.append("encerrar")
            return json.dumps({"ok": True})

        return json.dumps({"erro": f"ferramenta desconhecida {nome}"})
    except Exception as e:  # nunca derrube a conversa por erro de integração
        log.exception("Erro na ferramenta %s", nome)
        return json.dumps({"erro": f"falha técnica: {e}. Siga a conversa sem essa informação."})


async def responder(ctx: Contexto, historico: list[dict], conteudo_usuario: list[dict]) -> tuple[str, list[dict]]:
    """Roda o loop de ferramentas. Devolve (texto final para o lead, histórico atualizado)."""
    s = settings()
    messages = historico + [{"role": "user", "content": conteudo_usuario}]
    system = [{"type": "text", "text": system_prompt(audio.audio_disponivel(), agenda.agenda_configurada()),
               "cache_control": {"type": "ephemeral"}}]

    texto_final = ""
    for _ in range(10):
        resp = await client().beta.messages.create(
            model=s.claude_model,
            max_tokens=16000,
            system=system,
            tools=TOOLS,
            messages=messages,
            output_config={"effort": s.claude_effort},
            cache_control={"type": "ephemeral"},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
        if resp.stop_reason == "refusal":
            log.warning("Recusa do modelo para %s: %s", ctx.contact_id, resp.stop_details)
            await executar_tool(ctx, "transferir_humano", {
                "motivo": "robô não conseguiu responder", "urgente": False, "resumo_caso": "ver conversa"})
            return "Vou pedir para alguém da equipe continuar com você por aqui, tudo bem?", messages

        messages.append({"role": "assistant",
                         "content": [b.model_dump(mode="json", exclude_none=True) for b in resp.content]})
        textos = [b.text for b in resp.content if b.type == "text" and b.text.strip()]
        if textos:
            texto_final = "\n\n".join(textos)

        if resp.stop_reason == "pause_turn":
            continue
        uses = [b for b in resp.content if b.type == "tool_use"]
        if not uses:
            break
        resultados = []
        for u in uses:
            out = await executar_tool(ctx, u.name, u.input)
            resultados.append({"type": "tool_result", "tool_use_id": u.id, "content": out})
        messages.append({"role": "user", "content": resultados})
    return texto_final, messages
