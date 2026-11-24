import asyncio

from app import config, db, origem


def _cfg(monkeypatch, tmp_path, **env):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "o.db"))
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    config.settings.cache_clear(); db._conn = None


def test_gatilho_texto_do_anuncio(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path)
    assert origem.detectar({}, {"text": "Olá! Quero REVISAR MEU CONTRATO"})[0] == "rcpcc"
    assert origem.detectar({}, {"text": "Oi, fui demitido sem receber"})[0] == "geral"


def test_conexao_dedicada_e_ad_id(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path, RCPCC_SERVICE_IDS="svc-campanha", RCPCC_AD_IDS="120210000")
    assert origem.detectar({}, {"serviceId": "svc-campanha", "text": "oi"})[0] == "rcpcc"
    ev = {"data": {"text": "oi", "data": {"referral": {"source_id": "120210000"}}}}
    assert origem.detectar(ev, ev["data"])[0] == "rcpcc"


def test_modo_silencio_nao_responde_outras_areas(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path, OUTRAS_AREAS_MODO="silencio")
    from app import main
    chamado = []

    async def fake_responder(*a, **k):
        chamado.append(1); return "x", []
    monkeypatch.setattr(main.agent, "responder", fake_responder)
    db.get_conversa("g1"); db.salvar_conversa("g1", fluxo="geral", origem="sem marca")
    asyncio.run(main._atender("g1", [{"id": "1", "type": "chat", "text": "oi"}]))
    assert chamado == []


def test_lead_geral_vira_rcpcc_quando_cita_o_criativo(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path, WEBHOOK_SECRET="x", DEBOUNCE_SEGUNDOS="999")
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    def ev(i, t):
        return {"event": "message.created", "data": {"id": i, "type": "chat", "text": t, "contactId": "c2"}}
    c.post("/webhook/digisac?secret=x", json=ev("a", "boa tarde"))
    assert db.get_conversa("c2")["fluxo"] == "geral"
    c.post("/webhook/digisac?secret=x", json=ev("b", "vi o anúncio, juros abusivos no carro"))
    assert db.get_conversa("c2")["fluxo"] == "rcpcc"


def test_transferir_atendimento_usa_departamento_geral(monkeypatch, tmp_path):
    _cfg(monkeypatch, tmp_path, DIGISAC_DEPARTAMENTO_ATENDIMENTO_ID="dep-geral")
    from app import agent, digisac
    chamadas = []

    async def fake_transfer(cid, comentario, depto=None):
        chamadas.append((cid, depto))
    monkeypatch.setattr(digisac, "transferir_ticket", fake_transfer)
    ctx = agent.Contexto(contact_id="t1")
    asyncio.run(agent.executar_tool(ctx, "transferir_atendimento", {"resumo": "dúvida trabalhista"}))
    assert chamadas == [("t1", "dep-geral")] and ctx.status_novo == "humano"
    assert "transferir_atendimento" in [t["name"] for t in agent.TOOLS]
