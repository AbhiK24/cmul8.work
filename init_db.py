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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_employer ON sessions(employer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_candidate_token ON sessions(candidate_token);
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
