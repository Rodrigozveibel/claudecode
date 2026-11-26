"""Cliente Digisac.

Formato do webhook confirmado (evento `message.created`, campos data.contactId, data.text,
data.isFromMe, data.isFromBot, data.type, data.ticketId, data.serviceId).
Os endpoints de ENVIO seguem o padrão público da API v1 do Digisac. Antes de ir para produção,
confirme no painel (Configurações > API) e rode `python -m app.diagnostico`.
"""
from __future__ import annotations

import base64
import logging

import httpx

from . import db
from .config import settings

log = logging.getLogger("digisac")


def _client() -> httpx.AsyncClient:
    s = settings()
    return httpx.AsyncClient(
        base_url=s.digisac_api_url.rstrip("/"),
        headers={"Authorization": f"Bearer {s.digisac_token}"},
        timeout=30,
    )


async def _post(path: str, payload: dict) -> dict:
    async with _client() as c:
        r = await c.post(path, json=payload)
    if r.status_code >= 400:
        log.error("Digisac %s %s -> %s %s", "POST", path, r.status_code, r.text[:500])
        r.raise_for_status()
    data = r.json() if r.content else {}
    if isinstance(data, dict) and data.get("id"):
        db.marcar("enviados", data["id"])  # para ignorar o eco no webhook
    return data


async def enviar_texto(contact_id: str, texto: str, service_id: str | None = None) -> dict:
    return await _post("/messages", {
        "text": texto, "contactId": contact_id, "serviceId": service_id or settings().digisac_service_id,
    })


async def enviar_texto_numero(numero: str, texto: str) -> dict:
    """Envia para um número que pode não ser contato ainda (aviso ao advogado)."""
    return await _post("/messages", {
        "text": texto, "number": numero, "serviceId": settings().digisac_service_id,
    })


async def enviar_arquivo(contact_id: str, dados: bytes, mimetype: str, nome: str,
                         service_id: str | None = None, legenda: str = "") -> dict:
    payload = {
        "contactId": contact_id,
        "serviceId": service_id or settings().digisac_service_id,
        "file": {"base64": base64.b64encode(dados).decode(), "mimetype": mimetype, "name": nome},
    }
    if legenda:
        payload["text"] = legenda
    return await _post("/messages", payload)


async def enviar_arquivo_numero(numero: str, dados: bytes, mimetype: str, nome: str, legenda: str = "") -> dict:
    payload = {"number": numero, "serviceId": settings().digisac_service_id,
               "file": {"base64": base64.b64encode(dados).decode(), "mimetype": mimetype, "name": nome}}
    if legenda:
        payload["text"] = legenda
    return await _post("/messages", payload)


async def enviar_audio(contact_id: str, audio_mp3: bytes, service_id: str | None = None) -> dict:
    return await enviar_arquivo(contact_id, audio_mp3, "audio/mpeg", "audio.mp3", service_id)


async def baixar_arquivo(msg: dict) -> tuple[bytes, str] | None:
    """Baixa o anexo de uma mensagem (áudio, imagem, PDF). Retorna (bytes, mimetype)."""
    url, mime = _url_arquivo(msg)
    if not url:
        async with _client() as c:
            r = await c.get(f"/messages/{msg['id']}", params={"include": "file"})
        if r.status_code == 200:
            url, mime = _url_arquivo(r.json())
    if not url:
        log.warning("Mensagem %s sem URL de arquivo", msg.get("id"))
        return None
    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as c:
        r = await c.get(url)
    if r.status_code != 200:
        return None
    return r.content, mime or r.headers.get("content-type", "application/octet-stream")


def _url_arquivo(msg: dict) -> tuple[str | None, str | None]:
    f = msg.get("file") or {}
    if isinstance(f, dict) and f.get("url"):
        return f["url"], f.get("mimetype")
    files = msg.get("files") or []
    if isinstance(files, dict):
        files = list(files.values())
    for item in files:
        if isinstance(item, dict) and item.get("url"):
            return item["url"], item.get("mimetype")
    return None, None


async def transferir_ticket(contact_id: str, comentario: str, departamento_id: str | None = None) -> None:
    s = settings()
    payload = {"comments": comentario}
    depto = departamento_id or s.digisac_departamento_advogado_id
    if depto:
        payload["departmentId"] = depto
    try:
        await _post(f"/contacts/{contact_id}/ticket/transfer", payload)
    except httpx.HTTPError:
        log.exception("Falha ao transferir ticket de %s (o aviso ao advogado ainda é enviado)", contact_id)


async def encerrar_ticket(contact_id: str) -> None:
    try:
        await _post(f"/contacts/{contact_id}/ticket/close", {})
    except httpx.HTTPError:
        log.exception("Falha ao encerrar ticket de %s", contact_id)


async def get_contato(contact_id: str) -> dict:
    async with _client() as c:
        r = await c.get(f"/contacts/{contact_id}")
    return r.json() if r.status_code == 200 else {}
