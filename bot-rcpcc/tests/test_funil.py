import asyncio
import json

from app import config, db, honorarios


def _cfg(monkeypatch, tmp_path, **env):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "f.db"))
    for k, v in env.items():
        monkeypatch.setenv(k, str(v))
    config.settings.cache_clear(); db._conn = None


def test_honorarios_desligado_nao_cita_valor(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    assert honorarios.calcular(50_000)["configurado"] is False


def test_honorarios_formato_do_funil(monkeypatch, tmp_path):
    # dívida de R$ 66 mil a 8% = R$ 5.280 de base, parecido com o exemplo do funil (R$ 5.300)
    _cfg(monkeypatch, tmp_path, HONORARIOS_INICIAL_PCT=8, HONORARIOS_EXITO_PCT=10, HONORARIOS_INICIAL_MINIMO=3000)
    r = honorarios.calcular(66_000)
    b, c, v = r["boleto"], r["cartao"], r["avista"]
    assert b["parcelas"] == 10 and str(b["valor_parcela"]).endswith("7") and str(b["entrada"]).endswith("7")
    assert abs(b["total"] - 5280) < 120
    assert c["total"] > b["total"] > v["valor"]
    assert r["exito_pct_sobre_reducao"] == 10
    assert honorarios.calcular(1_000)["boleto"]["total"] >= 3000  # piso


def test_cpf():
    assert honorarios.cpf_valido("529.982.247-25")
    assert not honorarios.cpf_valido("111.111.111-11")
    assert not honorarios.cpf_valido("529.982.247-24")


def test_fechamento_rejeita_cpf_invalido_e_aceita_valido(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    from app import agent, digisac
    async def nada(*a, **k): return {}
    monkeypatch.setattr(digisac, "transferir_ticket", nada)
    monkeypatch.setattr(digisac, "enviar_texto_numero", nada)
    ctx = agent.Contexto(contact_id="f1")
    base = {"nome_completo": "Maria Silva", "profissao": None, "estado_civil": None, "rg": None,
            "endereco_com_cep": None, "email": None, "telefone": None, "valor_divida": 40000,
            "forma_pagamento": "boleto", "documentos_recebidos": False}
    r = json.loads(asyncio.run(agent.executar_tool(ctx, "registrar_fechamento", base | {"cpf": "123"})))
    assert r["ok"] is False and ctx.status_novo is None
    r = json.loads(asyncio.run(agent.executar_tool(ctx, "registrar_fechamento", base | {"cpf": "52998224725"})))
    assert r["ok"] and ctx.status_novo == "fechado" and "rg" in r["faltando"]


def test_material_ausente_nao_quebra(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    from app import agent
    r = json.loads(asyncio.run(agent.executar_tool(agent.Contexto(contact_id="m"), "enviar_material",
                                                   {"tipo": "decisao", "legenda": None})))
    assert r["enviado"] is False


def test_prompt_usa_dani_e_escritorio(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    from app.prompts import system_prompt
    p = system_prompt(False, False)
    assert "Dani" in p and "R Zveibel Advogados" in p and "não cite valores" in p
