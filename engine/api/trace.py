"""POST /trace - Log candidate behavioral events."""
import json
import uuid
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..db.pool import get_pool
from ..schemas.env_schema import TraceEvent

router = APIRouter()


async def get_session_table(conn, session_id: str):
    """Find which table contains the session.

    Returns: (row, table_name) or (None, None)
    """
    row = await conn.fetchrow(
        "SELECT status FROM b2b_sessions WHERE session_id = $1",
        session_id
    )
    if row:
        return row, "b2b_sessions"

    row = await conn.fetchrow(
        "SELECT status FROM b2c_sessions WHERE session_id = $1",
        session_id
    )
    if row:
        return row, "b2c_sessions"

    return None, None


class TraceRequest(BaseModel):
    """Request to log a trace event."""
    session_id: str
    event_type: str  # thread_open|task_update|artifact_view|artifact_comment
    elapsed_seconds: float
    agent_id: Optional[str] = None
    thread_id: Optional[str] = None
    task_id: Optional[str] = None
    content: dict = {}


@router.post("/trace")
async def log_trace_event(request: TraceRequest):
    """Log a behavioral trace event."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Verify session exists
        row, table_name = await get_session_table(conn, request.session_id)
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        # Build trace event
        trace_event = TraceEvent(
            event_id=str(uuid.uuid4()),
            session_id=request.session_id,
            timestamp=time.time(),
            elapsed_seconds=request.elapsed_seconds,
            event_type=request.event_type,
            agent_id=request.agent_id,
            thread_id=request.thread_id,
            content=request.content
        )

        # Append to trace
        await conn.execute(f"""
            UPDATE {table_name}
            SET trace = trace || $1::jsonb
            WHERE session_id = $2
        """, json.dumps([trace_event.model_dump()]), request.session_id)

        # If this is a session_end event, also store integrity data separately (B2B only)
        if request.event_type == "session_end" and "integrity" in request.content and table_name == "b2b_sessions":
            await conn.execute(f"""
                UPDATE {table_name}
                SET integrity_data = $1::jsonb
                WHERE session_id = $2
            """, json.dumps(request.content.get("integrity")), request.session_id)

    return {"status": "logged", "event_id": trace_event.event_id}


@router.post("/artifact-comment")
async def log_artifact_comment(request: TraceRequest):
    """Log an artifact comment and store it."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Verify session exists
        row, table_name = await get_session_table(conn, request.session_id)
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        # Build trace event
        trace_event = TraceEvent(
            event_id=str(uuid.uuid4()),
            session_id=request.session_id,
            timestamp=time.time(),
            elapsed_seconds=request.elapsed_seconds,
            event_type="artifact_comment",
            content={
                "section_id": request.content.get("section_id"),
                "comment_text": request.content.get("comment_text")
            }
        )

        # Append to trace (B2B has artifact_trace, B2C may not)
        if table_name == "b2b_sessions":
            await conn.execute(f"""
                UPDATE {table_name}
                SET trace = trace || $1::jsonb,
                    artifact_trace = COALESCE(artifact_trace, '[]'::jsonb) || $1::jsonb
                WHERE session_id = $2
            """, json.dumps([trace_event.model_dump()]), request.session_id)
        else:
            await conn.execute(f"""
                UPDATE {table_name}
                SET trace = trace || $1::jsonb
                WHERE session_id = $2
            """, json.dumps([trace_event.model_dump()]), request.session_id)

    return {"status": "logged", "event_id": trace_event.event_id}
