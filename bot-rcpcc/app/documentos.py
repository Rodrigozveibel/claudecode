"""Gera contrato de honorários, procuração e pré-laudo de juros no timbrado do escritório.

Saída: PDF no timbrado oficial (para assinatura digital) + DOCX editável (para ajustes).
Tudo é MINUTA para revisão do advogado antes de seguir ao cliente.
"""
from __future__ import annotations

import io
import logging
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from . import bacen
from .config import settings

log = logging.getLogger("documentos")
BASE = Path(__file__).resolve().parent.parent
TIMBRADO = BASE / "templates" / "timbrado.pdf"
PREENCHER = "[PREENCHER]"
MODALIDADES = {"veiculo": "aquisição de veículos", "pessoal_nao_consignado": "crédito pessoal não consignado",
               "consignado_inss": "crédito consignado INSS", "consignado_privado": "consignado setor privado",
               "consignado_publico": "consignado setor público", "consignado_total": "crédito consignado",
               "cheque_especial": "cheque especial", "cartao_rotativo": "cartão de crédito rotativo",
               "cartao_parcelado": "cartão de crédito parcelado"}
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro",
         "novembro", "dezembro"]


# ---------------------------------------------------------------- utilidades
def brl(v: float | None) -> str:
    if v is None:
        return PREENCHER
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


_UN = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze",
       "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
_DZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
_CT = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos",
       "novecentos"]


def _ate_mil(n: int) -> str:
    if n == 0:
        return ""
    if n == 100:
        return "cem"
    c, r = divmod(n, 100)
    partes = [_CT[c]] if c else []
    if r:
        if r < 20:
            partes.append(_UN[r])
        else:
            d, u = divmod(r, 10)
            partes.append(_DZ[d] + (f" e {_UN[u]}" if u else ""))
    return " e ".join(partes)


def extenso_reais(v: float) -> str:
    reais = int(v)
    centavos = round((v - reais) * 100)
    if reais == 0 and centavos == 0:
        return "zero reais"
    grupos = []
    milhoes, resto = divmod(reais, 1_000_000)
    milhares, unidades = divmod(resto, 1000)
    if milhoes:
        grupos.append(_ate_mil(milhoes) + (" milhão" if milhoes == 1 else " milhões"))
    if milhares:
        grupos.append("mil" if milhares == 1 else _ate_mil(milhares) + " mil")
    if unidades:
        grupos.append(_ate_mil(unidades))
    txt = ""
    for i, g in enumerate(grupos):
        if i == 0:
            txt = g
        else:
            ultimo = i == len(grupos) - 1
            txt += (" e " if ultimo and (unidades < 100 or unidades % 100 == 0) else " ") + g
    if reais:
        txt += (" de reais" if reais % 1_000_000 == 0 and milhoes else (" real" if reais == 1 else " reais"))
    if centavos:
        txt += (" e " if reais else "") + _ate_mil(centavos) + (" centavo" if centavos == 1 else " centavos")
    return txt


def data_extenso(d: date | None = None) -> str:
    d = d or date.today()
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


def _v(x) -> str:
    return str(x).strip() if x not in (None, "") else PREENCHER


# ---------------------------------------------------------------- render
@dataclass
class Bloco:
    tipo: str  # titulo | subtitulo | texto | centro | assinatura | tabela | espaco
    texto: str = ""
    linhas: list | None = None


_ESTILOS = {
    "titulo": ParagraphStyle("t", fontName="Times-Bold", fontSize=13, alignment=TA_CENTER, spaceAfter=14),
    "subtitulo": ParagraphStyle("s", fontName="Times-Bold", fontSize=11, spaceBefore=8, spaceAfter=4),
    "texto": ParagraphStyle("p", fontName="Times-Roman", fontSize=11, leading=15, alignment=TA_JUSTIFY,
                            spaceAfter=6),
    "centro": ParagraphStyle("c", fontName="Times-Roman", fontSize=11, alignment=TA_CENTER, spaceAfter=6),
    "aviso": ParagraphStyle("a", fontName="Times-Bold", fontSize=9, alignment=TA_CENTER, spaceAfter=10,
                            textColor="#9b1c1c"),
}


def _negrito(t: str) -> str:
    """**trecho** vira negrito no PDF."""
    partes = _esc_keep(t).split("**")
    return "".join(f"<b>{p}</b>" if i % 2 else p for i, p in enumerate(partes))


def _esc_keep(t: str) -> str:
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("&lt;br/&gt;", "<br/>"))


def render_pdf(blocos: list[Bloco]) -> bytes:
    corpo = io.BytesIO()
    doc = SimpleDocTemplate(corpo, pagesize=A4, leftMargin=2.5 * cm, rightMargin=2.5 * cm,
                            topMargin=4.0 * cm, bottomMargin=4.6 * cm)
    flow = []
    for b in blocos:
        if b.tipo == "espaco":
            flow.append(Spacer(1, 18))
        elif b.tipo == "assinatura":
            flow += [Spacer(1, 26), Paragraph("_" * 45, _ESTILOS["centro"]),
                     Paragraph(_negrito(b.texto), _ESTILOS["centro"])]
        elif b.tipo == "tabela":
            t = Table([[Paragraph(_negrito(str(c)), _ESTILOS["texto"]) for c in row] for row in b.linhas],
                      colWidths=[9 * cm, 7 * cm])
            t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.4, "#999999"),
                                   ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
            flow += [t, Spacer(1, 8)]
        else:
            flow.append(Paragraph(_negrito(b.texto), _ESTILOS[b.tipo]))
    doc.build(flow)
    corpo.seek(0)

    if not TIMBRADO.exists():
        return corpo.getvalue()
    saida = PdfWriter()
    for pagina in PdfReader(corpo).pages:
        fundo = PdfReader(str(TIMBRADO)).pages[0]
        fundo.merge_page(pagina)
        saida.add_page(fundo)
    buf = io.BytesIO()
    saida.write(buf)
    return buf.getvalue()


def render_docx(blocos: list[Bloco]) -> bytes:
    import docx
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt

    d = docx.Document()
    st = d.styles["Normal"]
    st.font.name = "Times New Roman"
    st.font.size = Pt(11)

    def add(texto: str, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold_all=False, size=None):
        texto = texto.replace("<br/>", "\n")
        p = d.add_paragraph()
        p.alignment = align
        for i, parte in enumerate(texto.split("**")):
            r = p.add_run(parte)
            r.bold = bold_all or bool(i % 2)
            if size:
                r.font.size = Pt(size)
        return p

    for b in blocos:
        if b.tipo == "titulo":
            add(b.texto, WD_ALIGN_PARAGRAPH.CENTER, True, 13)
        elif b.tipo == "subtitulo":
            add(b.texto, WD_ALIGN_PARAGRAPH.LEFT, True)
        elif b.tipo in ("centro", "aviso"):
            add(b.texto, WD_ALIGN_PARAGRAPH.CENTER, b.tipo == "aviso")
        elif b.tipo == "assinatura":
            d.add_paragraph()
            add("_" * 45, WD_ALIGN_PARAGRAPH.CENTER)
            add(b.texto, WD_ALIGN_PARAGRAPH.CENTER)
        elif b.tipo == "tabela":
            t = d.add_table(rows=0, cols=2)
            t.style = "Table Grid"
            for row in b.linhas:
                cells = t.add_row().cells
                for c, val in zip(cells, row):
                    c.text = str(val).replace("**", "")
        elif b.tipo == "espaco":
            d.add_paragraph()
        else:
            add(b.texto)
    buf = io.BytesIO()
    d.save(buf)
    return buf.getvalue()


# ---------------------------------------------------------------- qualificações
def _qualif_cliente(c: dict) -> str:
    return (f"**{_v(c.get('nome_completo')).upper()}**, {_v(c.get('nacionalidade') or 'brasileiro(a)')}, "
            f"{_v(c.get('estado_civil'))}, {_v(c.get('profissao'))}, portador(a) da cédula de identidade "
            f"nº {_v(c.get('rg'))}, inscrito(a) no CPF sob o nº {_v(c.get('cpf'))}, residente e domiciliado(a) "
            f"em {_v(c.get('endereco_com_cep'))}, e-mail {_v(c.get('email'))}")


def _qualif_escritorio() -> str:
    s = settings()
    cpf = f", inscrito no CPF sob o nº {s.advogado_cpf}" if s.advogado_cpf else f", CPF nº {PREENCHER}"
    ec = f", {s.advogado_estado_civil}" if s.advogado_estado_civil else ""
    return (f"**{s.escritorio_razao_social}**, sociedade de advogados inscrita na OAB/SP sob o nº "
            f"{_v(s.escritorio_registro_oab)} e no CNPJ sob o nº {_v(s.escritorio_cnpj)}, com sede na "
            f"{_v(s.escritorio_endereco)}, em {_v(s.escritorio_cidade)}, representada neste ato por "
            f"**{s.advogado_nome_completo}**, brasileiro{ec}, advogado inscrito na {s.advogado_oab}{cpf}")


def pendencias_escritorio() -> list[str]:
    s = settings()
    nomes = {"escritorio_cnpj": "CNPJ", "escritorio_registro_oab": "registro da sociedade na OAB",
             "escritorio_cidade": "cidade da sede/foro", "advogado_cpf": "CPF do advogado"}
    return [v for k, v in nomes.items() if not getattr(s, k)]


# ---------------------------------------------------------------- contrato
def contrato(c: dict, banco: str | None, valor_divida: float | None) -> list[Bloco]:
    s = settings()
    fixo = s.honorarios_fixo
    if c.get("forma_pagamento") == "parcelado" and (c.get("parcelas") or 0) > 1:
        n = int(c["parcelas"])
        pagamento = (f"em {n} ({_ate_mil(n)}) parcelas mensais, iguais e sucessivas de {brl(fixo / n)} "
                     f"({extenso_reais(round(fixo / n, 2))})")
    else:
        pagamento = "à vista"
    cidade = _v(s.escritorio_cidade)
    return [
        Bloco("aviso", "MINUTA GERADA AUTOMATICAMENTE - REVISAR ANTES DE ENVIAR PARA ASSINATURA"),
        Bloco("titulo", "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS"),
        Bloco("texto", f"**CONTRATANTE:** {_qualif_cliente(c)}."),
        Bloco("texto", f"**CONTRATADO:** {_qualif_escritorio()}."),
        Bloco("texto", "As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de "
                       "Honorários Advocatícios, que se regerá pelas cláusulas e condições a seguir descritas."),
        Bloco("subtitulo", "DO OBJETO DO CONTRATO"),
        Bloco("texto", f"**Cláusula 1ª.** O presente contrato tem como objeto a prestação de serviços advocatícios "
                       f"visando à propositura de **AÇÃO REVISIONAL DE CONTRATO BANCÁRIO** a ser movida em desfavor "
                       f"de **{_v(banco).upper().rstrip(".")}**."),
        Bloco("texto", "**Parágrafo único.** O objeto específico desta prestação de serviços é ajuizar a demanda, "
                       "acompanhar a parte contratante em eventual audiência designada e proceder ao acompanhamento "
                       "do processo, inclusive na interposição dos recursos cabíveis."),
        Bloco("subtitulo", "DAS ATIVIDADES"),
        Bloco("texto", "**Cláusula 2ª.** O CONTRATADO deverá praticar todos os atos relacionados ao exercício da "
                       "advocacia, obrigações tipicamente de meio, particularmente aqueles constantes no Estatuto da "
                       "Ordem dos Advogados do Brasil, assim como o que for especificado na outorga da procuração, "
                       "com a diligência habitual que se presume da atuação profissional."),
        Bloco("subtitulo", "DOS ATOS PROCESSUAIS"),
        Bloco("texto", "**Cláusula 3ª.** A gestão do processo correrá por conta e responsabilidade do CONTRATADO, "
                       "podendo, se necessário, substabelecer os poderes que lhe foram conferidos pelo CONTRATANTE a "
                       "outro advogado."),
        Bloco("subtitulo", "DAS DESPESAS"),
        Bloco("texto", "**Cláusula 4ª.** Caberá ao CONTRATANTE, se necessário, o pagamento das custas e despesas "
                       "judiciais, em caso de indeferimento do benefício da gratuidade da justiça."),
        Bloco("subtitulo", "DOS HONORÁRIOS"),
        Bloco("texto", f"**Cláusula 5ª.** O CONTRATANTE, como contraprestação aos serviços jurídicos prestados, "
                       f"pagará ao CONTRATADO honorários iniciais de **{brl(fixo)} ({extenso_reais(fixo)})**, "
                       f"{pagamento}, mediante boleto, PIX ou cartão de crédito, conforme cobrança emitida pelo "
                       f"CONTRATADO, com vencimento da primeira parcela em {PREENCHER}."),
        Bloco("texto", f"**Subcláusula 1ª.** Consigna-se que, nesta data, o valor nominal da dívida do CONTRATANTE "
                       f"perante a instituição financeira adversa corresponde a **{brl(valor_divida)}** "
                       f"({extenso_reais(valor_divida) if valor_divida else PREENCHER})."),
        Bloco("texto", f"**Subcláusula 2ª.** Ao final, havendo acordo entre as partes litigantes ou sentença, "
                       f"caberá ainda ao CONTRATANTE o pagamento de **{s.honorarios_exito_pct:g}% "
                       f"({_ate_mil(int(s.honorarios_exito_pct))} por cento)** sobre a vantagem econômica auferida, "
                       f"assim entendida a diferença entre o valor nominal da dívida indicado na Subcláusula 1ª e o "
                       f"valor efetivamente pago para a quitação da dívida, por acordo ou liquidação de sentença. "
                       f"Estes honorários são devidos na data da celebração do acordo ou do trânsito em julgado e "
                       f"poderão ser parcelados mediante ajuste entre as partes."),
        Bloco("texto", "**Cláusula 6ª.** Os honorários de sucumbência pertencem ao CONTRATADO e não se confundem com "
                       "os honorários contratuais aqui tratados."),
        Bloco("texto", "**Parágrafo único.** Em caso de morte ou incapacidade civil do CONTRATADO, seus sucessores ou "
                       "representante legal receberão os honorários na proporção do trabalho realizado."),
        Bloco("texto", "**Cláusula 7ª.** Havendo acordo entre o CONTRATANTE e a parte contrária, ou desistência pelo "
                       "CONTRATANTE, este fato não prejudicará o recebimento de todos os honorários contratados e da "
                       "sucumbência, se houver, pelo CONTRATADO."),
        Bloco("texto", "**Cláusula 8ª.** O atraso no pagamento dos honorários ensejará multa de 10% (dez por cento) "
                       "sobre o valor devido, juros de mora de 1% (um por cento) ao mês e correção monetária pelo "
                       "IPCA."),
        Bloco("texto", "**Parágrafo primeiro.** Caso a mora seja superior a 30 (trinta) dias, é facultado ao "
                       "CONTRATADO rescindir este contrato de pleno direito, independentemente de medida judicial ou "
                       "extrajudicial, considerando-se vencidas as obrigações vincendas, que serão exigíveis de "
                       "imediato."),
        Bloco("texto", "**Parágrafo segundo.** Havendo necessidade de ação judicial para cobrança dos honorários aqui "
                       "estabelecidos, o valor principal será corrigido pelo IPCA, com juros de 1% ao mês, multa de "
                       "10% e honorários advocatícios de 20% sobre o valor cobrado."),
        Bloco("subtitulo", "DA VIGÊNCIA E DA RESCISÃO"),
        Bloco("texto", "**Cláusula 9ª.** Este contrato tem vigência até o adimplemento das obrigações ajustadas e pode "
                       "ser rescindido a qualquer tempo por qualquer das partes, mediante aviso prévio de 30 (trinta) "
                       "dias, por escrito e com comprovante de entrega."),
        Bloco("texto", "**Subcláusula 1ª.** Na hipótese de rescisão antecipada pelo CONTRATANTE, este deverá pagar "
                       "todos os valores pactuados neste contrato e, quanto aos honorários de êxito, percentual "
                       "correspondente à parcela do serviço executada pelo CONTRATADO, nunca inferior a 50% "
                       "(cinquenta por cento) do total. Os valores já recebidos pelo CONTRATADO não serão devolvidos."),
        Bloco("texto", "**Subcláusula 2ª.** Na hipótese de rescisão antecipada pelo CONTRATADO, haverá cobrança de "
                       "honorários proporcionais aos serviços prestados."),
        Bloco("subtitulo", "DA RESPONSABILIDADE"),
        Bloco("texto", "**Cláusula 10ª.** O CONTRATADO não será responsabilizado por danos que sobrevierem das "
                       "demandas que patrocinar, cabendo-lhe tão somente o emprego diligente de seus conhecimentos, "
                       "meios e técnicas na defesa dos interesses do CONTRATANTE, **inexistindo qualquer garantia de "
                       "resultado**."),
        Bloco("texto", "**Cláusula 11ª.** O CONTRATADO não será responsabilizado por danos decorrentes do "
                       "desconhecimento de informações e documentos substanciais ou da impossibilidade de contato com "
                       "o CONTRATANTE, que deverá manter atualizadas suas informações cadastrais."),
        Bloco("texto", "**Cláusula 12ª.** É obrigação do CONTRATANTE, sempre que solicitado, entregar ao CONTRATADO "
                       "todos os documentos, provas, informações e subsídios necessários, em tempo hábil. Qualquer "
                       "omissão ou negligência do CONTRATANTE será de sua inteira responsabilidade."),
        Bloco("subtitulo", "DO FORO"),
        Bloco("texto", f"**Cláusula 13ª.** Para dirimir quaisquer controvérsias oriundas deste contrato, as partes "
                       f"elegem o foro da comarca de {cidade}."),
        Bloco("texto", "Por estarem assim justos e contratados, firmam o presente instrumento, inclusive por meio "
                       "de assinatura eletrônica, nos termos do art. 10, § 2º, da MP 2.200-2/2001."),
        Bloco("centro", f"{cidade}, {data_extenso()}."),
        Bloco("assinatura", f"**CONTRATANTE**<br/>{_v(c.get('nome_completo')).upper()}"),
        Bloco("assinatura", f"**CONTRATADO**<br/>{s.escritorio_razao_social}"),
    ]


def procuracao(c: dict, banco: str | None) -> list[Bloco]:
    s = settings()
    cidade = _v(s.escritorio_cidade)
    return [
        Bloco("aviso", "MINUTA GERADA AUTOMATICAMENTE - REVISAR ANTES DE ENVIAR PARA ASSINATURA"),
        Bloco("titulo", "PROCURAÇÃO"),
        Bloco("texto", f"**OUTORGANTE:** {_qualif_cliente(c)}."),
        Bloco("texto", f"**OUTORGADOS:** {_qualif_escritorio()}."),
        Bloco("texto", "**PODERES:** O OUTORGANTE nomeia e constitui os OUTORGADOS seus procuradores, outorgando-lhes "
                       "os poderes da cláusula *ad judicia et extra* para representá-lo em juízo ou fora dele, "
                       "podendo propor a ação, requerer, assinar, transigir, desistir, discordar, ratificar, "
                       "retificar, receber quantias e intimações, dar quitação, firmar acordos, interpor e acompanhar "
                       "recursos em todas as instâncias, responder perante qualquer repartição pública ou privada, "
                       "autarquia ou órgão federal, estadual ou municipal, e praticar todos os demais atos "
                       "necessários ao integral cumprimento deste mandato, podendo ainda substabelecer, no todo ou em "
                       "parte, com ou sem reserva de poderes, especialmente para a propositura e o acompanhamento de "
                       f"**AÇÃO REVISIONAL DE CONTRATO BANCÁRIO** em face de **{_v(banco).upper().rstrip(".")}**."),
        Bloco("subtitulo", "DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA"),
        Bloco("texto", "Sob as penas da lei, nos termos dos arts. 98 e 99 do Código de Processo Civil, DECLARO que não "
                       "disponho de recursos suficientes para pagar as custas, as despesas processuais e os "
                       "honorários advocatícios sem prejuízo do sustento próprio e de minha família, razão pela qual "
                       "requeiro os benefícios da gratuidade da justiça. Declaro ciência de que a contratação de "
                       "advogado particular não impede a concessão do benefício (art. 99, § 4º, do CPC)."),
        Bloco("texto", "Por ser expressão da verdade, assino a presente."),
        Bloco("centro", f"{cidade}, {data_extenso()}."),
        Bloco("assinatura", f"**OUTORGANTE**<br/>{_v(c.get('nome_completo')).upper()}"),
    ]


# ---------------------------------------------------------------- pré-laudo
def calcular_laudo(lead: dict, media_am: float | None, mes_ref: str | None) -> dict | None:
    pv, pmt, n = lead.get("valor_financiado"), lead.get("parcela"), lead.get("n_parcelas")
    if not (pv and pmt and n and media_am):
        return None
    pagas = int(lead.get("parcelas_pagas") or 0)
    taxa_real = bacen.taxa_implicita_mensal(pv, pmt, int(n))
    i = media_am / 100
    pmt_media = round(pv * i / (1 - (1 + i) ** -int(n)), 2)
    exc_parc = round(pmt - pmt_media, 2)
    return {
        "valor_financiado": pv, "parcela": pmt, "n": int(n), "pagas": pagas,
        "taxa_contratada_am": lead.get("taxa_mensal_contrato"),
        "taxa_real_am": taxa_real, "taxa_real_aa": bacen.mensal_para_anual(taxa_real),
        "media_am": media_am, "media_aa": bacen.mensal_para_anual(media_am), "mes_ref": mes_ref,
        "serie": bacen.SERIES.get(lead.get("modalidade") or ""),
        "pmt_media": pmt_media, "excesso_parcela": exc_parc,
        "excesso_total": round(exc_parc * int(n), 2),
        "pago_a_maior": round(exc_parc * pagas, 2),
        "pago_a_maior_dobro": round(exc_parc * pagas * 2, 2),
        "a_excluir": round(exc_parc * (int(n) - pagas), 2),
        "multiplo": round(taxa_real / media_am, 2) if media_am else None,
    }


def pre_laudo(lead: dict, r: dict) -> list[Bloco]:
    nome = _v((lead.get("contratante") or {}).get("nome_completo") or lead.get("nome")).upper()
    pct = lambda x: f"{x:.2f}%".replace(".", ",") if x is not None else PREENCHER  # noqa: E731
    significativa = (r["multiplo"] or 0) >= 1.25
    return [
        Bloco("aviso", "MINUTA DE PRÉ-LAUDO GERADA AUTOMATICAMENTE - CONFERIR COM O CONTRATO E A CALCULADORA DO "
                       "CIDADÃO (BACEN) ANTES DE JUNTAR AO PROCESSO"),
        Bloco("texto", f"**Autor(a):** {nome}<br/>**Demandado:** {_v(lead.get('banco')).upper()}<br/>"
                       f"**Objeto:** Analisar a taxa de juros<br/>**Contrato:** {PREENCHER} - contratado em "
                       f"{_v(lead.get('mes_contratacao'))}"),
        Bloco("titulo", "PARECER TÉCNICO PRELIMINAR"),
        Bloco("subtitulo", "1. INTRODUÇÃO"),
        Bloco("texto", "Documento técnico que analisa a taxa de juros remuneratórios do contrato em quatro etapas: "
                       "(i) taxa pactuada; (ii) taxa realmente praticada, calculada a partir do valor financiado, do "
                       "prazo e da parcela; (iii) taxa média de mercado do Banco Central para a modalidade e o mês da "
                       "contratação; e (iv) recálculo da parcela aplicando a taxa média de mercado, referência adotada "
                       "pelo STJ no REsp nº 1.061.530/RS."),
        Bloco("subtitulo", "2. DADOS DO CONTRATO"),
        Bloco("tabela", linhas=[
            ["Valor financiado", brl(r["valor_financiado"])],
            ["Parcela cobrada", brl(r["parcela"])],
            ["Prazo / parcelas pagas", f"{r['n']} meses / {r['pagas']} pagas"],
            ["Taxa pactuada (contrato)", pct(r["taxa_contratada_am"]) + " a.m." if r["taxa_contratada_am"]
             else f"{PREENCHER} (recortar do contrato)"],
        ]),
        Bloco("subtitulo", "3. TAXA REALMENTE PRATICADA"),
        Bloco("texto", f"Com o valor financiado, o prazo e a parcela cobrada (sistema de prestações fixas - Tabela "
                       f"Price), a taxa efetivamente praticada é de **{pct(r['taxa_real_am'])} ao mês**, equivalente a "
                       f"**{pct(r['taxa_real_aa'])} ao ano**. Conferir na Calculadora do Cidadão do BACEN e anexar o "
                       f"recorte da tela."),
        Bloco("subtitulo", "4. TAXA MÉDIA DE MERCADO (BACEN)"),
        Bloco("texto", f"Série SGS nº {r['serie'] or PREENCHER} (taxa média mensal, recursos livres, pessoa física, "
                       f"modalidade {MODALIDADES.get(lead.get('modalidade') or '', PREENCHER)}), referência {r['mes_ref']}: **{pct(r['media_am'])} ao "
                       f"mês**, equivalente a **{pct(r['media_aa'])} ao ano**. Anexar o recorte da consulta ao SGS."),
        Bloco("subtitulo", "5. RECÁLCULO PELA TAXA MÉDIA"),
        Bloco("tabela", linhas=[
            ["Parcela recalculada pela taxa média", brl(r["pmt_media"])],
            ["Excesso por parcela", brl(r["excesso_parcela"])],
            ["Excesso no contrato inteiro", brl(r["excesso_total"])],
            [f"Excesso já pago ({r['pagas']} parcelas)", brl(r["pago_a_maior"])],
            ["Excesso já pago, em dobro (art. 42, p.u., CDC)", brl(r["pago_a_maior_dobro"])],
            [f"Excesso a excluir das {r['n'] - r['pagas']} parcelas restantes", brl(r["a_excluir"])],
        ]),
        Bloco("subtitulo", "6. CONCLUSÃO PRELIMINAR"),
        Bloco("texto", (f"A taxa praticada ({pct(r['taxa_real_aa'])} a.a.) é **{r['multiplo']} vezes** a taxa média de "
                        f"mercado ({pct(r['media_aa'])} a.a.), diferença de "
                        f"{pct(r['taxa_real_aa'] - r['media_aa'])} pontos percentuais ao ano, o que indica "
                        + ("**diferença significativa**, apta a fundamentar o pedido revisional."
                           if significativa else
                           "diferença **pouco expressiva**: avaliar outras teses (tarifas, seguros) antes de ajuizar."))),
        Bloco("texto", "Notas para o advogado: (a) se o valor financiado incluir tarifas, IOF e seguros, a taxa "
                       "calculada se aproxima do CET; (b) a repetição em dobro independe de má-fé apenas para "
                       "cobranças posteriores a 30/03/2021 (STJ, EAREsp 676.608/RS) - ajustar o cálculo conforme as "
                       "datas dos pagamentos; (c) valores sem correção monetária."),
    ]


# ---------------------------------------------------------------- orquestração
def salvar(contact_id: str, nome: str, pdf: bytes, docx_bytes: bytes | None = None) -> list[Path]:
    pasta = BASE / settings().db_path.rsplit("/", 1)[0] / "documentos" / contact_id
    pasta.mkdir(parents=True, exist_ok=True)
    arquivos = [pasta / f"{nome}.pdf"]
    arquivos[0].write_bytes(pdf)
    if docx_bytes:
        arquivos.append(pasta / f"{nome}.docx")
        arquivos[1].write_bytes(docx_bytes)
    return arquivos


async def gerar_pacote(contact_id: str, lead: dict, fechamento: bool) -> list[tuple[str, bytes, str]]:
    """Gera os documentos do lead. Retorna [(nome_arquivo, bytes, mimetype)]."""
    saida: list[tuple[str, bytes, str]] = []
    primeiro = (lead.get("contratante") or {}).get("nome_completo") or lead.get("nome") or "cliente"
    tag = primeiro.split(" ")[0].lower()
    if fechamento:
        c = lead.get("contratante") or {}
        divida = c.get("valor_divida") or lead.get("valor_divida_atual")
        for nome, blocos in (("contrato", contrato(c, lead.get("banco"), divida)),
                             ("procuracao", procuracao(c, lead.get("banco")))):
            pdf, dx = render_pdf(blocos), render_docx(blocos)
            salvar(contact_id, nome, pdf, dx)
            saida += [(f"{nome}-{tag}.pdf", pdf, "application/pdf"),
                      (f"{nome}-{tag}.docx", dx,
                       "application/vnd.openxmlformats-officedocument.wordprocessingml.document")]
    media = None
    if lead.get("modalidade") in bacen.SERIES and lead.get("mes_contratacao"):
        try:
            media = await bacen.taxa_media_bacen(lead["modalidade"], lead["mes_contratacao"])
        except Exception:
            log.exception("BACEN indisponível para o pré-laudo")
    r = calcular_laudo(lead, *(media or (None, None)))
    if r:
        blocos = pre_laudo(lead, r)
        pdf, dx = render_pdf(blocos), render_docx(blocos)
        salvar(contact_id, "pre-laudo", pdf, dx)
        saida += [(f"pre-laudo-{tag}.pdf", pdf, "application/pdf"),
                  (f"pre-laudo-{tag}.docx", dx,
                   "application/vnd.openxmlformats-officedocument.wordprocessingml.document")]
    return saida
