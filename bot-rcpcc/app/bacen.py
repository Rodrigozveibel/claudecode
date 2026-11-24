"""Comparação da taxa do contrato com a taxa média de mercado do Banco Central (SGS).

Base jurídica da triagem: STJ, REsp 1.061.530/RS (repetitivo) - a abusividade dos juros
remuneratórios se afere caso a caso, tendo a taxa média de mercado do BACEN para a
modalidade e o mês da contratação como referência. Súmula 382/STJ: juros acima de 12% a.a.
por si sós NÃO indicam abusividade. O múltiplo da média usado aqui é critério INTERNO de
triagem comercial, não parâmetro jurídico fixo.
"""
from __future__ import annotations

import time
from datetime import date

import httpx

# Séries SGS mensais (% a.m.), recursos livres, pessoa física.
# Conferidas em dadosabertos.bcb.gov.br; 25478 (cartão parcelado) não confirmada - revise.
SERIES = {
    "veiculo": 25471,                  # Aquisição de veículos
    "pessoal_nao_consignado": 25464,   # Crédito pessoal não consignado
    "consignado_inss": 25468,          # Consignado INSS (aposentados/pensionistas)
    "consignado_privado": 25466,       # Consignado trabalhador setor privado
    "consignado_publico": 25467,       # Consignado servidor público (confirmar)
    "consignado_total": 25469,
    "cheque_especial": 25463,
    "cartao_rotativo": 25477,
    "cartao_parcelado": 25478,         # confirmar
}

_cache: dict[tuple[int, str], tuple[float, float]] = {}


def taxa_implicita_mensal(valor_financiado: float, parcela: float, n_parcelas: int) -> float | None:
    """Taxa mensal (%) da Tabela Price a partir de valor liberado, parcela e prazo.

    O lead raramente sabe a taxa, mas sabe quanto pegou, quanto paga e em quantas vezes.
    Nota: se o valor financiado embutir tarifas/seguros, o resultado se aproxima do CET.
    """
    if valor_financiado <= 0 or parcela <= 0 or n_parcelas <= 0:
        return None
    if parcela * n_parcelas <= valor_financiado:
        return 0.0

    def pv(i: float) -> float:
        return parcela * (1 - (1 + i) ** -n_parcelas) / i

    lo, hi = 1e-7, 1.0  # 0% a 100% a.m.
    for _ in range(200):
        mid = (lo + hi) / 2
        if pv(mid) > valor_financiado:
            lo = mid
        else:
            hi = mid
    return round((lo + hi) / 2 * 100, 4)


def mensal_para_anual(taxa_mensal_pct: float) -> float:
    return round(((1 + taxa_mensal_pct / 100) ** 12 - 1) * 100, 2)


async def taxa_media_bacen(modalidade: str, mes_contratacao: str) -> tuple[float, str] | None:
    """Retorna (taxa média % a.m., mês de referência) para a modalidade.

    mes_contratacao: 'MM/AAAA'. Se o mês ainda não foi publicado, usa o último disponível.
    """
    serie = SERIES.get(modalidade)
    if not serie:
        return None
    key = (serie, mes_contratacao)
    hit = _cache.get(key)
    if hit and time.time() - hit[1] < 86400:
        return hit[0], mes_contratacao

    try:
        mes, ano = mes_contratacao.split("/")
        ini = f"01/{int(mes):02d}/{int(ano)}"
    except ValueError:
        return None
    base = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados"
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(base, params={"formato": "json", "dataInicial": ini, "dataFinal": ini})
        dados = r.json() if r.status_code == 200 else []
        ref = mes_contratacao
        if not dados:
            r = await c.get(f"{base}/ultimos/1", params={"formato": "json"})
            dados = r.json() if r.status_code == 200 else []
            if not dados:
                return None
            ref = dados[-1]["data"][3:]
    valor = float(dados[-1]["valor"])
    _cache[key] = (valor, time.time())
    return valor, ref


async def comparar(
    modalidade: str,
    mes_contratacao: str,
    taxa_contrato_mensal: float | None = None,
    valor_financiado: float | None = None,
    parcela: float | None = None,
    n_parcelas: int | None = None,
) -> dict:
    fonte = "informada"
    taxa = taxa_contrato_mensal
    if taxa is None and valor_financiado and parcela and n_parcelas:
        taxa = taxa_implicita_mensal(valor_financiado, parcela, n_parcelas)
        fonte = "calculada (Price, aproxima o CET)"
    if taxa is None:
        return {"erro": "Preciso da taxa mensal OU de valor financiado + parcela + nº de parcelas."}

    media = await taxa_media_bacen(modalidade, mes_contratacao)
    if media is None:
        return {"erro": f"Modalidade desconhecida ou BACEN indisponível. Use uma de: {list(SERIES)}"}
    media_valor, ref = media
    multiplo = round(taxa / media_valor, 2) if media_valor else None
    if multiplo is None:
        faixa = "indeterminado"
    elif multiplo >= 1.5:
        faixa = "forte"       # bem acima da média: tese de juros abusivos tem fôlego
    elif multiplo >= 1.25:
        faixa = "moderado"    # depende de tarifas/seguros e do caso concreto
    else:
        faixa = "fraco"       # juros dentro do mercado: só vale se houver outra tese
    return {
        "taxa_contrato_am": taxa,
        "taxa_contrato_aa": mensal_para_anual(taxa),
        "fonte_taxa": fonte,
        "media_bacen_am": media_valor,
        "media_bacen_aa": mensal_para_anual(media_valor),
        "mes_referencia_bacen": ref,
        "multiplo_da_media": multiplo,
        "potencial_juros": faixa,
        "aviso": "Triagem preliminar interna. NÃO informe ao lead percentual de ganho nem garanta resultado.",
    }


def contrato_dentro_prazo(ano_contrato: int, hoje: date | None = None) -> bool:
    """Repetição de indébito em contrato bancário: prazo decenal (art. 205 CC; STJ)."""
    hoje = hoje or date.today()
    return hoje.year - ano_contrato <= 10
