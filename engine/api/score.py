"""POST /score - Score a completed session."""
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..schemas.input_schema import ScoreRequest
from ..engine.kimi_client import call_kimi
from ..db.pool import get_pool

router = APIRouter()

# Load prompt template
PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "scoring.txt"
SCORING_PROMPT = PROMPT_PATH.read_text()


async def get_session_for_scoring(conn, session_id: str):
    """Find session in either B2B or B2C tables.

    Returns: (row, table_name) or (None, None)
    """
    row = await conn.fetchrow("""
        SELECT env, trace, artifact_trace, debrief, org_params, relationship_scores, started_at, completed_at
        FROM b2b_sessions WHERE session_id = $1
    """, session_id)
    if row:
        return row, "b2b_sessions"

    row = await conn.fetchrow("""
        SELECT env, trace, debrief, org_params, relationship_scores, started_at, completed_at
        FROM b2c_sessions WHERE session_id = $1
    """, session_id)
    if row:
        return row, "b2c_sessions"

    return None, None


@router.post("/score")
async def score_session(request: ScoreRequest):
    """Score a completed session using Kimi 2.5."""

    pool = await get_pool()

    async with pool.acquire() as conn:
        # Get session data
        row, table_name = await get_session_for_scoring(conn, request.session_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        env = json.loads(row["env"]) if row["env"] else {}
        trace = json.loads(row["trace"]) if row["trace"] else []
        debrief = json.loads(row["debrief"]) if row["debrief"] else {}
        org_params = json.loads(row["org_params"]) if row["org_params"] else {}
        relationship_scores = json.loads(row["relationship_scores"]) if row["relationship_scores"] else {}
        integrity_data = {}  # Not yet implemented

        # Calculate duration
        started_at = row["started_at"]
        completed_at = row["completed_at"]
        duration_seconds = 0
        if started_at and completed_at:
            duration_seconds = (completed_at - started_at).total_seconds()

        # Build debrief string
        debrief_str = ""
        for q, a in debrief.items():
            debrief_str += f"Q: {q}\nA: {a}\n\n"

        # Build trace string
        trace_str = json.dumps(trace, indent=2)

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

        # Build integrity data string
        if integrity_data:
            integrity_str = (
                f"- Tab switches: {integrity_data.get('tabSwitches', 0)}\n"
                f"- Total blur time: {integrity_data.get('totalBlurTimeSeconds', 0)} seconds\n"
                f"- Paste count: {integrity_data.get('pasteCount', 0)}\n"
                f"- Rapid responses: {integrity_data.get('rapidResponses', 0)}\n"
                f"- Overall risk score: {integrity_data.get('riskScore', 0)}/100"
            )
        else:
            integrity_str = "No integrity data collected."

        # Build the prompt
        prompt = SCORING_PROMPT.format(
            role=org_params.get("role", "Unknown"),
            industry=org_params.get("industry", "Unknown"),
            stage=org_params.get("stage", "Unknown"),
            function=org_params.get("function", "Unknown"),
            duration_seconds=duration_seconds,
            scenario_description=f"{env.get('company_name', '')}: {env.get('scenario_tension', '')}",
            agents_info=agents_info,
            relationship_scores=relationship_scores_str,
            trace=trace_str[:15000],  # Truncate if too long
            debrief=debrief_str or "No debrief provided.",
            integrity_data=integrity_str
        )

        # Call Kimi
        try:
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

        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse scoring response: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")

        # Save report to database
        await conn.execute(f"""
            UPDATE {table_name}
            SET report = $1, status = 'complete', completed_at = NOW()
            WHERE session_id = $2
        """, json.dumps(report), request.session_id)

    return report
