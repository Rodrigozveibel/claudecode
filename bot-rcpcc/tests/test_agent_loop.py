"""Roda o loop do agente contra uma API falsa: valida o corpo enviado e a execução das ferramentas."""
import asyncio
import json

import anthropic
import httpx2

from app import agent, db


def _msg(content, stop):
    return {"id": "msg_x", "type": "message", "role": "assistant", "model": "claude-opus-5-5",
            "content": content, "stop_reason": stop, "stop_sequence": None,
            "usage": {"input_tokens": 10, "output_tokens": 10}}


def test_loop_com_ferramenta(tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "a.db"))
    from app import config
    config.settings.cache_clear(); db._conn = None
    corpos = []
    respostas = [
        _msg([{"type": "thinking", "thinking": "", "signature": "sig"},
              {"type": "tool_use", "id": "tu1", "name": "registrar_lead",
               "input": {k: None for k in agent.LEAD_FIELDS} | {"valor_financiado": 60000}}], "tool_use"),
        _msg([{"type": "text", "text": "Perfeito, Maria. Consegue me mandar a foto do contrato?"}], "end_turn"),
    ]

    def handler(req):
        corpos.append(json.loads(req.content))
        return httpx2.Response(200, json=respostas[len(corpos) - 1])

    agent._client = anthropic.AsyncAnthropic(
        api_key="x", http_client=anthropic.DefaultAsyncHttpxClient(transport=httpx2.MockTransport(handler)))
    ctx = agent.Contexto(contact_id="c9")
    texto, hist = asyncio.run(agent.responder(ctx, [], [{"type": "text", "text": "peguei 60 mil no carro"}]))

    assert "contrato" in texto
    b = corpos[0]
    assert b["model"] == "claude-opus-5-5" and b["fallbacks"] == "default"
    assert b["output_config"]["effort"] == "medium" and "tool_choice" not in b
    assert b["system"][0]["cache_control"]["type"] == "ephemeral"
    # segunda chamada recebe o histórico append-only, com o thinking intacto e o tool_result
    seg = corpos[1]["messages"]
    assert seg[1]["content"][0]["type"] == "thinking" and seg[2]["content"][0]["type"] == "tool_result"
    assert db.get_lead("c9")["valor_financiado"] == 60000
    assert len(hist) == 4
