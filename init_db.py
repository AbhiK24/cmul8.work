#!/usr/bin/env python3
"""Initialize the WorkSim database schema."""
import asyncio
import asyncpg
import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:pfPxXpKLCrqqoZWHPirgCftwXgKtCoBn@caboose.proxy.rlwy.net:31091/railway"
)

SCHEMA = """
-- Employers table with org profile
CREATE TABLE IF NOT EXISTS employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  -- Org profile fields
  company_name TEXT,
  industry TEXT,
  stage TEXT,
  company_size TEXT,
  description TEXT,
  website TEXT,
  hiring_focus TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES employers(id),
  candidate_token TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_link TEXT NOT NULL,
  candidate_type TEXT DEFAULT 'external',
  org_params JSONB NOT NULL,
  env JSONB,
  artifact_html TEXT,
  agent_histories JSONB DEFAULT '{}'::jsonb,
  relationship_scores JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  trace JSONB DEFAULT '[]'::jsonb,
  artifact_trace JSONB DEFAULT '[]'::jsonb,
  integrity_data JSONB,  -- Anti-cheat signals summary
  debrief JSONB,
  report JSONB,
  report_html_candidate TEXT,
  report_html_employer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_employer ON sessions(employer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_candidate_token ON sessions(candidate_token);

-- =====================
-- B2C TABLES (Separate from B2B)
-- =====================

-- B2C Users table (individuals practicing for themselves)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  -- Auth provider info (for social auth)
  auth_provider TEXT NOT NULL DEFAULT 'email',  -- 'email', 'google', 'linkedin'
  provider_id TEXT,  -- OAuth provider's user ID
  -- Optional password for email auth (NULL for social-only)
  password_hash TEXT,
  -- Profile
  job_role TEXT,  -- e.g., "Product Manager", "Engineering Manager"
  experience_level TEXT,  -- "early", "mid", "senior", "executive"
  goals JSONB DEFAULT '[]'::jsonb,  -- what they want to practice
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  -- Unique constraint for provider auth
  UNIQUE(auth_provider, provider_id)
);

-- B2C User Sessions (simulation history for individuals)
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  candidate_token TEXT NOT NULL,  -- Session access token
  -- Template reference
  template_slug TEXT NOT NULL,  -- e.g., "difficult-feedback", "pm-interview"
  template_title TEXT,
  skill_category TEXT,  -- "interview", "feedback", "negotiation", etc.
  -- Simulation environment (generated)
  env JSONB,
  org_params JSONB,  -- simulated org context
  -- Simulation state
  status TEXT DEFAULT 'pending',  -- 'pending', 'in_progress', 'complete', 'abandoned'
  artifact_html TEXT,
  agent_histories JSONB DEFAULT '{}'::jsonb,
  relationship_scores JSONB DEFAULT '{}'::jsonb,
  -- Traces and results
  trace JSONB DEFAULT '[]'::jsonb,
  artifact_trace JSONB DEFAULT '[]'::jsonb,
  debrief JSONB,
  report JSONB,
  report_html TEXT,
  -- Scores for progress tracking
  overall_score INTEGER,  -- 0-100
  skill_scores JSONB,  -- {"communication": 85, "empathy": 72, ...}
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER  -- how long they spent
);

-- B2C User skill progress (aggregated from sessions)
CREATE TABLE IF NOT EXISTS user_skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_category TEXT NOT NULL,
  sessions_completed INTEGER DEFAULT 0,
  average_score INTEGER,  -- 0-100
  best_score INTEGER,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_category)
);

-- Indexes for B2C tables
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_template ON user_sessions(template_slug);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(candidate_token);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_user ON user_skill_progress(user_id);
"""

async def init_db():
    print(f"Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)

    print("Creating schema...")
    await conn.execute(SCHEMA)

    # Verify tables exist
    tables = await conn.fetch("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
    """)

    print(f"Tables created: {[t['table_name'] for t in tables]}")

    await conn.close()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(init_db())
