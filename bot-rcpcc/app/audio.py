"""Ouvir (transcrição) e falar (voz). Os dois são opcionais.

Claude não recebe áudio diretamente, por isso a transcrição usa Whisper (via Groq: ~US$0,04/hora
de áudio). A voz usa ElevenLabs, que tem o português mais natural do mercado hoje.
"""
from __future__ import annotations

import logging

import httpx

from .config import settings

log = logging.getLogger("audio")


async def transcrever(audio: bytes, mimetype: str) -> str | None:
    key = settings().groq_api_key
    if not key:
        return None
    ext = {"audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/wav": "wav"}.get(
        (mimetype or "").split(";")[0], "ogg")
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {key}"},
            data={"model": "whisper-large-v3", "language": "pt", "response_format": "text"},
            files={"file": (f"audio.{ext}", audio, mimetype or "audio/ogg")},
        )
    if r.status_code != 200:
        log.error("Transcrição falhou: %s %s", r.status_code, r.text[:300])
        return None
    return r.text.strip()


async def sintetizar(texto: str) -> bytes | None:
    s = settings()
    if not (s.elevenlabs_api_key and s.elevenlabs_voice_id):
        return None
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{s.elevenlabs_voice_id}",
            headers={"xi-api-key": s.elevenlabs_api_key, "accept": "audio/mpeg"},
            json={"text": texto, "model_id": "eleven_multilingual_v2",
                  "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}},
        )
    if r.status_code != 200:
        log.error("Voz falhou: %s %s", r.status_code, r.text[:300])
        return None
    return r.content


def audio_disponivel() -> bool:
    s = settings()
    return bool(s.elevenlabs_api_key and s.elevenlabs_voice_id)
