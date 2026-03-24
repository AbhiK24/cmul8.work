"""WorkSim Engine - Core simulation service."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db.pool import init_pool, close_pool, get_pool
from .db.migrations import run_migrations
from .engine.kimi_client import init_kimi
from .api import generate, message, events, score, health, trace, autonomy


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await init_pool()
    init_kimi()
    # Run database migrations (creates pgvector extension and tables)
    pool = await get_pool()
    await run_migrations(pool)
    yield
    # Shutdown
    await close_pool()


app = FastAPI(
    title="WorkSim Engine",
    description="Core simulation engine for WorkSim hiring assessments",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, tags=["health"])
app.include_router(generate.router, tags=["simulation"])
app.include_router(message.router, tags=["simulation"])
app.include_router(events.router, tags=["simulation"])
app.include_router(score.router, tags=["simulation"])
app.include_router(trace.router, tags=["trace"])
app.include_router(autonomy.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "worksim-engine",
        "version": "0.1.0",
        "status": "running"
    }
