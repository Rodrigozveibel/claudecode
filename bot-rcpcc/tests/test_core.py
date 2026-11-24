import asyncio
import json

import pytest

from app import bacen, score


def test_taxa_implicita_price():
    # R$ 50.000 em 48x de R$ 1.623,57 ~= 2,00% a.m.
    assert abs(bacen.taxa_implicita_mensal(50_000, 1_630.09, 48) - 2.0) < 0.01


def test_anual():
    assert bacen.mensal_para_anual(2.0) == pytest.approx(26.82, 0.01)


def test_score_quente():
    pts, classe, _ = score.pontuar({"valor_financiado": 60_000, "potencial_juros": "forte",
                                    "modalidade": "veiculo", "tem_contrato_em_maos": True,
                                    "parcelas_restantes": 30})
    assert classe == "quente" and pts >= 55


def test_score_frio():
    _, classe, _ = score.pontuar({"valor_financiado": 5_000, "potencial_juros": "fraco"})
    assert classe == "frio"


def test_prescricao_desqualifica():
    _, classe, _ = score.pontuar({"valor_financiado": 90_000, "potencial_juros": "forte", "ano_contrato": 2010})
    assert classe == "desqualificado"


def test_busca_apreensao_sempre_quente():
    _, classe, _ = score.pontuar({"risco_busca_apreensao": True})
    assert classe == "quente"


def test_tools_schema_strict_valido():
    from app.agent import TOOLS
    for t in TOOLS:
        s = t["input_schema"]
        assert set(s["required"]) == set(s["properties"])
        json.dumps(t)


def test_webhook_ignora_eco_e_deduplica(tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "t.db"))
    monkeypatch.setenv("WEBHOOK_SECRET", "x")
    monkeypatch.setenv("DEBOUNCE_SEGUNDOS", "999")
    from app import config, db
    config.settings.cache_clear(); db._conn = None
    from fastapi.testclient import TestClient
    from app.main import app, _pendentes
    c = TestClient(app)
    ev = {"event": "message.created", "data": {"id": "m1", "type": "chat", "text": "oi",
                                              "contactId": "c1", "isFromMe": False}}
    assert c.post("/webhook/digisac?secret=errado", json=ev).status_code == 403
    c.post("/webhook/digisac?secret=x", json=ev)
    c.post("/webhook/digisac?secret=x", json=ev)  # repetido
    assert len(_pendentes["c1"]) == 1
    # atendente humano responde -> robô pausa
    c.post("/webhook/digisac?secret=x", json={"event": "message.created", "data": {
        "id": "m2", "type": "chat", "text": "assumi", "contactId": "c1", "isFromMe": True}})
    assert db.get_conversa("c1")["pausado_ate"] > 0


def test_bacen_ao_vivo():
    r = asyncio.run(bacen.comparar("veiculo", "03/2022", taxa_contrato_mensal=3.5))
    if "erro" in r:
        pytest.skip("BACEN indisponível")
    assert r["media_bacen_am"] == pytest.approx(2.02) and r["potencial_juros"] == "forte"
