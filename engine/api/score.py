"""POST /score - Score a completed session."""
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..schemas.input_schema import ScoreRequest
from ..engine.kimi_client import call_kimi
from ..db.pool import get_pool

router = APIRouter()

# Load prompt templates
PROMPTS_PATH = Path(__file__).parent.parent / "prompts"
ASSESSMENT_PROMPT = (PROMPTS_PATH / "scoring.txt").read_text()
TRAINING_PROMPT = (PROMPTS_PATH / "training_scoring.txt").read_text()


async def get_session_for_scoring(conn, session_id: str):
    """Find session in either B2B or B2C tables.

    Returns: (row, table_name, mode, template_data) or (None, None, None, None)
    """
    # Try B2B sessions first
    row = await conn.fetchrow("""
        SELECT
            s.env, s.trace, s.artifact_trace, s.debrief, s.org_params,
            s.relationship_scores, s.started_at, s.completed_at, s.mode,
            s.training_template_id
        FROM b2b_sessions s
        WHERE s.session_id = $1
    """, session_id)

    if row:
        mode = row["mode"] or "assess"
        template_data = None

        # If training mode, fetch template data
        if mode == "train" and row["training_template_id"]:
            template_row = await conn.fetchrow("""
                SELECT framework_name, framework_reference, learning_objectives,
                       skill_category, title, coaching_prompts
                FROM training_templates WHERE id = $1
            """, row["training_template_id"])
            if template_row:
                template_data = dict(template_row)

        return row, "b2b_sessions", mode, template_data

    # Try B2C sessions (always training mode)
    row = await conn.fetchrow("""
        SELECT
            s.env, s.trace, s.debrief, s.org_params, s.relationship_scores,
            s.started_at, s.completed_at, s.training_template_id, s.template_slug
        FROM b2c_sessions s
        WHERE s.session_id = $1
    """, session_id)

    if row:
        template_data = None

        # Fetch template data by ID or slug
        if row["training_template_id"]:
            template_row = await conn.fetchrow("""
                SELECT framework_name, framework_reference, learning_objectives,
                       skill_category, title, coaching_prompts
                FROM training_templates WHERE id = $1
            """, row["training_template_id"])
        elif row["template_slug"]:
            template_row = await conn.fetchrow("""
                SELECT framework_name, framework_reference, learning_objectives,
                       skill_category, title, coaching_prompts
                FROM training_templates WHERE slug = $1
            """, row["template_slug"])
        else:
            template_row = None

        if template_row:
            template_data = dict(template_row)

        return row, "b2c_sessions", "train", template_data

    return None, None, None, None


def build_common_context(row, env, relationship_scores):
    """Build common context data used by both prompts."""
    # Calculate duration
    started_at = row["started_at"]
    completed_at = row["completed_at"]
    duration_seconds = 0
    if started_at and completed_at:
        duration_seconds = (completed_at - started_at).total_seconds()

    # Build agents info string
    agents = env.get("agents", [])
    agents_info_lines = []
    for agent in agents:
        agents_info_lines.append(
            f"- {agent.get('name')} ({agent.get('role')}): "
            f"Relationship to candidate: {agent.get('relationship_to_candidate', 'unknown')}, "
            f"Archetype: {agent.get('archetype', 'standard')}"
        )
    agents_info = "\n".join(agents_info_lines) or "No agents."

    # Build relationship scores string
    scores_lines = []
    for agent in agents:
        agent_id = agent.get("agent_id")
        final_score = relationship_scores.get(agent_id, 0.5)
        change = final_score - 0.5
        change_str = f"+{change:.2f}" if change >= 0 else f"{change:.2f}"
        scores_lines.append(
            f"- {agent.get('name')}: {final_score:.2f} ({change_str} from start)"
        )
    relationship_scores_str = "\n".join(scores_lines) or "No interactions."

    return {
        "duration_seconds": duration_seconds,
        "agents_info": agents_info,
        "relationship_scores_str": relationship_scores_str,
        "scenario_description": f"{env.get('company_name', '')}: {env.get('scenario_tension', '')}"
    }


async def score_assessment(row, env, org_params, trace_str, debrief_str, common_ctx):
    """Score an assessment session using behavioral traits."""
    integrity_str = "No integrity data collected."

    prompt = ASSESSMENT_PROMPT.format(
        role=org_params.get("role", "Unknown"),
        industry=org_params.get("industry", "Unknown"),
        stage=org_params.get("stage", "Unknown"),
        function=org_params.get("function", "Unknown"),
        duration_seconds=common_ctx["duration_seconds"],
        scenario_description=common_ctx["scenario_description"],
        agents_info=common_ctx["agents_info"],
        relationship_scores=common_ctx["relationship_scores_str"],
        trace=trace_str[:15000],
        debrief=debrief_str or "No debrief provided.",
        integrity_data=integrity_str
    )

    response_text = await call_kimi(
        messages=[
            {"role": "system", "content": "You are a behavioral assessment expert. Respond with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.5,
        max_tokens=4000
    )

    report = json.loads(response_text)

    # Calculate overall score from trait scores
    trait_scores = report.get("trait_scores", {})
    scores = []
    for trait, data in trait_scores.items():
        if isinstance(data, dict) and "score" in data:
            scores.append(data["score"])
    overall_score = int((sum(scores) / len(scores)) * 10) if scores else None

    return report, overall_score


async def score_training(row, env, template_data, trace_str, debrief_str, common_ctx):
    """Score a training session using framework alignment."""
    # Parse framework data
    framework_name = template_data.get("framework_name", "Skills Framework") if template_data else "Skills Framework"

    framework_ref = template_data.get("framework_reference") if template_data else None
    if isinstance(framework_ref, str):
        framework_ref = json.loads(framework_ref)

    learning_objectives = template_data.get("learning_objectives") if template_data else []
    if isinstance(learning_objectives, str):
        learning_objectives = json.loads(learning_objectives)

    skill_category = template_data.get("skill_category", "general") if template_data else "general"
    training_title = template_data.get("title", "Training Session") if template_data else "Training Session"

    # Build framework steps string
    framework_steps = ""
    if framework_ref and "steps" in framework_ref:
        for step in framework_ref["steps"]:
            framework_steps += f"- **{step.get('letter', '?')}** - {step.get('name', 'Step')}: {step.get('description', '')}\n"
            if step.get("example"):
                framework_steps += f"  Example: {step['example']}\n"

    framework_pro_tip = framework_ref.get("pro_tip", "") if framework_ref else ""

    # Build learning objectives string
    learning_objectives_str = "\n".join([f"- {obj}" for obj in learning_objectives]) if learning_objectives else "- Practice the framework effectively"

    prompt = TRAINING_PROMPT.format(
        skill_category=skill_category,
        training_title=training_title,
        duration_seconds=common_ctx["duration_seconds"],
        framework_name=framework_name,
        framework_steps=framework_steps or "No specific steps defined.",
        framework_pro_tip=framework_pro_tip or "Focus on clear, structured communication.",
        learning_objectives=learning_objectives_str,
        scenario_description=common_ctx["scenario_description"],
        agents_info=common_ctx["agents_info"],
        relationship_scores=common_ctx["relationship_scores_str"],
        trace=trace_str[:15000],
        debrief=debrief_str or "No debrief provided."
    )

    response_text = await call_kimi(
        messages=[
            {"role": "system", "content": "You are a skills coach providing training feedback. Respond with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.5,
        max_tokens=4000
    )

    report = json.loads(response_text)

    # Ensure framework_name is in report
    if "framework_name" not in report:
        report["framework_name"] = framework_name

    # Get overall score (already in 0-100 scale for training)
    overall_score = report.get("overall_score")
    if overall_score is None:
        # Calculate from framework_scores if not provided
        framework_scores = report.get("framework_scores", [])
        if framework_scores:
            scores = [s.get("score", 0) for s in framework_scores if isinstance(s.get("score"), (int, float))]
            overall_score = int(sum(scores) / len(scores)) if scores else 50

    return report, overall_score


@router.post("/score")
async def score_session(request: ScoreRequest):
    """Score a completed session using appropriate method based on mode."""

    pool = await get_pool()

    async with pool.acquire() as conn:
        # Get session data with mode and template info
        row, table_name, mode, template_data = await get_session_for_scoring(conn, request.session_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        env = json.loads(row["env"]) if row["env"] else {}
        trace = json.loads(row["trace"]) if row["trace"] else []
        debrief = json.loads(row["debrief"]) if row["debrief"] else {}
        org_params = json.loads(row["org_params"]) if row["org_params"] else {}
        relationship_scores = json.loads(row["relationship_scores"]) if row["relationship_scores"] else {}

        # Build debrief string
        debrief_str = ""
        for q, a in debrief.items():
            debrief_str += f"Q: {q}\nA: {a}\n\n"

        # Build trace string
        trace_str = json.dumps(trace, indent=2)

        # Build common context
        common_ctx = build_common_context(row, env, relationship_scores)

        # Score based on mode
        try:
            if mode == "train":
                report, overall_score = await score_training(
                    row, env, template_data, trace_str, debrief_str, common_ctx
                )
            else:
                report, overall_score = await score_assessment(
                    row, env, org_params, trace_str, debrief_str, common_ctx
                )

        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse scoring response: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")

        # Save report to database
        if table_name == "b2c_sessions":
            await conn.execute("""
                UPDATE b2c_sessions
                SET report = $1, status = 'complete', completed_at = NOW(), overall_score = $3
                WHERE session_id = $2
            """, json.dumps(report), request.session_id, overall_score)
        else:
            # B2B sessions - save framework_score for training mode
            if mode == "train":
                await conn.execute("""
                    UPDATE b2b_sessions
                    SET report = $1, status = 'complete', completed_at = NOW(), framework_score = $3
                    WHERE session_id = $2
                """, json.dumps(report), request.session_id, float(overall_score) if overall_score else None)
            else:
                await conn.execute("""
                    UPDATE b2b_sessions
                    SET report = $1, status = 'complete', completed_at = NOW()
                    WHERE session_id = $2
                """, json.dumps(report), request.session_id)

    return report
