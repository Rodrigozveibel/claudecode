"""Converse com o robô no terminal, sem Digisac (as ações viram prints).

    python -m app.simulador
Precisa só do ANTHROPIC_API_KEY no .env.
"""
import asyncio
import uuid

from . import agent, db, digisac


async def _fake(*a, **k):
    print(f"   [ação Digisac: {a[1:] if len(a) > 1 else a} {k or ''}]")
    return {}


async def main():
    for nome in ("transferir_ticket", "encerrar_ticket", "enviar_texto_numero"):
        setattr(digisac, nome, _fake)
    cid = f"sim-{uuid.uuid4().hex[:8]}"
    ctx = agent.Contexto(contact_id=cid, telefone="5511900000000")
    hist: list = []
    print("Digite como se fosse o lead. Ctrl+C para sair.\n")
    while True:
        msg = input("LEAD > ").strip()
        if not msg:
            continue
        texto, hist = await agent.responder(ctx, hist, [{"type": "text", "text": msg}])
        print(f"\nROBÔ > {texto}\n")
        lead = db.get_lead(cid)
        if lead:
            print(f"   [ficha: score={lead.get('_score')} {lead.get('_classificacao')} | status={ctx.status_novo}]\n")


if __name__ == "__main__":
    asyncio.run(main())
