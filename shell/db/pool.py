"""Database connection pool for the shell service."""
import os
import asyncpg
from typing import Optional

DATABASE_URL = os.environ.get("DATABASE_URL")

pool: Optional[asyncpg.Pool] = None


async def init_pool():
    """Initialize the database connection pool."""
    global pool
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required")
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return pool


async def close_pool():
    """Close the database connection pool."""
    global pool
    if pool:
        await pool.close()
        pool = None


async def get_pool() -> asyncpg.Pool:
    """Get the database connection pool."""
    if pool is None:
        raise RuntimeError("Database pool not initialized")
    return pool
