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
        # UNIFIED USERS TABLE (B2B + B2C)
        # ============================================

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL DEFAULT 'b2c',  -- 'b2b' or 'b2c'
                password_hash TEXT,                 -- B2B users (null if Clerk-only)
                clerk_id TEXT,                      -- Clerk SSO
                name TEXT,
                avatar_url TEXT,
                job_role TEXT,
                experience_level TEXT,
                goals JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_login_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # ============================================
        # ORGANIZATIONS (B2B Multi-tenant)
        # ============================================

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                industry TEXT,
                stage TEXT,
                company_size TEXT,
                description TEXT,
                logo_url TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # ============================================
        # ORG MEMBERS (Users belong to Orgs)
        # ============================================

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS org_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role TEXT NOT NULL DEFAULT 'member',  -- 'admin' or 'member'
                invited_by UUID REFERENCES users(id),
                invited_at TIMESTAMPTZ DEFAULT NOW(),
                joined_at TIMESTAMPTZ,
                status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'active', 'inactive'
                UNIQUE(org_id, user_id)
            )
        """)

        # ============================================
        # ASSESSMENT TEMPLATES (Org-specific, reusable)
        # ============================================

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS assessment_templates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                slug TEXT NOT NULL,
                title TEXT NOT NULL,
                role TEXT NOT NULL,
                industry TEXT,
                stage TEXT,
                function TEXT,
                job_description TEXT,
                custom_context JSONB DEFAULT '{}'::jsonb,
                generated_env JSONB,  -- Cached generated environment
                created_by UUID REFERENCES users(id),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(org_id, slug)
            )
        """)

        # ============================================
        # TRAINING TEMPLATES (Shared, platform-wide)
        # ============================================

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS training_templates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                slug TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                skill_category TEXT NOT NULL,
                description TEXT,
                learning_objectives JSONB DEFAULT '[]'::jsonb,
                duration_minutes INT DEFAULT 10,
                difficulty TEXT DEFAULT 'beginner',
                availability TEXT DEFAULT 'both',  -- 'both', 'b2b_only', 'b2c_only'

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
        # B2B SESSIONS (Enterprise assess + train)
        # ============================================

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS b2b_sessions (
                session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                mode TEXT NOT NULL DEFAULT 'assess',  -- 'assess' or 'train'

                -- Template references (one or the other based on mode)
                assessment_template_id UUID REFERENCES assessment_templates(id),
                training_template_id UUID REFERENCES training_templates(id),

                -- Candidate info
                candidate_user_id UUID REFERENCES users(id),  -- If internal & signed up
                candidate_type TEXT DEFAULT 'external',       -- 'internal' or 'external'
                candidate_name TEXT NOT NULL,
                candidate_email TEXT NOT NULL,
                candidate_token TEXT NOT NULL,
                candidate_link TEXT,

                -- Session data
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
                framework_score FLOAT,
                coaching_notes JSONB DEFAULT '[]'::jsonb,

                -- Timestamps
                created_at TIMESTAMPTZ DEFAULT NOW(),
                started_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ,

                -- Created by
                created_by UUID REFERENCES users(id)
            )
        """)

        # ============================================
        # B2C SESSIONS (Individual practice)
        # ============================================

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS b2c_sessions (
                session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                training_template_id UUID REFERENCES training_templates(id),
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
        # PASSWORD RESET TOKENS
        # ============================================

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # ============================================
        # ORG INVITATIONS (for tracking invite links)
        # ============================================

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS org_invitations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                email TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'member',
                token TEXT NOT NULL UNIQUE,
                invited_by UUID REFERENCES users(id),
                expires_at TIMESTAMPTZ NOT NULL,
                accepted_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # ============================================
        # INDEXES
        # ============================================

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
            CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);
            CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
            CREATE INDEX IF NOT EXISTS idx_b2b_sessions_org ON b2b_sessions(org_id);
            CREATE INDEX IF NOT EXISTS idx_b2c_sessions_user ON b2c_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_assessment_templates_org ON assessment_templates(org_id);
        """)

        # ============================================
        # SEED DATA
        # ============================================

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
