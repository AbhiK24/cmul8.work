"""Candidate-facing endpoints (proxied to engine)."""
import json
import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db.pool import get_pool

router = APIRouter(prefix="/candidate")

ENGINE_URL = os.environ.get("ENGINE_URL", "http://engine.railway.internal:8080")


class CandidateMessageRequest(BaseModel):
    """Candidate message request."""
    session_id: str
    token: str
    agent_id: str
    message_text: str
    elapsed_seconds: float


class CandidateArtifactCommentRequest(BaseModel):
    """Candidate artifact comment request."""
    session_id: str
    token: str
    section_id: str
    comment_text: str
    elapsed_seconds: float


class CandidateTraceRequest(BaseModel):
    """Candidate trace event request."""
    session_id: str
    token: str
    event_type: str  # thread_open|task_update|artifact_view
    elapsed_seconds: float
    agent_id: str | None = None
    thread_id: str | None = None
    task_id: str | None = None
    content: dict = {}


async def validate_candidate_token(session_id: str, token: str) -> tuple[bool, str]:
    """Validate candidate token for a session.

    Returns:
        (is_valid, table_name) - Whether token is valid and which table it's from
    """
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Check B2B sessions first
        row = await conn.fetchrow(
            "SELECT candidate_token, status FROM b2b_sessions WHERE session_id = $1",
            session_id
        )

        if row:
            if row["candidate_token"] != token:
                return False, ""
            if row["status"] in ("expired", "complete"):
                return False, ""
            return True, "b2b_sessions"

        # Check B2C sessions
        row = await conn.fetchrow(
            "SELECT candidate_token, status FROM b2c_sessions WHERE session_id = $1",
            session_id
        )

        if row:
            if row["candidate_token"] != token:
                return False, ""
            if row["status"] in ("expired", "complete"):
                return False, ""
            return True, "b2c_sessions"

        return False, ""


@router.post("/message")
async def send_message(request: CandidateMessageRequest):
    """Send a message to an agent (proxied to engine)."""
    is_valid, _ = await validate_candidate_token(request.session_id, request.token)
    if not is_valid:
        raise HTTPException(status_code=403, detail="Invalid or expired session")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{ENGINE_URL}/message",
                json={
                    "session_id": request.session_id,
                    "agent_id": request.agent_id,
                    "message_text": request.message_text,
                    "elapsed_seconds": request.elapsed_seconds
                }
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Engine error: {e}")


@router.post("/artifact-comment")
async def send_artifact_comment(request: CandidateArtifactCommentRequest):
    """Comment on an artifact section (proxied to engine)."""
    is_valid, _ = await validate_candidate_token(request.session_id, request.token)
    if not is_valid:
        raise HTTPException(status_code=403, detail="Invalid or expired session")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{ENGINE_URL}/artifact-comment",
                json={
                    "session_id": request.session_id,
                    "event_type": "artifact_comment",
                    "elapsed_seconds": request.elapsed_seconds,
                    "content": {
                        "section_id": request.section_id,
                        "comment_text": request.comment_text
                    }
                }
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Engine error: {e}")


@router.post("/trace")
async def log_trace(request: CandidateTraceRequest):
    """Log a behavioral trace event (proxied to engine)."""
    is_valid, _ = await validate_candidate_token(request.session_id, request.token)
    if not is_valid:
        raise HTTPException(status_code=403, detail="Invalid or expired session")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{ENGINE_URL}/trace",
                json={
                    "session_id": request.session_id,
                    "event_type": request.event_type,
                    "elapsed_seconds": request.elapsed_seconds,
                    "agent_id": request.agent_id,
                    "thread_id": request.thread_id,
                    "task_id": request.task_id,
                    "content": request.content
                }
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Engine error: {e}")


@router.get("/env/{session_id}")
async def get_environment(session_id: str, token: str):
    """Get the simulation environment for a session."""
    is_valid, table_name = await validate_candidate_token(session_id, token)
    if not is_valid:
        raise HTTPException(status_code=403, detail="Invalid or expired session")

    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT env, status FROM {table_name} WHERE session_id = $1",
            session_id
        )

        if not row or not row["env"]:
            raise HTTPException(status_code=404, detail="Environment not ready")

        # Mark session as in_progress if it's pending/ready (candidate started simulation)
        if row["status"] in ("pending", "ready"):
            await conn.execute(f"""
                UPDATE {table_name}
                SET status = 'in_progress', started_at = NOW()
                WHERE session_id = $1 AND status IN ('pending', 'ready')
            """, session_id)

        return json.loads(row["env"])
