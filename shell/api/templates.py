"""Training templates API endpoints."""
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from ..db.pool import get_pool


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

router = APIRouter(prefix="/templates", tags=["templates"])


class FrameworkStep(BaseModel):
    letter: str
    name: str
    description: str
    example: str


class FrameworkReference(BaseModel):
    title: str
    steps: List[FrameworkStep]
    pro_tip: Optional[str] = None


class AgentSummary(BaseModel):
    name: str
    role: str
    relationship: str
    description: str
    avatar_url: Optional[str] = None


class TemplateListItem(BaseModel):
    template_id: str
    slug: str
    title: str
    skill_category: str
    description: str
    duration_minutes: int
    difficulty: str
    learning_objectives: List[str]
    availability: str = "both"  # 'both', 'b2b_only', 'b2c_only'


class TemplateDetail(BaseModel):
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
    availability: str = "both"


@router.get("", response_model=List[TemplateListItem])
async def list_templates():
    """List all available training templates for B2B users."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        # B2B sees 'both' and 'b2b_only' templates
        rows = await conn.fetch("""
            SELECT
                template_id, slug, title, skill_category, description,
                duration_minutes, difficulty, learning_objectives,
                COALESCE(availability, 'both') as availability
            FROM training_templates
            WHERE COALESCE(availability, 'both') IN ('both', 'b2b_only')
            ORDER BY created_at ASC
        """)

        return [
            TemplateListItem(
                template_id=str(row["template_id"]),
                slug=row["slug"],
                title=row["title"],
                skill_category=row["skill_category"],
                description=row["description"] or "",
                duration_minutes=row["duration_minutes"],
                difficulty=row["difficulty"],
                learning_objectives=parse_json_field(row["learning_objectives"], []),
                availability=row["availability"]
            )
            for row in rows
        ]


@router.get("/{slug}", response_model=TemplateDetail)
async def get_template(slug: str):
    """Get detailed information about a training template (B2B access)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        # B2B can access 'both' and 'b2b_only' templates
        row = await conn.fetchrow("""
            SELECT
                template_id, slug, title, skill_category, description,
                duration_minutes, difficulty, learning_objectives,
                company_context, agents, tasks, framework_name, framework_reference,
                COALESCE(availability, 'both') as availability
            FROM training_templates
            WHERE slug = $1 AND COALESCE(availability, 'both') IN ('both', 'b2b_only')
        """, slug)

        if not row:
            raise HTTPException(status_code=404, detail="Template not found")

        return TemplateDetail(
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
            availability=row["availability"]
        )
