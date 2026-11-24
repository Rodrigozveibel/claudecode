"""Decide se a conversa veio do criativo RCPCC (fluxo completo) ou não (filtro rápido de uma pergunta).

Ordem de confiabilidade:
1. Conexão dedicada à campanha (serviceId) - 100% confiável.
2. ID do anúncio no referral do Click-to-WhatsApp, se o Digisac repassar no webhook.
3. Texto pré-preenchido do link do anúncio (ex.: "Quero revisar meu contrato #RCPCC") ou palavra-chave.
"""
from __future__ import annotations

import json
import unicodedata

from .config import settings


def _norm(t: str) -> str:
    t = unicodedata.normalize("NFKD", t or "").encode("ascii", "ignore").decode()
    return " ".join(t.lower().split())


def detectar(evento: dict, msg: dict) -> tuple[str, str]:
    """Retorna (fluxo, motivo). fluxo: 'rcpcc' ou 'geral'."""
    s = settings()
    if msg.get("serviceId") and msg["serviceId"] in s.lista("rcpcc_service_ids"):
        return "rcpcc", "conexão dedicada à campanha"
    bruto = json.dumps(evento, ensure_ascii=False)
    for ad in s.lista("rcpcc_ad_ids"):
        if ad and ad in bruto:
            return "rcpcc", f"anúncio {ad}"
    texto = _norm(msg.get("text") or "")
    for g in s.lista("rcpcc_gatilhos"):
        if g and _norm(g) in texto:
            return "rcpcc", f"gatilho '{g}'"
    return "geral", "sem marca do criativo"
