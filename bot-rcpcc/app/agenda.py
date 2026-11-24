"""Agenda via Google Calendar (conta de serviço com acesso de edição à sua agenda).

Sem credenciais configuradas, o robô oferece o LINK_AGENDAMENTO_FALLBACK (ex.: Calendly/Cal.com).
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from .config import settings

log = logging.getLogger("agenda")


def _service():
    s = settings()
    if not (s.google_service_account_json and Path(s.google_service_account_json).exists()
            and s.google_calendar_id):
        return None
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(
        s.google_service_account_json, scopes=["https://www.googleapis.com/auth/calendar"])
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def agenda_configurada() -> bool:
    return _service() is not None


def _horarios_livres_sync(dias: int = 5, max_opcoes: int = 6) -> list[str]:
    s = settings()
    svc = _service()
    tz = ZoneInfo(s.fuso)
    agora = datetime.now(tz)
    fim_janela = agora + timedelta(days=dias + 3)
    ocupado = svc.freebusy().query(body={
        "timeMin": agora.isoformat(), "timeMax": fim_janela.isoformat(),
        "timeZone": s.fuso, "items": [{"id": s.google_calendar_id}],
    }).execute()["calendars"][s.google_calendar_id]["busy"]
    blocos = [(datetime.fromisoformat(b["start"]), datetime.fromisoformat(b["end"])) for b in ocupado]

    dur = timedelta(minutes=s.duracao_reuniao_min)
    opcoes: list[str] = []
    dia = agora.date()
    while len(opcoes) < max_opcoes and dia <= fim_janela.date():
        if dia.weekday() < 5:
            t = datetime(dia.year, dia.month, dia.day, s.horario_inicio, tzinfo=tz)
            while t + dur <= datetime(dia.year, dia.month, dia.day, s.horario_fim, tzinfo=tz):
                # pelo menos 2h de antecedência e espalha opções (máx. 2 por dia)
                if t > agora + timedelta(hours=2) and not any(a < t + dur and t < b for a, b in blocos):
                    opcoes.append(t.isoformat())
                    if sum(o.startswith(dia.isoformat()) for o in opcoes) >= 2:
                        break
                    t += timedelta(hours=2)
                    continue
                t += dur
        dia += timedelta(days=1)
    return opcoes


def _criar_evento_sync(inicio_iso: str, nome: str, telefone: str, resumo: str) -> dict:
    s = settings()
    svc = _service()
    inicio = datetime.fromisoformat(inicio_iso)
    fim = inicio + timedelta(minutes=s.duracao_reuniao_min)
    # checagem de corrida: o horário ainda está livre?
    busy = svc.freebusy().query(body={
        "timeMin": inicio.isoformat(), "timeMax": fim.isoformat(),
        "items": [{"id": s.google_calendar_id}]}).execute()["calendars"][s.google_calendar_id]["busy"]
    if busy:
        return {"ok": False, "erro": "Horário acabou de ser ocupado. Ofereça outro."}
    local = s.link_reuniao_online or "Videochamada (link enviado pela equipe)"
    ev = svc.events().insert(calendarId=s.google_calendar_id, body={
        "summary": f"[RCPCC] Reunião - {nome}",
        "description": f"Telefone: {telefone}\nReunião online gratuita\n\n{resumo}",
        "location": local,
        "start": {"dateTime": inicio.isoformat(), "timeZone": s.fuso},
        "end": {"dateTime": fim.isoformat(), "timeZone": s.fuso},
        "reminders": {"useDefault": False, "overrides": [{"method": "popup", "minutes": 30}]},
    }).execute()
    return {"ok": True, "evento_id": ev.get("id"), "inicio": inicio.isoformat(), "local": local}


async def horarios_livres() -> list[str]:
    return await asyncio.to_thread(_horarios_livres_sync)


async def criar_evento(inicio_iso: str, nome: str, telefone: str, resumo: str) -> dict:
    return await asyncio.to_thread(_criar_evento_sync, inicio_iso, nome, telefone, resumo)
