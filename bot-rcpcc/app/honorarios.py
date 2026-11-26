"""Proposta de honorários calculada em código. A IA só apresenta; nunca inventa valor.

Modelo do funil: honorários iniciais (% da dívida, com mínimo) + êxito (% da redução obtida).
Opções: boleto (entrada + parcelas), cartão (parcelado com acréscimo) ou à vista (com desconto).
"""
from __future__ import annotations

import math
import re

from .config import settings


def _charm(v: float) -> int:
    """Arredonda para cima terminando em 7 (ex.: 488 -> 497), como no funil."""
    return int(math.ceil((v + 3) / 10) * 10 - 3)


def configurado() -> bool:
    return settings().honorarios_inicial_pct > 0


def calcular(valor_divida: float) -> dict:
    s = settings()
    if not configurado():
        return {"configurado": False,
                "instrucao": "Honorários ainda não configurados pelo escritório. Não cite valores: diga que a "
                             "equipe envia a proposta e chame transferir_humano com motivo 'enviar proposta'."}
    base = max(s.honorarios_inicial_minimo, valor_divida * s.honorarios_inicial_pct / 100)

    n_b = s.honorarios_parcelas_boleto
    entrada = _charm(base * s.honorarios_entrada_pct / 100)
    parc_b = _charm((base - entrada) / n_b)
    total_b = entrada + parc_b * n_b

    n_c = s.honorarios_parcelas_cartao
    parc_c = _charm(total_b * (1 + s.honorarios_acrescimo_cartao_pct / 100) / n_c)
    total_c = parc_c * n_c

    avista = round(total_b * (1 - s.honorarios_desconto_avista_pct / 100))
    return {
        "configurado": True,
        "valor_divida_considerado": round(valor_divida, 2),
        "boleto": {"entrada": entrada, "parcelas": n_b, "valor_parcela": parc_b, "total": total_b},
        "cartao": {"parcelas": n_c, "valor_parcela": parc_c, "total": total_c},
        "avista": {"valor": avista, "desconto_pct": s.honorarios_desconto_avista_pct},
        "exito_pct_sobre_reducao": s.honorarios_exito_pct,
        "instrucao": "Apresente as 3 formas exatamente com estes valores, mais o êxito como percentual da "
                     "redução que for obtida (sem estimar a redução). Depois pergunte: 'Vamos começar?'",
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
