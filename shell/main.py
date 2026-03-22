"""Shell service - Auth layer and session management for WorkSim."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db.pool import init_pool, close_pool
from .api.auth import router as auth_router
from .api.sessions import router as sessions_router
from .api.candidate import router as candidate_router
from .api.debrief import router as debrief_router
from .api.profile import router as profile_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await init_pool()
    yield
    # Shutdown
    await close_pool()


app = FastAPI(
    title="WorkSim Shell",
    description="Auth layer and session management for WorkSim",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://www.cmul8.work")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(sessions_router)
app.include_router(candidate_router)
app.include_router(debrief_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "shell"}


@app.post("/debug/fix-session/{session_id}")
async def fix_session_status(session_id: str, status: str = "complete"):
    """Debug: manually fix a session's status."""
    from .db.pool import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        if status == "complete":
            await conn.execute("""
                UPDATE sessions
                SET status = 'complete', completed_at = COALESCE(completed_at, NOW())
                WHERE session_id = $1
            """, session_id)
        elif status == "in_progress":
            await conn.execute("""
                UPDATE sessions
                SET status = 'in_progress', started_at = COALESCE(started_at, NOW())
                WHERE session_id = $1
            """, session_id)
        return {"updated": session_id, "new_status": status}


@app.get("/debug/sessions")
async def debug_sessions():
    """Debug endpoint to check session statuses."""
    from .db.pool import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT session_id, status, started_at, completed_at,
                   debrief IS NOT NULL as has_debrief,
                   env IS NOT NULL as has_env,
                   trace IS NOT NULL as has_trace,
                   report IS NOT NULL as has_report,
                   agent_histories
            FROM sessions
            ORDER BY created_at DESC
            LIMIT 10
        """)
        return [
            {
                "session_id": str(row["session_id"]),
                "status": row["status"],
                "started_at": str(row["started_at"]) if row["started_at"] else None,
                "completed_at": str(row["completed_at"]) if row["completed_at"] else None,
                "has_debrief": row["has_debrief"],
                "has_env": row["has_env"],
                "has_trace": row["has_trace"],
                "has_report": row["has_report"],
                "has_agent_history": row["agent_histories"] not in (None, '{}', '[]')
            }
            for row in rows
        ]
