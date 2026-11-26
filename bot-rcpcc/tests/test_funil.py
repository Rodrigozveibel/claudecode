import asyncio
import json

from app import config, db, honorarios


def _cfg(monkeypatch, tmp_path, **env):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "f.db"))
    for k, v in env.items():
        monkeypatch.setenv(k, str(v))
    config.settings.cache_clear(); db._conn = None


def test_honorarios_desligado_nao_cita_valor(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path, HONORARIOS_FIXO=0)
    assert honorarios.calcular(20_000)["configurado"] is False


def test_proposta_ate_30_mil(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    r = honorarios.calcular(25_000)
    assert r["levar_para_reuniao"] is False
    assert r["inicial"]["valor"] == 1970 and r["inicial"]["valor_parcela_fmt"] == "R$ 197,00"
    assert r["exito"]["pct_sobre_economia"] == 20 and "parcelado" in r["exito"]["parcelamento"]


def test_acima_de_30_mil_vai_para_reuniao_sem_valores(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    r = honorarios.calcular(30_000.01)
    assert r["levar_para_reuniao"] is True and "inicial" not in r
    assert honorarios.calcular(30_000)["levar_para_reuniao"] is False


def test_ferramenta_usa_maior_divida_conhecida(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    from app import agent
    db.salvar_lead("big", {"valor_divida_atual": 80_000}, None, None)
    ctx = agent.Contexto(contact_id="big")
    r = json.loads(asyncio.run(agent.executar_tool(ctx, "calcular_honorarios", {"valor_divida": 10_000})))
    assert r["levar_para_reuniao"] is True and ctx.status_novo == "reuniao"


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
            "endereco_com_cep": None, "email": None, "telefone": None, "valor_divida": 20000,
            "forma_pagamento": "parcelado", "parcelas": 10, "documentos_recebidos": False}
    r = json.loads(asyncio.run(agent.executar_tool(ctx, "registrar_fechamento", base | {"cpf": "123"})))
    assert r["ok"] is False and ctx.status_novo is None
    r = json.loads(asyncio.run(agent.executar_tool(ctx, "registrar_fechamento", base | {"cpf": "52998224725"})))
    assert r["ok"] and ctx.status_novo == "fechado" and "rg" in r["faltando"]
    # dívida acima do limite não fecha pelo WhatsApp
    ctx2 = agent.Contexto(contact_id="f2")
    r = json.loads(asyncio.run(agent.executar_tool(ctx2, "registrar_fechamento",
                                                   base | {"cpf": "52998224725", "valor_divida": 45000})))
    assert r["ok"] is False and ctx2.status_novo is None


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
    assert "Dani" in p and "R Zveibel Advogados" in p and "R$ 30.000" in p


def test_definicao_da_economia_na_proposta(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    e = honorarios.calcular(25_000)["exito"]
    assert "MENOS" in e["definicao_economia"] and "R$ 6 mil" in e["exemplo_ilustrativo"]


def test_lembretes_de_reuniao(monkeypatch, tmp_path):
    import time
    _cfg(monkeypatch, tmp_path, LINK_REUNIAO_ONLINE="https://meet.google.com/abc")
    from app import main
    enviados = []

    async def fake_texto(cid, texto, sid=None):
        enviados.append(texto)
    monkeypatch.setattr(main.digisac, "enviar_texto", fake_texto)

    async def uma_volta():
        t = asyncio.create_task(main._loop_lembrete_reuniao())
        await asyncio.sleep(0.05); t.cancel()

    db.get_conversa("r1"); db.salvar_conversa("r1", reuniao_inicio=time.time() + 3600, reuniao_avisos=0)
    asyncio.run(uma_volta())
    assert "lembrar" in enviados[-1]
    db.salvar_conversa("r1", reuniao_inicio=time.time() + 600)
    asyncio.run(uma_volta())
    assert "meet.google.com/abc" in enviados[-1]
    n = len(enviados)
    asyncio.run(uma_volta())
    assert len(enviados) == n  # não repete


def test_base_tem_os_materiais_novos(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    from app.prompts import base_conhecimento
    b = base_conhecimento()
    assert "Glossário de objeções" in b and "[CORRIGIDO]" in b and "Compromisso" in b
    assert "70%" not in b
