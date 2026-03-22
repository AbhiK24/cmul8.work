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
