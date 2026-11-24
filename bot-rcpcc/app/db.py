"""Persistência simples em SQLite: histórico da conversa + ficha do lead."""
from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path

from .config import settings

_lock = threading.Lock()
_conn: sqlite3.Connection | None = None


def conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        Path(settings().db_path).parent.mkdir(parents=True, exist_ok=True)
        _conn = sqlite3.connect(settings().db_path, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        _conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS conversas (
                contact_id TEXT PRIMARY KEY,
                mensagens TEXT NOT NULL DEFAULT '[]',
                status TEXT NOT NULL DEFAULT 'triagem',
                pausado_ate REAL NOT NULL DEFAULT 0,
                ultimo_contato REAL NOT NULL DEFAULT 0,
                followups INTEGER NOT NULL DEFAULT 0,
                ticket_id TEXT,
                responde_audio INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS leads (
                contact_id TEXT PRIMARY KEY,
                dados TEXT NOT NULL DEFAULT '{}',
                score INTEGER,
                classificacao TEXT,
                atualizado REAL
            );
            CREATE TABLE IF NOT EXISTS enviados (id TEXT PRIMARY KEY, em REAL);
            CREATE TABLE IF NOT EXISTS processados (id TEXT PRIMARY KEY, em REAL);
            """
        )
    return _conn


def get_conversa(contact_id: str) -> dict:
    with _lock:
        row = conn().execute("SELECT * FROM conversas WHERE contact_id=?", (contact_id,)).fetchone()
        if row is None:
            conn().execute("INSERT INTO conversas(contact_id) VALUES (?)", (contact_id,))
            conn().commit()
            return {"contact_id": contact_id, "mensagens": [], "status": "triagem", "pausado_ate": 0,
                    "ultimo_contato": 0, "followups": 0, "ticket_id": None, "responde_audio": 0}
        d = dict(row)
        d["mensagens"] = json.loads(d["mensagens"])
        return d


def salvar_conversa(contact_id: str, **campos) -> None:
    if "mensagens" in campos:
        campos["mensagens"] = json.dumps(campos["mensagens"], ensure_ascii=False)
    sets = ", ".join(f"{k}=?" for k in campos)
    with _lock:
        conn().execute(f"UPDATE conversas SET {sets} WHERE contact_id=?", (*campos.values(), contact_id))
        conn().commit()


def get_lead(contact_id: str) -> dict:
    with _lock:
        row = conn().execute("SELECT dados FROM leads WHERE contact_id=?", (contact_id,)).fetchone()
    return json.loads(row["dados"]) if row else {}


def salvar_lead(contact_id: str, dados: dict, score: int | None, classificacao: str | None) -> None:
    with _lock:
        conn().execute(
            "INSERT INTO leads(contact_id, dados, score, classificacao, atualizado) VALUES (?,?,?,?,?) "
            "ON CONFLICT(contact_id) DO UPDATE SET dados=excluded.dados, score=excluded.score, "
            "classificacao=excluded.classificacao, atualizado=excluded.atualizado",
            (contact_id, json.dumps(dados, ensure_ascii=False), score, classificacao, time.time()),
        )
        conn().commit()


def marcar(tabela: str, msg_id: str) -> bool:
    """Registra um id; devolve False se já existia (deduplicação de webhook)."""
    with _lock:
        try:
            conn().execute(f"INSERT INTO {tabela}(id, em) VALUES (?, ?)", (msg_id, time.time()))
            conn().commit()
            return True
        except sqlite3.IntegrityError:
            return False


def existe(tabela: str, msg_id: str) -> bool:
    with _lock:
        return conn().execute(f"SELECT 1 FROM {tabela} WHERE id=?", (msg_id,)).fetchone() is not None


def conversas_para_followup(min_horas: float, max_horas: float) -> list[dict]:
    agora = time.time()
    with _lock:
        rows = conn().execute(
            "SELECT contact_id, followups, ultimo_contato FROM conversas "
            "WHERE status='triagem' AND followups < 2 AND ultimo_contato > 0 "
            "AND ultimo_contato < ? AND ultimo_contato > ? AND pausado_ate < ?",
            (agora - min_horas * 3600, agora - max_horas * 3600, agora),
        ).fetchall()
    return [dict(r) for r in rows]


def listar_leads() -> list[dict]:
    with _lock:
        rows = conn().execute(
            "SELECT l.contact_id, l.dados, l.score, l.classificacao, l.atualizado, c.status "
            "FROM leads l LEFT JOIN conversas c USING(contact_id) ORDER BY l.atualizado DESC"
        ).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["dados"] = json.loads(d["dados"])
        out.append(d)
    return out
