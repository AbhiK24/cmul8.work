"""Database connection pool for the shell service."""
import os
import asyncpg
from typing import Optional

from .seeds import seed_training_templates

DATABASE_URL = os.environ.get("DATABASE_URL")

pool: Optional[asyncpg.Pool] = None


async def init_pool():
    """Initialize the database connection pool."""
    global pool
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required")
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)

    # Run migrations
    async with pool.acquire() as conn:
        # Add custom_roles column if not exists
        await conn.execute("""
            ALTER TABLE employers ADD COLUMN IF NOT EXISTS custom_roles JSONB DEFAULT '[]'::jsonb
        """)

        # Fix retroactive session statuses based on timestamps
        # Sessions with completed_at should be 'complete'
        await conn.execute("""
            UPDATE sessions
            SET status = 'complete'
            WHERE completed_at IS NOT NULL AND status != 'complete'
        """)

        # Sessions with started_at but no completed_at should be 'in_progress'
        await conn.execute("""
            UPDATE sessions
            SET status = 'in_progress'
            WHERE started_at IS NOT NULL AND completed_at IS NULL AND status NOT IN ('in_progress', 'complete')
        """)

        # Create training_templates table for pre-built training sims
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS training_templates (
                template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                slug TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                skill_category TEXT NOT NULL,
                description TEXT,
                learning_objectives JSONB DEFAULT '[]'::jsonb,
                duration_minutes INT DEFAULT 10,
                difficulty TEXT DEFAULT 'beginner',

                company_context JSONB NOT NULL,
                agents JSONB NOT NULL,
                tasks JSONB DEFAULT '[]'::jsonb,
                inbox JSONB DEFAULT '[]'::jsonb,
                inject_schedule JSONB DEFAULT '[]'::jsonb,
                artifact_content JSONB,

                framework_name TEXT,
                framework_reference JSONB,
                coaching_prompts JSONB DEFAULT '{}'::jsonb,
                evaluation_rubric JSONB,

                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Add training mode columns to sessions table
        await conn.execute("""
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'test'
        """)
        await conn.execute("""
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES training_templates(template_id)
        """)
        await conn.execute("""
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS framework_score FLOAT
        """)
        await conn.execute("""
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS coaching_notes JSONB DEFAULT '[]'::jsonb
        """)

        # Seed training templates
        await seed_training_templates(conn)

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
