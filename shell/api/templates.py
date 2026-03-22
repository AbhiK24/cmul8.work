"""Training templates API endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from ..db.pool import get_pool

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


@router.get("", response_model=List[TemplateListItem])
async def list_templates():
    """List all available training templates."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                template_id, slug, title, skill_category, description,
                duration_minutes, difficulty, learning_objectives
            FROM training_templates
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
                learning_objectives=row["learning_objectives"] or []
            )
            for row in rows
        ]


@router.get("/{slug}", response_model=TemplateDetail)
async def get_template(slug: str):
    """Get detailed information about a training template."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT
                template_id, slug, title, skill_category, description,
                duration_minutes, difficulty, learning_objectives,
                company_context, agents, tasks, framework_name, framework_reference
            FROM training_templates
            WHERE slug = $1
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
            learning_objectives=row["learning_objectives"] or [],
            company_context=row["company_context"] or {},
            agents=row["agents"] or [],
            tasks=row["tasks"] or [],
            framework_name=row["framework_name"],
            framework_reference=row["framework_reference"]
        )
