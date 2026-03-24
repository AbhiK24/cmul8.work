"""POST /message - Send a message to an agent and get a response.

Implements Generative Agents memory architecture:
- Records observations to memory stream
- Retrieves relevant memories for context
- Triggers reflections when importance threshold exceeded
"""
import json
import uuid
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..schemas.input_schema import MessageRequest
from ..schemas.env_schema import MessageResponse, TraceEvent, GeneratedImage, MessageContent
from ..engine.kimi_client import call_kimi
from ..engine.memory import (
    record_agent_interaction,
    get_memory_context,
    should_reflect,
    generate_reflections
)
from ..engine.image_gen import generate_diagram, generate_scene, generate_handwritten_notes, generate_chart
from ..db.pool import get_pool
import re

router = APIRouter()

# Load prompt template
PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "agent_runtime.txt"
AGENT_PROMPT = PROMPT_PATH.read_text()


def calculate_relationship_delta(message: str, reply: str) -> float:
    """Calculate relationship score change based on interaction quality."""
    # Simple heuristic - in production this could be more sophisticated
    positive_signals = ["thank", "appreciate", "understand", "help", "great", "agree"]
    negative_signals = ["no", "can't", "won't", "busy", "later", "don't"]

    message_lower = message.lower()
    delta = 0.0

    for signal in positive_signals:
        if signal in message_lower:
            delta += 0.03

    for signal in negative_signals:
        if signal in message_lower:
            delta -= 0.02

    # Clamp delta
    return max(-0.1, min(0.15, delta))


async def detect_and_generate_image(reply: str) -> tuple[str, GeneratedImage | None]:
    """Detect if agent wants to share an image and generate it.

    Looks for patterns like:
    - [DIAGRAM: description]
    - [SKETCH: description]
    - [CHART: description]
    - [NOTES: description]
    - [SCENE: description]

    Returns: (cleaned_reply, generated_image or None)
    """
    image_patterns = {
        "DIAGRAM": ("diagram", generate_diagram),
        "SKETCH": ("diagram", generate_diagram),
        "FLOWCHART": ("diagram", lambda d: generate_diagram(d, "flowchart")),
        "ARCHITECTURE": ("diagram", lambda d: generate_diagram(d, "architecture")),
        "CHART": ("chart", generate_chart),
        "GRAPH": ("chart", lambda d: generate_chart(d, "line")),
        "NOTES": ("notes", generate_handwritten_notes),
        "SCENE": ("scene", generate_scene),
        "SCREENSHOT": ("scene", lambda d: generate_scene(d, "workspace")),
    }

    # Look for [TYPE: description] pattern
    pattern = r'\[(' + '|'.join(image_patterns.keys()) + r'):\s*([^\]]+)\]'
    match = re.search(pattern, reply, re.IGNORECASE)

    if not match:
        return reply, None

    image_type_key = match.group(1).upper()
    description = match.group(2).strip()
    image_type, gen_func = image_patterns[image_type_key]

    try:
        result = await gen_func(description)
        if result and result.get("url"):
            # Clean the reply - replace the tag with a reference
            cleaned_reply = re.sub(pattern, "(see attached image)", reply, count=1, flags=re.IGNORECASE)
            return cleaned_reply, GeneratedImage(
                image_id=f"runtime_{uuid.uuid4().hex[:8]}",
                image_type=image_type,
                description=description,
                url=result["url"],
                context="Agent shared this during conversation"
            )
    except Exception as e:
        print(f"Runtime image generation failed: {e}")

    return reply, None


def check_escalation(agent: dict, current_score: float, new_score: float) -> tuple[bool, str | None]:
    """Check if agent should escalate to their manager.

    Returns: (should_escalate, reason)
    """
    archetype = agent.get("archetype", "standard")
    escalation_threshold = agent.get("escalation_threshold", 0.25)

    # Only difficult agents escalate
    if archetype != "difficult":
        return False, None

    # Escalate if relationship dropped below threshold
    if new_score <= escalation_threshold and current_score > escalation_threshold:
        return True, f"Relationship dropped below acceptable level ({new_score:.0%})"

    # Escalate if relationship is critically low and declining
    if new_score <= 0.2 and new_score < current_score:
        return True, f"Critical relationship breakdown ({new_score:.0%})"

    return False, None


async def get_session_with_table(conn, session_id: str):
    """Get session data from either b2b_sessions or b2c_sessions.

    Returns: (row, table_name) or (None, None) if not found
    """
    # Try B2B first
    row = await conn.fetchrow("""
        SELECT env, agent_histories, relationship_scores, trace
        FROM b2b_sessions WHERE session_id = $1
    """, session_id)
    if row:
        return row, "b2b_sessions"

    # Try B2C
    row = await conn.fetchrow("""
        SELECT env, agent_histories, relationship_scores, trace
        FROM b2c_sessions WHERE session_id = $1
    """, session_id)
    if row:
        return row, "b2c_sessions"

    return None, None


@router.post("/message", response_model=MessageResponse)
async def send_message(request: MessageRequest) -> MessageResponse:
    """Send a message to an agent and get their response.

    Uses Generative Agents memory architecture for context retrieval.
    """

    pool = await get_pool()

    async with pool.acquire() as conn:
        # Get session data from either B2B or B2C table
        row, table_name = await get_session_with_table(conn, request.session_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        env = json.loads(row["env"]) if row["env"] else {}
        agent_histories = json.loads(row["agent_histories"]) if row["agent_histories"] else {}
        relationship_scores = json.loads(row["relationship_scores"]) if row["relationship_scores"] else {}
        trace = json.loads(row["trace"]) if row["trace"] else []

        # Find the agent
        agent = None
        for a in env.get("agents", []):
            if a["agent_id"] == request.agent_id:
                agent = a
                break

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Get conversation history for this agent
        history = agent_histories.get(request.agent_id, [])
        # All relationships start at 0.5 (neutral midpoint)
        current_score = relationship_scores.get(request.agent_id, 0.5)

        # Record incoming message as observation in memory stream
        await record_agent_interaction(
            pool=pool,
            session_id=request.session_id,
            agent_id=request.agent_id,
            interaction_type="message_received",
            content=f"The candidate said: '{request.message_text}'",
            metadata={"sender": "candidate", "thread_id": request.thread_id}
        )

        # Get relevant memories for context (Generative Agents retrieval)
        memory_context = await get_memory_context(
            pool=pool,
            session_id=request.session_id,
            agent_id=request.agent_id,
            current_situation=f"The candidate just sent me this message: {request.message_text}",
            max_memories=8
        )

        # Check if we should trigger reflections
        if await should_reflect(pool, request.session_id, request.agent_id):
            await generate_reflections(
                pool=pool,
                session_id=request.session_id,
                agent_id=request.agent_id,
                agent_persona=agent.get("persona_prompt", agent["name"])
            )

        # Build conversation history string (last 6 messages for immediate context)
        history_str = ""
        for msg in history[-6:]:
            role = "Candidate" if msg["sender"] == "candidate" else agent["name"]
            content = msg.get("content", "")
            # Handle multimodal content
            if isinstance(content, list):
                text_parts = [c.get("text", "") for c in content if c.get("type") == "text"]
                content = " ".join(text_parts) + " [+image]" if any(c.get("type") == "image_url" for c in content) else " ".join(text_parts)
            history_str += f"{role}: {content}\n"

        # Build task knowledge context
        task_knowledge_str = ""
        for tk in agent.get("task_knowledge", []):
            task_knowledge_str += f"- Task '{tk.get('task_id', 'unknown')}': {tk.get('info_description', 'N/A')}\n"
            task_knowledge_str += f"  Share condition: {tk.get('will_share_if', 'when asked')}\n"
        if not task_knowledge_str:
            task_knowledge_str = "No specific task-related information."

        # Build background chatter context (conversations involving this agent)
        chatter_str = ""
        agent_names = {a["agent_id"]: a["name"] for a in env.get("agents", [])}
        for chatter in env.get("background_chatter", []):
            if chatter.get("agent_a_id") == request.agent_id or chatter.get("agent_b_id") == request.agent_id:
                other_id = chatter.get("agent_b_id") if chatter.get("agent_a_id") == request.agent_id else chatter.get("agent_a_id")
                other_name = agent_names.get(other_id, "a colleague")
                chatter_str += f"- Recently talked with {other_name} about: {chatter.get('topic', 'work')}\n"
                chatter_str += f"  Summary: {chatter.get('summary', '')}\n"
        if not chatter_str:
            chatter_str = "No recent conversations with colleagues."

        # Build tool context from recent trace events
        tool_context_str = ""
        tool_events = [t for t in trace if t.get("event_type") == "tool_event"]
        recent_tool_events = tool_events[-5:] if tool_events else []  # Last 5 tool events
        for event in recent_tool_events:
            content = event.get("content", {})
            tool_name = content.get("tool", "unknown tool")
            action = content.get("action", "used")
            data = content.get("data", {})
            data_summary = ", ".join(f"{k}: {v}" for k, v in list(data.items())[:3]) if data else ""
            tool_context_str += f"- Used {tool_name}: {action}"
            if data_summary:
                tool_context_str += f" ({data_summary})"
            tool_context_str += "\n"
        if not tool_context_str:
            tool_context_str = "No recent tool usage."

        # Handle multimodal message content
        message_text_raw = request.message_text
        image_url = None
        image_note = ""

        # Check if message_text is actually multimodal content (list of content blocks)
        if isinstance(message_text_raw, list):
            text_parts = []
            for content_block in message_text_raw:
                # Handle both dict and Pydantic model
                if hasattr(content_block, "type"):
                    block_type = content_block.type
                    block_text = content_block.text
                    block_image = content_block.image_url
                else:
                    block_type = content_block.get("type")
                    block_text = content_block.get("text", "")
                    block_image = content_block.get("image_url", "")

                if block_type == "text" and block_text:
                    text_parts.append(block_text)
                elif block_type == "image_url" and block_image:
                    image_url = block_image
            message_text = " ".join(text_parts)
            if image_url:
                image_note = "(The candidate has shared an image/diagram with this message)"
        else:
            message_text = message_text_raw

        # Build the prompt with memory context
        prompt = AGENT_PROMPT.format(
            agent_name=agent["name"],
            agent_role=agent["role"],
            company_name=env.get("company_name", "the company"),
            persona_prompt=agent.get("persona_prompt", ""),
            task_knowledge=task_knowledge_str,
            hidden_information=agent.get("hidden_information", ""),
            relationship_score=current_score,
            background_chatter=chatter_str,
            artifact_knowledge=agent.get("artifact_knowledge", "N/A"),
            memory_context=memory_context or "No relevant memories yet.",
            tool_context=tool_context_str,
            conversation_history=history_str or "No previous conversation.",
            message=message_text,
            image_note=image_note
        )

        # Call Kimi (with optional image for multimodal)
        try:
            if image_url:
                # Multimodal message with image
                reply = await call_kimi(
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": image_url}}
                            ]
                        }
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
            else:
                # Text-only message
                reply = await call_kimi(
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Agent response failed: {e}")

        # Check if agent wants to share an image and generate it
        reply, generated_image = await detect_and_generate_image(reply)

        # Record agent's reply as observation
        await record_agent_interaction(
            pool=pool,
            session_id=request.session_id,
            agent_id=request.agent_id,
            interaction_type="message_sent",
            content=f"I replied to the candidate: '{reply}'" + (" [with image]" if generated_image else ""),
            metadata={"relationship_score": current_score, "has_image": generated_image is not None}
        )

        # Calculate new relationship score
        delta = calculate_relationship_delta(request.message_text, reply)
        new_score = max(0.0, min(1.0, current_score + delta))

        # Check for escalation (difficult agents may escalate to their boss)
        escalated, escalation_reason = check_escalation(agent, current_score, new_score)

        if escalated:
            # Record escalation in trace
            escalation_trace = TraceEvent(
                event_id=str(uuid.uuid4()),
                session_id=request.session_id,
                timestamp=time.time(),
                elapsed_seconds=request.elapsed_seconds,
                event_type="agent_escalation",
                agent_id=request.agent_id,
                content={
                    "agent_name": agent["name"],
                    "reason": escalation_reason,
                    "final_score": new_score
                }
            )
            trace.append(escalation_trace.model_dump())

        # Update histories
        timestamp = time.time()
        history.append({
            "id": str(uuid.uuid4()),
            "sender": "candidate",
            "content": request.message_text,
            "timestamp": timestamp
        })
        history.append({
            "id": str(uuid.uuid4()),
            "sender": "agent",
            "agent_id": request.agent_id,
            "content": reply,
            "timestamp": timestamp + 0.1
        })
        agent_histories[request.agent_id] = history
        relationship_scores[request.agent_id] = new_score

        # Add trace event
        trace_event = TraceEvent(
            event_id=str(uuid.uuid4()),
            session_id=request.session_id,
            timestamp=timestamp,
            elapsed_seconds=request.elapsed_seconds,
            event_type="reply_sent",
            agent_id=request.agent_id,
            content={
                "candidate_message": request.message_text,
                "agent_reply": reply,
                "relationship_score": new_score
            }
        )
        trace.append(trace_event.model_dump())

        # Save to database (use correct table)
        await conn.execute(f"""
            UPDATE {table_name}
            SET agent_histories = $1, relationship_scores = $2, trace = trace || $3::jsonb
            WHERE session_id = $4
        """,
            json.dumps(agent_histories),
            json.dumps(relationship_scores),
            json.dumps([trace_event.model_dump()]),
            request.session_id
        )

    # Build response - if we have an image, make it multimodal
    if generated_image:
        reply_content = [
            MessageContent(type="text", text=reply),
            MessageContent(type="image_url", image_url=generated_image.url)
        ]
    else:
        reply_content = reply

    return MessageResponse(
        reply=reply_content,
        relationship_score=new_score,
        agent_id=request.agent_id,
        escalated=escalated,
        escalation_reason=escalation_reason,
        generated_image=generated_image
    )
