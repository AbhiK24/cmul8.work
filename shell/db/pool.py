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

        # Add missing columns to users table (for existing installations)
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'type') THEN
                    ALTER TABLE users ADD COLUMN type TEXT NOT NULL DEFAULT 'b2c';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
                    ALTER TABLE users ADD COLUMN password_hash TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'clerk_id') THEN
                    ALTER TABLE users ADD COLUMN clerk_id TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
                    ALTER TABLE users ADD COLUMN name TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
                    ALTER TABLE users ADD COLUMN avatar_url TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'job_role') THEN
                    ALTER TABLE users ADD COLUMN job_role TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'experience_level') THEN
                    ALTER TABLE users ADD COLUMN experience_level TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'goals') THEN
                    ALTER TABLE users ADD COLUMN goals JSONB DEFAULT '[]'::jsonb;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
                    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ DEFAULT NOW();
                END IF;
            END $$;
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
                website TEXT,
                hiring_focus TEXT,
                custom_roles JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Add missing columns to organizations table
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'website') THEN
                    ALTER TABLE organizations ADD COLUMN website TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'hiring_focus') THEN
                    ALTER TABLE organizations ADD COLUMN hiring_focus TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'custom_roles') THEN
                    ALTER TABLE organizations ADD COLUMN custom_roles JSONB DEFAULT '[]'::jsonb;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'updated_at') THEN
                    ALTER TABLE organizations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
                END IF;
            END $$;
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

        # Add template_id column as alias for id (for backwards compatibility with queries)
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_templates' AND column_name = 'template_id') THEN
                    ALTER TABLE training_templates ADD COLUMN template_id UUID GENERATED ALWAYS AS (id) STORED;
                END IF;
            END $$;
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

        # Add missing columns to b2b_sessions table (renamed from sessions)
        await conn.execute("""
            DO $$
            BEGIN
                -- Rename employer_id to org_id if it exists
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'employer_id') THEN
                    ALTER TABLE b2b_sessions RENAME COLUMN employer_id TO org_id;
                END IF;
                -- Add org_id if neither exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'org_id') THEN
                    ALTER TABLE b2b_sessions ADD COLUMN org_id UUID;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'mode') THEN
                    ALTER TABLE b2b_sessions ADD COLUMN mode TEXT NOT NULL DEFAULT 'assess';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'assessment_template_id') THEN
                    ALTER TABLE b2b_sessions ADD COLUMN assessment_template_id UUID;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'training_template_id') THEN
                    ALTER TABLE b2b_sessions ADD COLUMN training_template_id UUID;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'candidate_user_id') THEN
                    ALTER TABLE b2b_sessions ADD COLUMN candidate_user_id UUID;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'candidate_type') THEN
                    ALTER TABLE b2b_sessions ADD COLUMN candidate_type TEXT DEFAULT 'external';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'framework_score') THEN
                    ALTER TABLE b2b_sessions ADD COLUMN framework_score FLOAT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'coaching_notes') THEN
                    ALTER TABLE b2b_sessions ADD COLUMN coaching_notes JSONB DEFAULT '[]'::jsonb;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2b_sessions' AND column_name = 'created_by') THEN
                    ALTER TABLE b2b_sessions ADD COLUMN created_by UUID;
                END IF;
            END $$;
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
                debrief JSONB,
                report JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                started_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ
            )
        """)

        # Add missing columns to b2c_sessions table
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2c_sessions' AND column_name = 'debrief') THEN
                    ALTER TABLE b2c_sessions ADD COLUMN debrief JSONB;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2c_sessions' AND column_name = 'report') THEN
                    ALTER TABLE b2c_sessions ADD COLUMN report JSONB;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'b2c_sessions' AND column_name = 'relationship_scores') THEN
                    ALTER TABLE b2c_sessions ADD COLUMN relationship_scores JSONB DEFAULT '{}'::jsonb;
                END IF;
            END $$;
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
