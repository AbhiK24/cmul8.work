"""Generative Agents Memory System.

Implements the memory stream architecture from:
"Generative Agents: Interactive Simulacra of Human Behavior" (Park et al., 2023)

Key components:
- Memory Stream: Stores observations, reflections, and plans
- Retrieval: Uses recency + importance + relevance scoring
- Reflection: Generates higher-level insights from memories

Uses Kimi K2 for all LLM operations (no external embedding APIs).
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass

import asyncpg

from .embeddings import generate_semantic_summary, score_relevance_batch
from .kimi_client import call_kimi


# Retrieval weights (from the paper)
ALPHA_RECENCY = 1.0
ALPHA_IMPORTANCE = 1.0
ALPHA_RELEVANCE = 1.0

# Recency decay factor (0.995 per hour as in paper)
RECENCY_DECAY = 0.995

# Reflection threshold (trigger reflection when importance sum exceeds this)
REFLECTION_THRESHOLD = 150


@dataclass
class Memory:
    """A single memory in the stream."""
    id: uuid.UUID
    session_id: uuid.UUID
    agent_id: str
    memory_type: str  # 'observation', 'reflection', 'plan'
    content: str
    importance: int
    created_at: datetime
    last_accessed: datetime
    semantic_tags: Optional[str] = None
    source_memory_ids: Optional[list[uuid.UUID]] = None
    event_type: Optional[str] = None
    event_data: Optional[dict] = None


async def add_observation(
    pool: asyncpg.Pool,
    session_id: uuid.UUID,
    agent_id: str,
    content: str,
    event_type: str,
    event_data: dict | None = None
) -> Memory:
    """Add an observation to the memory stream."""
    # Generate importance score using Kimi
    importance = await score_importance(content)

    # Generate semantic tags for retrieval
    semantic_tags = await generate_semantic_summary(content)

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO memory_stream
                (session_id, agent_id, memory_type, content, importance, semantic_tags, event_type, event_data)
            VALUES ($1, $2, 'observation', $3, $4, $5, $6, $7)
            RETURNING id, created_at, last_accessed
        """, session_id, agent_id, content, importance, semantic_tags, event_type,
           json.dumps(event_data) if event_data else None)

        # Update agent state reflection pointer
        await conn.execute("""
            INSERT INTO agent_state (session_id, agent_id, reflection_pointer)
            VALUES ($1, $2, $3)
            ON CONFLICT (session_id, agent_id)
            DO UPDATE SET reflection_pointer = agent_state.reflection_pointer + $3
        """, session_id, agent_id, importance)

    return Memory(
        id=row['id'],
        session_id=session_id,
        agent_id=agent_id,
        memory_type='observation',
        content=content,
        importance=importance,
        created_at=row['created_at'],
        last_accessed=row['last_accessed'],
        semantic_tags=semantic_tags,
        event_type=event_type,
        event_data=event_data
    )


async def add_reflection(
    pool: asyncpg.Pool,
    session_id: uuid.UUID,
    agent_id: str,
    content: str,
    source_memory_ids: list[uuid.UUID]
) -> Memory:
    """Add a reflection (higher-level insight) to the memory stream."""
    importance = await score_importance(content)
    semantic_tags = await generate_semantic_summary(content)

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO memory_stream
                (session_id, agent_id, memory_type, content, importance, semantic_tags, source_memory_ids)
            VALUES ($1, $2, 'reflection', $3, $4, $5, $6)
            RETURNING id, created_at, last_accessed
        """, session_id, agent_id, content, importance, semantic_tags, source_memory_ids)

    return Memory(
        id=row['id'],
        session_id=session_id,
        agent_id=agent_id,
        memory_type='reflection',
        content=content,
        importance=importance,
        created_at=row['created_at'],
        last_accessed=row['last_accessed'],
        semantic_tags=semantic_tags,
        source_memory_ids=source_memory_ids
    )


async def score_importance(content: str) -> int:
    """Score the importance of a memory on a scale of 1-10 using Kimi K2."""
    prompt = f"""On the scale of 1 to 10, where 1 is purely mundane (e.g., routine greeting,
checking email) and 10 is extremely significant (e.g., major conflict, critical decision,
strong emotional reaction), rate the likely significance of the following workplace memory.

Memory: "{content}"

Respond with ONLY a single integer from 1 to 10."""

    response = await call_kimi(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        max_tokens=10
    )

    try:
        score = int(response.strip())
        return max(1, min(10, score))
    except ValueError:
        return 5


def compute_recency_score(memory: Memory, now: datetime) -> float:
    """Compute recency score using exponential decay."""
    hours_since_access = (now - memory.last_accessed).total_seconds() / 3600
    return RECENCY_DECAY ** hours_since_access


async def retrieve_memories(
    pool: asyncpg.Pool,
    session_id: uuid.UUID,
    agent_id: str,
    query: str,
    top_k: int = 10
) -> list[Memory]:
    """Retrieve the most relevant memories using the weighted scoring function.

    Score = α_recency * recency + α_importance * importance + α_relevance * relevance
    Uses Kimi K2 for relevance scoring.
    """
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        # Fetch recent memories for this agent
        rows = await conn.fetch("""
            SELECT id, session_id, agent_id, memory_type, content, importance,
                   semantic_tags, created_at, last_accessed, source_memory_ids, event_type, event_data
            FROM memory_stream
            WHERE session_id = $1 AND agent_id = $2
            ORDER BY created_at DESC
            LIMIT 50
        """, session_id, agent_id)

        if not rows:
            return []

        # Build Memory objects
        memories = []
        for row in rows:
            memories.append(Memory(
                id=row['id'],
                session_id=row['session_id'],
                agent_id=row['agent_id'],
                memory_type=row['memory_type'],
                content=row['content'],
                importance=row['importance'],
                created_at=row['created_at'],
                last_accessed=row['last_accessed'],
                semantic_tags=row['semantic_tags'],
                source_memory_ids=row['source_memory_ids'],
                event_type=row['event_type'],
                event_data=row['event_data']
            ))

        # Get relevance scores from Kimi K2 (batch scoring)
        memory_contents = [m.content for m in memories]
        relevance_scores = await score_relevance_batch(query, memory_contents)

        # Compute final scores
        scored_memories = []
        for i, memory in enumerate(memories):
            recency = compute_recency_score(memory, now)
            importance_normalized = memory.importance / 10.0
            relevance = relevance_scores[i] if i < len(relevance_scores) else 0.5

            score = (
                ALPHA_RECENCY * recency +
                ALPHA_IMPORTANCE * importance_normalized +
                ALPHA_RELEVANCE * relevance
            )
            scored_memories.append((score, memory))

        # Sort by score and take top_k
        scored_memories.sort(key=lambda x: x[0], reverse=True)
        top_memories = [m for _, m in scored_memories[:top_k]]

        # Update last_accessed
        memory_ids = [m.id for m in top_memories]
        await conn.execute("""
            UPDATE memory_stream
            SET last_accessed = NOW()
            WHERE id = ANY($1)
        """, memory_ids)

        return top_memories


async def should_reflect(pool: asyncpg.Pool, session_id: uuid.UUID, agent_id: str) -> bool:
    """Check if the agent should generate reflections."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT reflection_pointer FROM agent_state
            WHERE session_id = $1 AND agent_id = $2
        """, session_id, agent_id)

        if not row:
            return False

        return row['reflection_pointer'] >= REFLECTION_THRESHOLD


async def generate_reflections(
    pool: asyncpg.Pool,
    session_id: uuid.UUID,
    agent_id: str,
    agent_persona: str
) -> list[Memory]:
    """Generate reflections based on recent memories using Kimi K2."""
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, content, importance, memory_type
            FROM memory_stream
            WHERE session_id = $1 AND agent_id = $2
            ORDER BY created_at DESC
            LIMIT 50
        """, session_id, agent_id)

        if len(rows) < 5:
            return []

        memory_texts = [f"- {row['content']} (importance: {row['importance']})" for row in rows[:20]]
        memories_str = "\n".join(memory_texts)

        # Generate questions
        question_prompt = f"""You are {agent_persona}.

Given the following recent experiences and observations:
{memories_str}

What are 3 most salient high-level questions that you can answer about yourself,
your relationships, or your work situation based on these experiences?

Format: Return exactly 3 questions, one per line, without numbering."""

        questions_response = await call_kimi(
            messages=[{"role": "user", "content": question_prompt}],
            temperature=0.7,
            max_tokens=200
        )

        questions = [q.strip() for q in questions_response.strip().split("\n") if q.strip()][:3]

        # Generate reflections
        reflections = []
        for question in questions:
            relevant_memories = await retrieve_memories(pool, session_id, agent_id, question, top_k=5)

            if not relevant_memories:
                continue

            relevant_texts = [f"- {m.content}" for m in relevant_memories]
            relevant_str = "\n".join(relevant_texts)
            source_ids = [m.id for m in relevant_memories]

            insight_prompt = f"""You are {agent_persona}.

Question: {question}

Relevant memories:
{relevant_str}

Based on these memories, provide a concise insight or conclusion (1-2 sentences)
that answers the question."""

            insight = await call_kimi(
                messages=[{"role": "user", "content": insight_prompt}],
                temperature=0.7,
                max_tokens=150
            )

            reflection = await add_reflection(
                pool, session_id, agent_id, insight.strip(), source_ids
            )
            reflections.append(reflection)

        # Reset reflection pointer
        await conn.execute("""
            UPDATE agent_state
            SET reflection_pointer = 0
            WHERE session_id = $1 AND agent_id = $2
        """, session_id, agent_id)

        return reflections


async def get_memory_context(
    pool: asyncpg.Pool,
    session_id: uuid.UUID,
    agent_id: str,
    current_situation: str,
    max_memories: int = 8
) -> str:
    """Get formatted memory context for agent response generation."""
    memories = await retrieve_memories(pool, session_id, agent_id, current_situation, top_k=max_memories)

    if not memories:
        return ""

    formatted = []
    for m in memories:
        prefix = "[Reflection]" if m.memory_type == "reflection" else "[Memory]"
        formatted.append(f"{prefix} {m.content}")

    return "\n".join(formatted)


async def record_agent_interaction(
    pool: asyncpg.Pool,
    session_id: uuid.UUID,
    agent_id: str,
    interaction_type: str,
    content: str,
    metadata: dict | None = None
) -> Memory:
    """Record an interaction as an observation in the memory stream."""
    return await add_observation(
        pool=pool,
        session_id=session_id,
        agent_id=agent_id,
        content=content,
        event_type=interaction_type,
        event_data=metadata or {}
    )
