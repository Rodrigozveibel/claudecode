"""Testa as integrações configuradas no .env:  python -m app.diagnostico"""
import asyncio

import httpx

from . import agenda, bacen
from .config import settings


async def main():
    s = settings()
    print("Claude key:", "ok" if s.anthropic_api_key else "FALTANDO")
    async with httpx.AsyncClient(base_url=s.digisac_api_url.rstrip("/"),
                                 headers={"Authorization": f"Bearer {s.digisac_token}"}, timeout=20) as c:
        try:
            r = await c.get("/services")
            print("Digisac /services:", r.status_code)
            if r.status_code == 200:
                for sv in (r.json().get("data") or r.json() or [])[:20]:
                    print("   conexão:", sv.get("id"), sv.get("name"), sv.get("type"))
            r = await c.get("/departments")
            if r.status_code == 200:
                for d in (r.json().get("data") or r.json() or [])[:20]:
                    print("   departamento:", d.get("id"), d.get("name"))
        except Exception as e:
            print("Digisac ERRO:", e)
    print("BACEN veículo set/2026:", await bacen.taxa_media_bacen("veiculo", "09/2026"))
    print("Agenda Google:", "ok" if agenda.agenda_configurada() else "não configurada (usa fallback)")
    print("Transcrição:", "ok" if s.groq_api_key else "desligada")
    print("Voz:", "ok" if s.elevenlabs_api_key and s.elevenlabs_voice_id else "desligada")


if __name__ == "__main__":
    asyncio.run(main())
