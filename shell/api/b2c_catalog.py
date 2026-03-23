"""B2C Catalog API - Browse and start practice scenarios."""
import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from ..db.pool import get_pool
from ..auth.jwt import decode_access_token, TokenData
from .b2c_auth import get_current_b2c_user


def parse_json_field(value, default=None):
    """Parse a JSON field that might be a string or already parsed."""
    if value is None:
        return default
    if isinstance(value, (list, dict)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return default
    return default


router = APIRouter(prefix="/b2c/catalog", tags=["b2c-catalog"])


class ScenarioSummary(BaseModel):
    """Summary of a practice scenario."""
    template_id: str
    slug: str
    title: str
    skill_category: str
    description: str
    duration_minutes: int
    difficulty: str
    learning_objectives: List[str]
    user_completed_count: int = 0
    user_best_score: Optional[int] = None


class ScenarioDetail(BaseModel):
    """Full details of a practice scenario."""
    template_id: str
    slug: str
    title: str
    skill_category: str
    description: str
    duration_minutes: int
    difficulty: str
    learning_objectives: List[str]
    company_context: dict
    agents: List[dict]
    tasks: List[dict]
    framework_name: Optional[str]
    framework_reference: Optional[dict]
    user_completed_count: int = 0
    user_best_score: Optional[int] = None


class SkillCategory(BaseModel):
    """A skill category with its scenarios."""
    id: str
    name: str
    description: str
    scenarios: List[ScenarioSummary]


class UserSession(BaseModel):
    """A user's practice session."""
    session_id: str
    template_slug: str
    template_title: str
    skill_category: str
    status: str
    score: Optional[int]  # overall_score from DB
    created_at: str
    completed_at: Optional[str]
    candidate_token: Optional[str] = None  # For continuing sessions


class StartSessionResponse(BaseModel):
    """Response when starting a practice session."""
    session_id: str
    session_url: str


# Skill category metadata
SKILL_CATEGORIES = {
    "feedback": {
        "name": "Difficult Conversations",
        "description": "Giving feedback, saying no, managing up"
    },
    "prioritization": {
        "name": "Pressure Management",
        "description": "Competing deadlines, angry stakeholders"
    },
    "communication": {
        "name": "Communication",
        "description": "Navigate high-stakes emotional discussions"
    },
    "assertiveness": {
        "name": "Assertiveness",
        "description": "Decline requests while maintaining relationships"
    },
    "interview": {
        "name": "Interview Prep",
        "description": "PM, consulting, leadership interviews"
    },
    "stakeholder": {
        "name": "Stakeholder Management",
        "description": "Navigate competing interests, build alignment"
    },
    "leadership": {
        "name": "Leadership Moments",
        "description": "First-time manager, team conflict, performance"
    },
    "negotiation": {
        "name": "Negotiation",
        "description": "Salary talks, vendor deals, resource allocation"
    }
}


@router.get("/scenarios", response_model=List[ScenarioSummary])
async def list_scenarios(current_user: TokenData = Depends(get_current_b2c_user)):
    """List all available practice scenarios for B2C users."""
    user_id = current_user.user_id
    pool = await get_pool()

    async with pool.acquire() as conn:
        # B2C sees 'both' and 'b2c_only' templates
        rows = await conn.fetch("""
            SELECT
                template_id, slug, title, skill_category, description,
                duration_minutes, difficulty, learning_objectives
            FROM training_templates
            WHERE COALESCE(availability, 'both') IN ('both', 'b2c_only')
            ORDER BY skill_category, difficulty
        """)

        # Get user's completion stats
        user_stats = await conn.fetch("""
            SELECT template_slug, COUNT(*) as completed, MAX(overall_score) as best_score
            FROM b2c_sessions
            WHERE user_id = $1 AND status = 'complete'
            GROUP BY template_slug
        """, user_id)

        stats_map = {
            row["template_slug"]: {
                "completed": row["completed"],
                "best_score": row["best_score"]
            }
            for row in user_stats
        }

        return [
            ScenarioSummary(
                template_id=str(row["template_id"]),
                slug=row["slug"],
                title=row["title"],
                skill_category=row["skill_category"],
                description=row["description"] or "",
                duration_minutes=row["duration_minutes"],
                difficulty=row["difficulty"],
                learning_objectives=parse_json_field(row["learning_objectives"], []),
                user_completed_count=stats_map.get(row["slug"], {}).get("completed", 0),
                user_best_score=stats_map.get(row["slug"], {}).get("best_score")
            )
            for row in rows
        ]


@router.get("/scenarios/{slug}", response_model=ScenarioDetail)
async def get_scenario(slug: str, current_user: TokenData = Depends(get_current_b2c_user)):
    """Get detailed information about a practice scenario."""
    user_id = current_user.user_id
    pool = await get_pool()

    async with pool.acquire() as conn:
        # B2C can access 'both' and 'b2c_only' templates
        row = await conn.fetchrow("""
            SELECT
                template_id, slug, title, skill_category, description,
                duration_minutes, difficulty, learning_objectives,
                company_context, agents, tasks, framework_name, framework_reference
            FROM training_templates
            WHERE slug = $1 AND COALESCE(availability, 'both') IN ('both', 'b2c_only')
        """, slug)

        if not row:
            raise HTTPException(status_code=404, detail="Scenario not found")

        # Get user's stats for this scenario
        user_stat = await conn.fetchrow("""
            SELECT COUNT(*) as completed, MAX(overall_score) as best_score
            FROM b2c_sessions
            WHERE user_id = $1 AND template_slug = $2 AND status = 'complete'
        """, user_id, slug)

        return ScenarioDetail(
            template_id=str(row["template_id"]),
            slug=row["slug"],
            title=row["title"],
            skill_category=row["skill_category"],
            description=row["description"] or "",
            duration_minutes=row["duration_minutes"],
            difficulty=row["difficulty"],
            learning_objectives=parse_json_field(row["learning_objectives"], []),
            company_context=parse_json_field(row["company_context"], {}),
            agents=parse_json_field(row["agents"], []),
            tasks=parse_json_field(row["tasks"], []),
            framework_name=row["framework_name"],
            framework_reference=parse_json_field(row["framework_reference"]),
            user_completed_count=user_stat["completed"] if user_stat else 0,
            user_best_score=user_stat["best_score"] if user_stat else None
        )


@router.get("/categories", response_model=List[SkillCategory])
async def list_categories(current_user: TokenData = Depends(get_current_b2c_user)):
    """List all skill categories with their scenarios."""
    user_id = current_user.user_id
    pool = await get_pool()

    async with pool.acquire() as conn:
        # B2C sees 'both' and 'b2c_only' templates
        rows = await conn.fetch("""
            SELECT
                template_id, slug, title, skill_category, description,
                duration_minutes, difficulty, learning_objectives
            FROM training_templates
            WHERE COALESCE(availability, 'both') IN ('both', 'b2c_only')
            ORDER BY skill_category, difficulty
        """)

        # Get user's completion stats
        user_stats = await conn.fetch("""
            SELECT template_slug, COUNT(*) as completed, MAX(overall_score) as best_score
            FROM b2c_sessions
            WHERE user_id = $1 AND status = 'complete'
            GROUP BY template_slug
        """, user_id)

        stats_map = {
            row["template_slug"]: {
                "completed": row["completed"],
                "best_score": row["best_score"]
            }
            for row in user_stats
        }

        # Group by category
        categories_map = {}
        for row in rows:
            cat = row["skill_category"]
            if cat not in categories_map:
                cat_info = SKILL_CATEGORIES.get(cat, {"name": cat.title(), "description": ""})
                categories_map[cat] = {
                    "id": cat,
                    "name": cat_info["name"],
                    "description": cat_info["description"],
                    "scenarios": []
                }

            categories_map[cat]["scenarios"].append(
                ScenarioSummary(
                    template_id=str(row["template_id"]),
                    slug=row["slug"],
                    title=row["title"],
                    skill_category=row["skill_category"],
                    description=row["description"] or "",
                    duration_minutes=row["duration_minutes"],
                    difficulty=row["difficulty"],
                    learning_objectives=parse_json_field(row["learning_objectives"], []),
                    user_completed_count=stats_map.get(row["slug"], {}).get("completed", 0),
                    user_best_score=stats_map.get(row["slug"], {}).get("best_score")
                )
            )

        return [SkillCategory(**cat) for cat in categories_map.values()]


@router.post("/sessions/{slug}/start", response_model=StartSessionResponse)
async def start_session(slug: str, current_user: TokenData = Depends(get_current_b2c_user)):
    """Start a new practice session for a scenario."""
    user_id = current_user.user_id
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Get template - B2C can only access 'both' and 'b2c_only' templates
        template = await conn.fetchrow("""
            SELECT template_id, slug, title, skill_category, company_context,
                   agents, tasks, inbox, framework_name, framework_reference, coaching_prompts
            FROM training_templates
            WHERE slug = $1 AND COALESCE(availability, 'both') IN ('both', 'b2c_only')
        """, slug)

        if not template:
            raise HTTPException(status_code=404, detail="Scenario not found")

        # Create user_session
        session_id = uuid.uuid4()
        candidate_token = uuid.uuid4()

        # Build env from template
        env = {
            "agents": parse_json_field(template["agents"], []),
            "tasks": parse_json_field(template["tasks"], []),
            "inbox": parse_json_field(template["inbox"], []),
            "framework_name": template["framework_name"],
            "framework_reference": parse_json_field(template["framework_reference"]),
            "coaching_prompts": parse_json_field(template["coaching_prompts"], {})
        }

        org_params = parse_json_field(template["company_context"], {})

        await conn.execute("""
            INSERT INTO b2c_sessions (
                session_id, user_id, template_slug, template_title,
                skill_category, env, org_params, candidate_token, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ready')
        """,
            session_id,
            user_id,
            template["slug"],
            template["title"],
            template["skill_category"],
            json.dumps(env),
            json.dumps(org_params),
            str(candidate_token)
        )

        # Return session URL that uses the same simulation UI as B2B
        # Reuses existing /sim/:sessionId/:token route
        session_url = f"/sim/{session_id}/{candidate_token}"

        return StartSessionResponse(
            session_id=str(session_id),
            session_url=session_url
        )


@router.get("/sessions", response_model=List[UserSession])
async def list_b2c_sessions(current_user: TokenData = Depends(get_current_b2c_user)):
    """List all practice sessions for the current user."""
    user_id = current_user.user_id
    pool = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT session_id, template_slug, template_title, skill_category,
                   status, overall_score, created_at, completed_at, candidate_token
            FROM b2c_sessions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        """, user_id)

        return [
            UserSession(
                session_id=str(row["session_id"]),
                template_slug=row["template_slug"],
                template_title=row["template_title"] or "",
                skill_category=row["skill_category"] or "",
                status=row["status"],
                score=row["overall_score"],
                created_at=row["created_at"].isoformat() if row["created_at"] else "",
                completed_at=row["completed_at"].isoformat() if row["completed_at"] else None,
                candidate_token=row["candidate_token"]
            )
            for row in rows
        ]


@router.get("/sessions/{session_id}", response_model=UserSession)
async def get_user_session(session_id: str, current_user: TokenData = Depends(get_current_b2c_user)):
    """Get details of a specific practice session."""
    user_id = current_user.user_id
    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT session_id, template_slug, template_title, skill_category,
                   status, overall_score, created_at, completed_at, candidate_token
            FROM b2c_sessions
            WHERE session_id = $1 AND user_id = $2
        """, uuid.UUID(session_id), user_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        return UserSession(
            session_id=str(row["session_id"]),
            template_slug=row["template_slug"],
            template_title=row["template_title"] or "",
            skill_category=row["skill_category"] or "",
            status=row["status"],
            score=row["overall_score"],
            created_at=row["created_at"].isoformat() if row["created_at"] else "",
            completed_at=row["completed_at"].isoformat() if row["completed_at"] else None,
            candidate_token=row["candidate_token"]
        )
