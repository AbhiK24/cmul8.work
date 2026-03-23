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

    # Run migrations - create all tables
    async with pool.acquire() as conn:
        # ============================================
        # B2B TABLES (Enterprise)
        # ============================================

        # Employers table - B2B enterprise accounts
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS employers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                clerk_id TEXT,
                name TEXT,
                company_name TEXT,
                company_description TEXT,
                industry TEXT,
                company_size TEXT,
                custom_roles JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Sessions table - B2B assessment/training sessions
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employer_id UUID REFERENCES employers(id),
                candidate_token TEXT NOT NULL,
                candidate_name TEXT NOT NULL,
                candidate_email TEXT NOT NULL,
                candidate_link TEXT,
                candidate_type TEXT DEFAULT 'external',
                role TEXT NOT NULL,
                org_name TEXT,
                org_params JSONB NOT NULL,
                env JSONB,
                artifact_html TEXT,
                agent_histories JSONB DEFAULT '{}'::jsonb,
                relationship_scores JSONB DEFAULT '{}'::jsonb,
                status TEXT DEFAULT 'pending',
                trace JSONB DEFAULT '[]'::jsonb,
                artifact_trace JSONB DEFAULT '[]'::jsonb,
                debrief JSONB,
                report JSONB,
                report_html_candidate TEXT,
                report_html_employer TEXT,
                mode TEXT DEFAULT 'test',
                template_id UUID,
                framework_score FLOAT,
                coaching_notes JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                started_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ
            )
        """)

        # Password reset tokens
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employer_id UUID NOT NULL REFERENCES employers(id),
                token TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # ============================================
        # B2C TABLES (Individual Users)
        # ============================================

        # Users table - B2C individual users (Clerk auth)
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

        # User sessions table - B2C practice sessions
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

        # ============================================
        # SHARED TABLES
        # ============================================

        # Training templates - pre-built scenarios for Train mode
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
                availability TEXT DEFAULT 'both',

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

        # ============================================
        # MIGRATIONS - Add columns to existing tables
        # ============================================

        # Add foreign key for sessions.template_id if not exists
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'sessions_template_id_fkey'
                ) THEN
                    ALTER TABLE sessions
                    ADD CONSTRAINT sessions_template_id_fkey
                    FOREIGN KEY (template_id) REFERENCES training_templates(template_id);
                END IF;
            EXCEPTION WHEN others THEN
                NULL;
            END $$;
        """)

        # Fix retroactive session statuses based on timestamps
        await conn.execute("""
            UPDATE sessions
            SET status = 'complete'
            WHERE completed_at IS NOT NULL AND status != 'complete'
        """)

        await conn.execute("""
            UPDATE sessions
            SET status = 'in_progress'
            WHERE started_at IS NOT NULL AND completed_at IS NULL AND status NOT IN ('in_progress', 'complete')
        """)

        # ============================================
        # SEED DATA
        # ============================================

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
