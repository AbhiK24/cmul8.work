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


class DocActivityRequest(BaseModel):
    session_id: str
    token: str
    elapsed_seconds: int


class DocComment(BaseModel):
    comment_id: str
    agent_id: str
    agent_name: str
    section_id: str
    content: str
    timestamp: float


class DocPresence(BaseModel):
    agent_id: str
    agent_name: str
    action: str  # viewing|typing
    section_id: Optional[str] = None


class DocActivityResponse(BaseModel):
    has_activity: bool
    presence: list[DocPresence] = []
    new_comments: list[DocComment] = []
    edits: list[dict] = []  # Section edits by agents


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


def get_triggered_help_requests(agents: list, elapsed_seconds: int, fired_help_requests: list) -> tuple:
    """Check if any agent has a help request that should trigger now.

    Returns: (agent, help_request) or (None, None)
    """
    for agent in agents:
        for help_req in agent.get("help_requests", []):
            trigger_time = help_req.get("trigger_seconds", 0)
            # Check if we're within 30 seconds of trigger time and haven't fired this yet
            req_id = f"{agent['agent_id']}_{trigger_time}_{help_req.get('topic', '')}"
            if (trigger_time <= elapsed_seconds <= trigger_time + 60
                and req_id not in fired_help_requests):
                return agent, help_req, req_id
    return None, None, None


@router.post("/tick", response_model=AutonomyTickResponse)
async def autonomy_tick(request: AutonomyTickRequest) -> AutonomyTickResponse:
    """Check if any agent wants to initiate contact with the candidate.

    Called every 60-120 seconds by the frontend.
    Returns an agent message if one decides to reach out.
    Prioritizes: 1) Help requests 2) Proactive messages
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

        # Track which help requests have been fired
        fired_help_requests = [
            e.get("content", {}).get("help_request_id")
            for e in trace
            if e.get("event_type") == "help_request_sent"
        ]

        # Priority 1: Check for triggered help requests
        help_agent, help_request, help_req_id = get_triggered_help_requests(
            agents, request.elapsed_seconds, fired_help_requests
        )

        if help_agent and help_request:
            agent_id = help_agent["agent_id"]
            agent_name = help_agent["name"]
            relationship = relationship_scores.get(agent_id, 0.5)

            # Only ask for help if relationship is decent (they trust you)
            if relationship >= 0.4:
                message = help_request.get("message", "Hey, could you help me with something?")
                context = help_request.get("context")

                if context:
                    message += f"\n\n{context}"

                # Find or create thread
                inbox = env.get("inbox", [])
                existing_thread = None
                for thread in inbox:
                    if thread.get("from_agent_id") == agent_id:
                        existing_thread = thread
                        break

                is_new_thread = existing_thread is None
                thread_id = existing_thread["thread_id"] if existing_thread else str(uuid.uuid4())
                subject = f"Quick favor?" if is_new_thread else None

                # Record help request in trace
                trace_event = {
                    "event_id": str(uuid.uuid4()),
                    "session_id": request.session_id,
                    "timestamp": time.time(),
                    "elapsed_seconds": request.elapsed_seconds,
                    "event_type": "help_request_sent",
                    "agent_id": agent_id,
                    "content": {
                        "help_request_id": help_req_id,
                        "topic": help_request.get("topic"),
                        "message": message,
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


@router.post("/doc-activity", response_model=DocActivityResponse)
async def doc_activity_tick(request: DocActivityRequest) -> DocActivityResponse:
    """Check for document activity - agents viewing, typing, commenting.

    Creates the illusion of a shared workspace where others are working.
    """
    pool = await get_pool()

    async with pool.acquire() as conn:
        row, table_name = await get_session_data(conn, request.session_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        env = json.loads(row["env"]) if row["env"] else {}
        trace = json.loads(row["trace"]) if row["trace"] else []

        agents = env.get("agents", [])
        artifact = env.get("artifact_content", {})
        sections = artifact.get("sections", [])

        if not agents or not sections:
            return DocActivityResponse(has_activity=False)

        # Get existing doc comments from trace
        existing_comments = [
            e.get("content", {}).get("comment_id")
            for e in trace
            if e.get("event_type") == "doc_comment"
        ]

        presence = []
        new_comments = []
        edits = []

        # Simulate agent presence (random chance an agent is "viewing")
        for agent in agents:
            if random.random() < 0.25:  # 25% chance any agent is viewing
                presence.append(DocPresence(
                    agent_id=agent["agent_id"],
                    agent_name=agent["name"],
                    action="viewing",
                    section_id=None
                ))
            elif random.random() < 0.1:  # 10% chance typing in a section
                section = random.choice(sections)
                presence.append(DocPresence(
                    agent_id=agent["agent_id"],
                    agent_name=agent["name"],
                    action="typing",
                    section_id=section["section_id"]
                ))

        # Chance to generate a new comment (more likely later in sim)
        comment_chance = 0.1 + (request.elapsed_seconds / 2700) * 0.2  # 10-30%

        if random.random() < comment_chance and agents:
            # Pick an agent with artifact knowledge to comment
            commenting_agents = [a for a in agents if a.get("artifact_knowledge")]
            if not commenting_agents:
                commenting_agents = agents

            agent = random.choice(commenting_agents)
            section = random.choice(sections)

            # Generate comment using Kimi
            artifact_knowledge = agent.get("artifact_knowledge", "")
            section_content = section.get("content", "")[:200]

            comment_prompt = f"""You are {agent["name"]}, {agent["role"]}.

You're reviewing a shared document and want to leave a brief comment on a section.

Section title: {section["title"]}
Section content preview: {section_content}...

{"Your knowledge about this artifact: " + artifact_knowledge if artifact_knowledge else ""}

Write a SHORT comment (1 sentence) - something you'd leave in Google Docs.
Could be a question, suggestion, concern, or note.
Be natural and specific to the content.

Just write the comment, nothing else."""

            try:
                comment_text = await call_kimi(
                    messages=[{"role": "user", "content": comment_prompt}],
                    temperature=0.8,
                    max_tokens=100
                )
                comment_text = comment_text.strip().strip('"')

                comment_id = str(uuid.uuid4())
                new_comment = DocComment(
                    comment_id=comment_id,
                    agent_id=agent["agent_id"],
                    agent_name=agent["name"],
                    section_id=section["section_id"],
                    content=comment_text,
                    timestamp=time.time()
                )
                new_comments.append(new_comment)

                # Record in trace
                trace_event = {
                    "event_id": str(uuid.uuid4()),
                    "session_id": request.session_id,
                    "timestamp": time.time(),
                    "elapsed_seconds": request.elapsed_seconds,
                    "event_type": "doc_comment",
                    "agent_id": agent["agent_id"],
                    "content": {
                        "comment_id": comment_id,
                        "section_id": section["section_id"],
                        "comment_text": comment_text
                    }
                }

                await conn.execute(f"""
                    UPDATE {table_name}
                    SET trace = trace || $1::jsonb
                    WHERE session_id = $2
                """, json.dumps([trace_event]), request.session_id)

            except Exception:
                pass  # Silently fail comment generation

        has_activity = len(presence) > 0 or len(new_comments) > 0

        return DocActivityResponse(
            has_activity=has_activity,
            presence=presence,
            new_comments=new_comments,
            edits=edits
        )
