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
        row = await conn.fetchrow(
            "SELECT status FROM sessions WHERE session_id = $1",
            request.session_id
        )
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
        await conn.execute("""
            UPDATE sessions
            SET trace = trace || $1::jsonb
            WHERE session_id = $2
        """, json.dumps([trace_event.model_dump()]), request.session_id)

    return {"status": "logged", "event_id": trace_event.event_id}


@router.post("/artifact-comment")
async def log_artifact_comment(request: TraceRequest):
    """Log an artifact comment and store it."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Verify session exists
        row = await conn.fetchrow(
            "SELECT artifact_trace FROM sessions WHERE session_id = $1",
            request.session_id
        )
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

        # Append to both trace and artifact_trace
        await conn.execute("""
            UPDATE sessions
            SET trace = trace || $1::jsonb,
                artifact_trace = COALESCE(artifact_trace, '[]'::jsonb) || $1::jsonb
            WHERE session_id = $2
        """, json.dumps([trace_event.model_dump()]), request.session_id)

    return {"status": "logged", "event_id": trace_event.event_id}
