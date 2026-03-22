"""Database migrations for WorkSim Engine."""
import asyncpg


async def run_migrations(pool: asyncpg.Pool):
    """Run all database migrations."""
    async with pool.acquire() as conn:
        # Create memory_stream table for Generative Agents architecture
        # Uses Kimi K2 for relevance scoring instead of vector embeddings
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS memory_stream (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL,
                agent_id TEXT NOT NULL,
                memory_type TEXT NOT NULL CHECK (memory_type IN ('observation', 'reflection', 'plan')),
                content TEXT NOT NULL,
                importance INTEGER NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
                semantic_tags TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_accessed TIMESTAMPTZ DEFAULT NOW(),

                -- For reflections: pointers to source memories
                source_memory_ids UUID[] DEFAULT '{}',

                -- For observations: the raw event that triggered this
                event_type TEXT,
                event_data JSONB
            );
        """)

        # Create indexes for efficient retrieval
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_memory_stream_session_agent
            ON memory_stream(session_id, agent_id);
        """)

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_memory_stream_created_at
            ON memory_stream(created_at DESC);
        """)

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_memory_stream_importance
            ON memory_stream(importance DESC);
        """)

        # Create agent_state table for current plans and goals
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_state (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL,
                agent_id TEXT NOT NULL,
                current_plan JSONB DEFAULT '[]',
                relationship_score REAL DEFAULT 50.0,
                interaction_count INTEGER DEFAULT 0,
                last_interaction_at TIMESTAMPTZ,
                reflection_pointer INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(session_id, agent_id)
            );
        """)

        print("Migrations completed successfully")
