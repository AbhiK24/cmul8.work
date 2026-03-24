"""POST /autonomy/tick - Agent autonomy loop.

Agents can initiate contact with the candidate based on:
- Their proactivity trait
- Current concerns/agenda
- World state (time elapsed, recent events)
- What's happening with other agents

This makes the world feel alive - agents don't just respond, they act.
"""
import json
import random
import uuid
import time
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..engine.kimi_client import call_kimi
from ..db.pool import get_pool

router = APIRouter(prefix="/autonomy", tags=["autonomy"])


class AutonomyTickRequest(BaseModel):
    session_id: str
    token: str
    elapsed_seconds: int


class AutonomyTickResponse(BaseModel):
    should_act: bool
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    message: Optional[str] = None
    thread_id: Optional[str] = None
    is_new_thread: bool = False
    subject: Optional[str] = None  # For new threads


async def get_session_data(conn, session_id: str):
    """Get session from either B2B or B2C table."""
    row = await conn.fetchrow("""
        SELECT env, agent_histories, relationship_scores, trace
        FROM b2b_sessions WHERE session_id = $1
    """, session_id)
    if row:
        return row, "b2b_sessions"

    row = await conn.fetchrow("""
        SELECT env, agent_histories, relationship_scores, trace
        FROM b2c_sessions WHERE session_id = $1
    """, session_id)
    if row:
        return row, "b2c_sessions"

    return None, None


@router.post("/tick", response_model=AutonomyTickResponse)
async def autonomy_tick(request: AutonomyTickRequest) -> AutonomyTickResponse:
    """Check if any agent wants to initiate contact with the candidate.

    Called every 60-120 seconds by the frontend.
    Returns an agent message if one decides to reach out.
    """
    pool = await get_pool()

    async with pool.acquire() as conn:
        row, table_name = await get_session_data(conn, request.session_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        env = json.loads(row["env"]) if row["env"] else {}
        agent_histories = json.loads(row["agent_histories"]) if row["agent_histories"] else {}
        relationship_scores = json.loads(row["relationship_scores"]) if row["relationship_scores"] else {}
        trace = json.loads(row["trace"]) if row["trace"] else []

        agents = env.get("agents", [])
        if not agents:
            return AutonomyTickResponse(should_act=False)

        # Determine which agent (if any) should initiate
        selected_agent = None
        initiation_reason = None

        for agent in agents:
            proactivity = agent.get("proactivity", 0.3)
            agent_id = agent["agent_id"]

            # Get conversation history length
            history = agent_histories.get(agent_id, [])
            relationship = relationship_scores.get(agent_id, 0.5)

            # Factors that increase likelihood of initiating:
            # 1. High proactivity trait
            # 2. Has a current concern
            # 3. Haven't talked much yet (wants to connect)
            # 4. Good relationship (comfortable reaching out)
            # 5. Time-based triggers (certain concerns become urgent)

            initiation_score = proactivity

            # Boost if they have something on their mind
            if agent.get("current_concern"):
                initiation_score += 0.2

            # Boost if haven't talked yet (ice-breaker)
            if len(history) == 0 and request.elapsed_seconds > 180:
                initiation_score += 0.15

            # Boost if relationship is good
            if relationship > 0.6:
                initiation_score += 0.1

            # Time pressure - concerns become more urgent over time
            if request.elapsed_seconds > 1200:  # After 20 min
                initiation_score += 0.1

            # Random factor
            roll = random.random()

            if roll < initiation_score * 0.3:  # Scale down to prevent spam
                selected_agent = agent
                if agent.get("current_concern"):
                    initiation_reason = agent["current_concern"]
                elif len(history) == 0:
                    initiation_reason = "ice_breaker"
                else:
                    initiation_reason = "follow_up"
                break

        if not selected_agent:
            return AutonomyTickResponse(should_act=False)

        # Generate the agent's message
        agent_name = selected_agent["name"]
        agent_role = selected_agent["role"]
        agent_id = selected_agent["agent_id"]
        persona = selected_agent.get("persona_prompt", "")
        current_concern = selected_agent.get("current_concern", "")
        will_initiate_about = selected_agent.get("will_initiate_about", [])
        relationship = relationship_scores.get(agent_id, 0.5)

        # Build context for message generation
        history = agent_histories.get(agent_id, [])
        history_summary = ""
        if history:
            recent = history[-4:]
            for msg in recent:
                role = "Candidate" if msg.get("sender") == "candidate" else agent_name
                content = msg.get("content", "")[:100]
                history_summary += f"{role}: {content}...\n"

        # Determine message type
        if initiation_reason == "ice_breaker":
            message_type = "reaching out to introduce yourself or break the ice"
        elif current_concern:
            message_type = f"reaching out about: {current_concern}"
        else:
            message_type = "following up or checking in"

        prompt = f"""You are {agent_name}, {agent_role}.

Persona: {persona}

You are INITIATING contact with the candidate (they didn't message you first).
Reason: {message_type}

{"Your current concern: " + current_concern if current_concern else ""}
{"Topics you might bring up: " + ", ".join(will_initiate_about) if will_initiate_about else ""}

Current relationship with candidate: {relationship:.0%} ({"good" if relationship > 0.6 else "neutral" if relationship > 0.4 else "tense"})

{"Recent conversation:" + chr(10) + history_summary if history_summary else "You haven't spoken to the candidate yet."}

Time elapsed in their workday: {request.elapsed_seconds // 60} minutes

Write a SHORT message (1-2 sentences) initiating contact. Be natural - like a real coworker would message on Slack.
Don't be formal. Don't introduce yourself if you've already talked.
If ice-breaking, be friendly but have a reason (don't just say hi).

Just write the message, nothing else."""

        try:
            message = await call_kimi(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=150
            )
            message = message.strip().strip('"')
        except Exception as e:
            return AutonomyTickResponse(should_act=False)

        # Check if there's an existing thread with this agent
        inbox = env.get("inbox", [])
        existing_thread = None
        for thread in inbox:
            if thread.get("from_agent_id") == agent_id:
                existing_thread = thread
                break

        is_new_thread = existing_thread is None
        thread_id = existing_thread["thread_id"] if existing_thread else str(uuid.uuid4())

        # Generate subject for new thread
        subject = None
        if is_new_thread:
            subject = f"Message from {agent_name}"
            if current_concern:
                # Generate a subject based on concern
                subject = current_concern[:50] + "..." if len(current_concern) > 50 else current_concern

        # Record in trace
        trace_event = {
            "event_id": str(uuid.uuid4()),
            "session_id": request.session_id,
            "timestamp": time.time(),
            "elapsed_seconds": request.elapsed_seconds,
            "event_type": "agent_initiated",
            "agent_id": agent_id,
            "content": {
                "message": message,
                "reason": initiation_reason,
                "thread_id": thread_id
            }
        }

        await conn.execute(f"""
            UPDATE {table_name}
            SET trace = trace || $1::jsonb
            WHERE session_id = $2
        """, json.dumps([trace_event]), request.session_id)

        return AutonomyTickResponse(
            should_act=True,
            agent_id=agent_id,
            agent_name=agent_name,
            message=message,
            thread_id=thread_id,
            is_new_thread=is_new_thread,
            subject=subject
        )
