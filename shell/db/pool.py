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

        # Create users table for B2C users (Clerk auth)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                avatar_url TEXT,
                auth_provider TEXT DEFAULT 'clerk',
                provider_id TEXT,
                job_role TEXT,
                experience_level TEXT,
                goals JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_login_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Create user_sessions table for B2C practice sessions
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                template_slug TEXT NOT NULL,
                template_title TEXT,
                skill_category TEXT,
                env JSONB,
                org_params JSONB,
                candidate_token TEXT NOT NULL,
                status TEXT DEFAULT 'ready',
                overall_score INT,
                agent_histories JSONB DEFAULT '{}'::jsonb,
                trace JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                started_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ
            )
        """)

        # Add availability column to training_templates for B2B/B2C filtering
        await conn.execute("""
            ALTER TABLE training_templates ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'both'
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
