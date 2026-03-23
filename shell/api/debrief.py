"""Debrief endpoint for completing a session."""
import json
import os
import uuid

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db.pool import get_pool

router = APIRouter()

ENGINE_URL = os.environ.get("ENGINE_URL", "http://engine.railway.internal:8080")


class DebriefRequest(BaseModel):
    """Debrief submission request."""
    token: str
    q1: str  # What did you prioritise?
    q2: str  # What did you miss?
    q3: str  # What would you do differently?


@router.post("/sessions/{session_id}/debrief")
async def submit_debrief(session_id: str, request: DebriefRequest):
    """Submit session debrief and trigger scoring."""
    pool = await get_pool()
    table_name = None

    # Convert string to UUID for proper type matching
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    async with pool.acquire() as conn:
        # Check B2B sessions first
        row = await conn.fetchrow(
            "SELECT candidate_token, status FROM b2b_sessions WHERE session_id = $1",
            session_uuid
        )
        if row:
            table_name = "b2b_sessions"
        else:
            # Check B2C sessions
            row = await conn.fetchrow(
                "SELECT candidate_token, status FROM b2c_sessions WHERE session_id = $1",
                session_uuid
            )
            if row:
                table_name = "b2c_sessions"

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        if row["candidate_token"] != request.token:
            raise HTTPException(status_code=403, detail="Invalid token")

        if row["status"] in ("complete", "completed"):
            raise HTTPException(status_code=400, detail="Session already completed")

        # Save debrief and mark as complete
        debrief = {
            "What did you prioritise in the session, and why?": request.q1,
            "What do you think you missed or underweighted?": request.q2,
            "If you had another hour, what would you do differently?": request.q3
        }

        # Use 'complete' for both b2b and b2c
        await conn.execute(f"""
            UPDATE {table_name}
            SET debrief = $1, completed_at = NOW(), status = 'complete'
            WHERE session_id = $2
        """, json.dumps(debrief), session_uuid)

    # Call engine to score the session
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{ENGINE_URL}/score",
                json={"session_id": session_id}
            )
            response.raise_for_status()
            report = response.json()

            return {
                "status": "complete",
                "message": "Session scored successfully",
                "report_url": f"/sessions/{session_id}/report/candidate"
            }
    except httpx.HTTPError as e:
        # Log error but return partial success
        print(f"Scoring failed: {e}")
        return {
            "status": "pending_score",
            "message": "Debrief saved, scoring in progress"
        }
