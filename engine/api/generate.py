"""POST /generate - Generate a new simulation environment."""
import json
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..schemas.input_schema import GenerateRequest
from ..schemas.env_schema import (
    EnvironmentResponse, Agent, Thread, Message, Task, StressInject,
    TaskKnowledge, TaskRequirement, AgentChatter, ArtifactContent, ArtifactSection,
    EndCondition
)
from ..engine.kimi_client import call_kimi
from ..db.pool import get_pool

router = APIRouter()

# Load prompt template
PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "generation.txt"
GENERATION_PROMPT = PROMPT_PATH.read_text()

# JSON schema for Kimi response
ENV_SCHEMA = {
    "type": "object",
    "properties": {
        "company_name": {"type": "string"},
        "company_description": {"type": "string"},
        "scenario_tension": {"type": "string"},
        "agents": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "agent_id": {"type": "string"},
                    "name": {"type": "string"},
                    "role": {"type": "string"},
                    "relationship_to_candidate": {"type": "string"},
                    "archetype": {"type": "string"},
                    "persona_prompt": {"type": "string"},
                    "hidden_information": {"type": "string"},
                    "task_knowledge": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "task_id": {"type": "string"},
                                "info_description": {"type": "string"},
                                "will_share_if": {"type": "string"}
                            }
                        }
                    },
                    "relationship_score_baseline": {"type": "number"},
                    "escalation_threshold": {"type": "number"},
                    "proactivity": {"type": "number", "description": "0-1, how likely to reach out unprompted"},
                    "current_concern": {"type": "string", "description": "What's on their mind right now"},
                    "will_initiate_about": {"type": "array", "items": {"type": "string"}, "description": "Topics they might bring up"}
                }
            }
        },
        "inbox": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "thread_id": {"type": "string"},
                    "from_agent_id": {"type": "string"},
                    "subject": {"type": "string"},
                    "preview": {"type": "string"},
                    "is_urgent": {"type": "boolean"},
                    "is_unread": {"type": "boolean"},
                    "messages": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "sender": {"type": "string"},
                                "agent_id": {"type": "string"},
                                "content": {"type": "string"},
                                "timestamp": {"type": "number"}
                            }
                        }
                    }
                }
            }
        },
        "tasks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string"},
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "urgency": {"type": "string", "enum": ["high", "medium", "low"]},
                    "completed": {"type": "boolean"},
                    "required_info": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "agent_id": {"type": "string"},
                                "info_needed": {"type": "string"},
                                "obtained": {"type": "boolean"}
                            }
                        }
                    },
                    "completion_type": {"type": "string", "enum": ["checkbox", "chat_validation", "artifact_edit", "deliverable"]},
                    "validating_agent_id": {"type": "string"},
                    "deliverable_prompt": {"type": "string"}
                }
            }
        },
        "artifact_content": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "type": {"type": "string"},
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "section_id": {"type": "string"},
                            "title": {"type": "string"},
                            "content": {"type": "string"},
                            "linked_task_id": {"type": "string"},
                            "editable": {"type": "boolean"},
                            "has_error": {"type": "boolean"},
                            "error_hint": {"type": "string"}
                        }
                    }
                }
            }
        },
        "inject_schedule": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "trigger_seconds": {"type": "integer"},
                    "agent_id": {"type": "string"},
                    "message": {"type": "string"},
                    "thread_id": {"type": "string"}
                }
            }
        },
        "background_chatter": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "agent_a_id": {"type": "string"},
                    "agent_b_id": {"type": "string"},
                    "topic": {"type": "string"},
                    "summary": {"type": "string"},
                    "timestamp": {"type": "number"}
                }
            }
        },
        "end_conditions": {
            "type": "array",
            "description": "Win and fail conditions that determine simulation outcome",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["win", "fail"]},
                    "trigger": {"type": "string", "enum": ["relationship_threshold", "task_completion", "time_limit", "agent_escalation"]},
                    "description": {"type": "string"},
                    "threshold": {"type": "number"},
                    "agent_id": {"type": "string"},
                    "task_ids": {"type": "array", "items": {"type": "string"}},
                    "trigger_seconds": {"type": "integer", "description": "For time_limit: when to check the condition"},
                    "required_task_id": {"type": "string", "description": "For time_limit: task that must be complete by trigger_seconds"}
                },
                "required": ["type", "trigger", "description"]
            }
        }
    }
}


@router.post("/generate", response_model=EnvironmentResponse)
async def generate_environment(request: GenerateRequest) -> EnvironmentResponse:
    """Generate a new simulation environment using Kimi 2.5."""

    # Build the prompt with full org context
    jd_text = request.job_description or "No job description provided - generate appropriate tasks based on the role."
    if request.job_description:
        jd_text = f"---\n{request.job_description}\n---"

    prompt = GENERATION_PROMPT.format(
        role=request.role,
        industry=request.industry,
        stage=request.stage,
        function=request.function,
        candidate_name=request.candidate_name,
        org_name=request.org_name or "TechCorp",
        company_size=request.company_size or "Not specified",
        company_description=request.company_description or "Not specified - create a fitting description",
        hiring_focus=request.hiring_focus or "Not specified",
        job_description=jd_text,
        schema=json.dumps(ENV_SCHEMA, indent=2)
    )

    # Call Kimi
    try:
        response_text = await call_kimi(
            messages=[
                {"role": "system", "content": "You are a simulation designer. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.8,
            max_tokens=8000
        )

        # Parse response
        env_data = json.loads(response_text)

        # Validate and build response
        # Force company_name to match the requested org_name if provided
        # Parse agents with task_knowledge
        agents = []
        # DiceBear avatar styles for variety
        avatar_styles = ["avataaars", "personas", "notionists", "lorelei", "adventurer"]
        for idx, a in enumerate(env_data.get("agents", [])):
            task_knowledge = [
                TaskKnowledge(**tk) for tk in a.get("task_knowledge", [])
            ]
            agent_name = a.get("name", "Unknown")
            # Generate deterministic avatar URL using agent name as seed
            style = avatar_styles[idx % len(avatar_styles)]
            avatar_url = f"https://api.dicebear.com/7.x/{style}/svg?seed={agent_name.replace(' ', '')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf"
            agents.append(Agent(
                agent_id=a.get("agent_id", str(uuid.uuid4())),
                name=agent_name,
                role=a.get("role", ""),
                relationship_to_candidate=a.get("relationship_to_candidate", "peer"),
                archetype=a.get("archetype", "standard"),
                persona_prompt=a.get("persona_prompt", ""),
                artifact_knowledge=a.get("artifact_knowledge"),
                hidden_information=a.get("hidden_information", ""),
                task_knowledge=task_knowledge,
                relationship_score_baseline=a.get("relationship_score_baseline", 0.5),
                escalation_threshold=a.get("escalation_threshold", 0.7),
                avatar_url=avatar_url,
                proactivity=a.get("proactivity", 0.3),
                current_concern=a.get("current_concern"),
                will_initiate_about=a.get("will_initiate_about"),
            ))

        # Parse tasks with required_info
        tasks = []
        for t in env_data.get("tasks", []):
            required_info = [
                TaskRequirement(**ri) for ri in t.get("required_info", [])
            ]
            tasks.append(Task(
                task_id=t.get("task_id", str(uuid.uuid4())),
                title=t.get("title", "Untitled Task"),
                description=t.get("description", ""),
                urgency=t.get("urgency", t.get("priority", "medium")),
                completed=t.get("completed", False),
                required_info=required_info,
                completion_type=t.get("completion_type", "checkbox"),
                validating_agent_id=t.get("validating_agent_id"),
                deliverable_prompt=t.get("deliverable_prompt")
            ))

        # Parse background chatter
        background_chatter = [
            AgentChatter(
                id=c.get("id", str(uuid.uuid4())),
                agent_a_id=c.get("agent_a_id", ""),
                agent_b_id=c.get("agent_b_id", ""),
                topic=c.get("topic", ""),
                summary=c.get("summary", ""),
                timestamp=c.get("timestamp", 0)
            ) for c in env_data.get("background_chatter", [])
        ]

        # Parse artifact content with sections
        artifact_data = env_data.get("artifact_content", {})
        artifact_sections = [
            ArtifactSection(
                section_id=s.get("section_id", str(uuid.uuid4())),
                title=s.get("title", "Untitled Section"),
                content=s.get("content", ""),
                linked_task_id=s.get("linked_task_id"),
                editable=s.get("editable", True),
                has_error=s.get("has_error", False),
                error_hint=s.get("error_hint")
            ) for s in artifact_data.get("sections", [])
        ]
        artifact_content = ArtifactContent(
            title=artifact_data.get("title", "Work Document"),
            type=artifact_data.get("type", "document"),
            sections=artifact_sections
        )

        # Parse end conditions (with defaults if not provided)
        end_conditions = []
        for ec in env_data.get("end_conditions", []):
            end_conditions.append(EndCondition(
                type=ec.get("type", "fail"),
                trigger=ec.get("trigger", "relationship_threshold"),
                description=ec.get("description", ""),
                threshold=ec.get("threshold"),
                agent_id=ec.get("agent_id"),
                task_ids=ec.get("task_ids"),
                trigger_seconds=ec.get("trigger_seconds"),
                required_task_id=ec.get("required_task_id"),
            ))

        # Add default end conditions if none provided
        if not end_conditions:
            # Default fail condition: any relationship drops below 15%
            end_conditions.append(EndCondition(
                type="fail",
                trigger="relationship_threshold",
                description="Your relationship with a team member deteriorated beyond repair.",
                threshold=0.15,
            ))
            # Default win condition: complete all tasks with good relationships
            end_conditions.append(EndCondition(
                type="win",
                trigger="task_completion",
                description="Excellent! You completed all tasks while maintaining positive team relationships.",
                task_ids=[t.task_id for t in tasks],
            ))

        env = EnvironmentResponse(
            company_name=request.org_name if request.org_name else env_data.get("company_name", "Unnamed Company"),
            company_description=env_data.get("company_description", ""),
            scenario_tension=env_data.get("scenario_tension", ""),
            agents=agents,
            inbox=[Thread(
                thread_id=t.get("thread_id", str(uuid.uuid4())),
                from_agent_id=t.get("from_agent_id", ""),
                subject=t.get("subject", ""),
                preview=t.get("preview", ""),
                is_urgent=t.get("is_urgent", False),
                is_unread=t.get("is_unread", True),
                messages=[Message(**m) for m in t.get("messages", [])]
            ) for t in env_data.get("inbox", [])],
            tasks=tasks,
            artifact_content=artifact_content,
            inject_schedule=[StressInject(**i) for i in env_data.get("inject_schedule", [])],
            background_chatter=background_chatter,
            end_conditions=end_conditions
        )

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Kimi response: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")

    # Store in database (B2B sessions only use generate)
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE b2b_sessions
            SET env = $1, artifact_html = $2, status = 'pending'
            WHERE session_id = $3
        """, json.dumps(env.model_dump()), None, request.session_id)

    return env
