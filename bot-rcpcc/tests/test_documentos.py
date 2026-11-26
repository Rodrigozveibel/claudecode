import asyncio

from pypdf import PdfReader
import io

from app import config, db, documentos as D


def _cfg(monkeypatch, tmp_path, **env):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "d.db"))
    for k, v in env.items():
        monkeypatch.setenv(k, str(v))
    config.settings.cache_clear(); db._conn = None


LEAD = {"nome": "Maria", "banco": "Banco Exemplo", "modalidade": "veiculo", "mes_contratacao": "11/2020",
        "valor_financiado": 31990, "parcela": 985.49, "n_parcelas": 48, "parcelas_pagas": 20,
        "contratante": {"nome_completo": "Maria da Silva", "cpf": "529.982.247-25", "valor_divida": 28500,
                        "forma_pagamento": "parcelado", "parcelas": 10}}


def test_extenso():
    assert D.extenso_reais(1970) == "mil novecentos e setenta reais"
    assert D.extenso_reais(28500) == "vinte e oito mil e quinhentos reais"
    assert D.extenso_reais(197) == "cento e noventa e sete reais"
    assert D.extenso_reais(100) == "cem reais"


def test_calculo_bate_com_o_modelo_de_laudo():
    r = D.calcular_laudo(LEAD, 1.46, "11/2020")
    assert abs(r["pmt_media"] - 931.70) < 1
    assert r["excesso_parcela"] == round(985.49 - r["pmt_media"], 2)
    assert r["pago_a_maior_dobro"] == round(r["pago_a_maior"] * 2, 2)
    assert D.calcular_laudo({"valor_financiado": 1000}, 1.5, "x") is None


def test_pacote_completo_no_timbrado(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path, ESCRITORIO_CIDADE="Taubaté/SP")

    async def media(*a):
        return 1.46, "11/2020"
    monkeypatch.setattr(D.bacen, "taxa_media_bacen", media)
    pacote = asyncio.run(D.gerar_pacote("c1", LEAD, fechamento=True))
    nomes = [n for n, _, _ in pacote]
    assert {"contrato-maria.pdf", "procuracao-maria.pdf", "pre-laudo-maria.pdf", "contrato-maria.docx"} <= set(nomes)
    texto = "".join(p.extract_text() for p in PdfReader(io.BytesIO(dict((n, b) for n, b, _ in pacote)
                                                                    ["contrato-maria.pdf"])).pages)
    texto = " ".join(texto.split())
    assert "MARIA DA SILVA" in texto and "1.970,00" in texto and "20%" in texto
    assert "10 (dez) parcelas" in texto and "Taubaté/SP" in texto
    assert "garantia de" in texto and "5% ao mês" not in texto
    proc = "".join(p.extract_text() for p in PdfReader(io.BytesIO(dict((n, b) for n, b, _ in pacote)
                                                                   ["procuracao-maria.pdf"])).pages)
    proc = " ".join(proc.split())
    assert "em que é réu" not in proc and "98 e 99" in proc
    assert "CNPJ" not in D.pendencias_escritorio()


def test_pre_laudo_sem_dados_nao_gera(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    pacote = asyncio.run(D.gerar_pacote("c2", {"nome": "João"}, fechamento=False))
    assert pacote == []
