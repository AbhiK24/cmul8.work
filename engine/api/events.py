"""GET /events/{session_id} - Server-Sent Events stream for stress injects."""
import asyncio
import json
import time
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from ..db.pool import get_pool
from ..schemas.env_schema import TraceEvent

router = APIRouter()


async def get_session_for_events(conn, session_id: str):
    """Find session in either B2B or B2C tables.

    Returns: (row, table_name) or (None, None)
    """
    row = await conn.fetchrow("""
        SELECT env, started_at FROM b2b_sessions WHERE session_id = $1
    """, session_id)
    if row:
        return row, "b2b_sessions"

    row = await conn.fetchrow("""
        SELECT env, started_at FROM b2c_sessions WHERE session_id = $1
    """, session_id)
    if row:
        return row, "b2c_sessions"

    return None, None


@router.get("/events/{session_id}")
async def event_stream(session_id: str, request: Request):
    """SSE stream for pushing stress injects to the candidate."""

    async def generate():
        pool = await get_pool()

        # Get session data
        async with pool.acquire() as conn:
            row, table_name = await get_session_for_events(conn, session_id)

            if not row or not row["env"]:
                yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                return

            env = json.loads(row["env"])
            started_at = row["started_at"]

            if not started_at:
                # Mark session as started
                await conn.execute(f"""
                    UPDATE {table_name} SET started_at = NOW(), status = 'in_progress'
                    WHERE session_id = $1
                """, session_id)
                started_at = time.time()
            else:
                started_at = started_at.timestamp()

        inject_schedule = env.get("inject_schedule", [])
        fired = set()

        # Send initial connection message
        yield f"data: {json.dumps({'type': 'connected', 'session_id': session_id})}\n\n"

        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break

            elapsed = time.time() - started_at

            # Check for 45-minute timeout
            if elapsed >= 45 * 60:
                yield f"data: {json.dumps({'type': 'session_end', 'reason': 'timeout'})}\n\n"
                break

            # Check for injects to fire
            for inject in inject_schedule:
                inject_id = inject.get("id", "")
                trigger_seconds = inject.get("trigger_seconds", 0)

                if trigger_seconds <= elapsed and inject_id not in fired:
                    fired.add(inject_id)

                    # Record trace event
                    trace_event = TraceEvent(
                        event_id=str(uuid.uuid4()),
                        session_id=session_id,
                        timestamp=time.time(),
                        elapsed_seconds=elapsed,
                        event_type="inject_fired",
                        agent_id=inject.get("agent_id"),
                        thread_id=inject.get("thread_id"),
                        content={"inject": inject}
                    )

                    # Store trace event (use same table_name from outer scope)
                    async with pool.acquire() as conn:
                        await conn.execute(f"""
                            UPDATE {table_name}
                            SET trace = trace || $1::jsonb
                            WHERE session_id = $2
                        """, json.dumps([trace_event.model_dump()]), session_id)

                    # Send inject to client
                    yield f"id: {inject_id}\ndata: {json.dumps({
                        'type': 'inject',
                        'inject': inject,
                        'elapsed_seconds': elapsed
                    })}\n\n"

            # Send heartbeat every 15 seconds
            yield f"data: {json.dumps({'type': 'heartbeat', 'elapsed_seconds': elapsed})}\n\n"

            await asyncio.sleep(5)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
