"""Pontuação determinística do lead (0-100). O modelo coleta os dados; a régua é sua, em código.

Ajuste os pesos aqui conforme você descobrir quais leads viram contrato assinado.
"""
from __future__ import annotations

from datetime import date

MODALIDADES_FORTES = {"veiculo", "pessoal_nao_consignado", "cartao_rotativo", "cartao_parcelado",
                      "cheque_especial"}


def pontuar(d: dict) -> tuple[int, str, list[str]]:
    pts = 0
    motivos: list[str] = []
    bloqueios: list[str] = []

    valor = max(float(d.get("valor_financiado") or 0), float(d.get("valor_divida_atual") or 0))
    if valor >= 50_000:
        pts += 25; motivos.append("valor alto (>= R$50 mil)")
    elif valor >= 20_000:
        pts += 18; motivos.append("valor bom (>= R$20 mil)")
    elif valor >= 8_000:
        pts += 8; motivos.append("valor médio")
    elif valor > 0:
        motivos.append("valor baixo: honorário provavelmente não compensa")

    potencial = d.get("potencial_juros")
    pts += {"forte": 30, "moderado": 15, "fraco": 0}.get(potencial, 5)
    if potencial:
        motivos.append(f"juros vs média BACEN: {potencial} ({d.get('multiplo_da_media')}x)")

    if d.get("modalidade") in MODALIDADES_FORTES:
        pts += 5
    if d.get("tem_seguro_ou_tarifas"):
        pts += 10; motivos.append("seguro/tarifas embutidos (Temas 958/972 STJ)")
    if d.get("tem_contrato_em_maos"):
        pts += 10; motivos.append("tem o contrato")
    elif d.get("consegue_obter_contrato"):
        pts += 5

    parcelas_restantes = int(d.get("parcelas_restantes") or 0)
    if parcelas_restantes >= 12:
        pts += 8; motivos.append(f"{parcelas_restantes} parcelas a vencer")

    if d.get("risco_busca_apreensao"):
        pts += 12; motivos.append("URGENTE: atraso em veículo / risco de busca e apreensão")

    if d.get("cobranca_judicial"):
        pts += 5; motivos.append("já há cobrança judicial")

    if d.get("decisor") is False:
        pts -= 15; motivos.append("quem fala não é o titular")

    ano = d.get("ano_contrato")
    if ano and date.today().year - int(ano) > 10:
        bloqueios.append("contrato com mais de 10 anos (prescrição)")
    if d.get("ja_tem_advogado_ou_acao"):
        bloqueios.append("já tem ação/advogado")
    if d.get("quitado_ha_mais_de_10_anos"):
        bloqueios.append("quitado há mais de 10 anos")

    pts = max(0, min(100, pts))
    if bloqueios:
        return pts, "desqualificado", motivos + bloqueios
    if pts >= 55 or d.get("risco_busca_apreensao"):
        return pts, "quente", motivos
    if pts >= 35:
        return pts, "morno", motivos
    return pts, "frio", motivos
