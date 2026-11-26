"""Proposta de honorários calculada em código. A IA só apresenta; nunca inventa valor.

Modelo do escritório: honorário inicial FIXO (parcelável) + êxito de X% sobre a economia gerada (parcelável).
Dívidas acima do limite não recebem proposta pelo WhatsApp: vão para reunião online com o advogado.
"""
from __future__ import annotations

import re

from .config import settings


def configurado() -> bool:
    return settings().honorarios_fixo > 0


def vai_para_reuniao(valor_divida: float | None) -> bool:
    return bool(valor_divida) and valor_divida > settings().limite_fechamento_whatsapp


def _brl(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def calcular(valor_divida: float) -> dict:
    s = settings()
    if vai_para_reuniao(valor_divida):
        return {"levar_para_reuniao": True,
                "instrucao": f"Dívida acima de {_brl(s.limite_fechamento_whatsapp)}: NÃO apresente valores. Diga "
                             "que, pelo tamanho e importância do caso, o Dr. analisa pessoalmente numa reunião "
                             "online gratuita, e agende com consultar_horarios/agendar_reuniao."}
    if not configurado():
        return {"configurado": False,
                "instrucao": "Honorários não configurados. Não cite valores: chame transferir_humano com motivo "
                             "'enviar proposta de honorários'."}
    n = max(1, s.honorarios_parcelas_max)
    exito_parc = (f"também pode ser parcelado em até {s.exito_parcelas_max}x" if s.exito_parcelas_max > 1
                  else "também pode ser parcelado, em condições combinadas quando o resultado vier")
    return {
        "configurado": True,
        "levar_para_reuniao": False,
        "inicial": {"valor": s.honorarios_fixo, "valor_fmt": _brl(s.honorarios_fixo),
                    "parcelas_max": n, "valor_parcela_fmt": _brl(s.honorarios_fixo / n)},
        "exito": {"pct_sobre_economia": s.honorarios_exito_pct, "parcelamento": exito_parc},
        "instrucao": "Apresente: honorário inicial (à vista ou parcelado, com estes valores) + êxito de X% sobre a "
                     "economia que for gerada, pago só se houver economia, e que também pode ser parcelado. Não "
                     "estime quanto será a economia. Termine com 'Vamos começar?'.",
    }


def cpf_valido(cpf: str) -> bool:
    d = re.sub(r"\D", "", cpf or "")
    if len(d) != 11 or d == d[0] * 11:
        return False
    for i in (9, 10):
        soma = sum(int(d[j]) * ((i + 1) - j) for j in range(i))
        if (soma * 10 % 11) % 10 != int(d[i]):
            return False
    return True
