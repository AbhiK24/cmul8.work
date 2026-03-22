"""Org profile endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..db.pool import get_pool
from ..auth.jwt import TokenData
from .auth import get_current_user

router = APIRouter(prefix="/profile")


class OrgProfile(BaseModel):
    """Org profile data."""
    company_name: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    hiring_focus: Optional[str] = None
    profile_completed: bool = False


class OrgProfileResponse(OrgProfile):
    """Org profile response with email."""
    email: str


class UpdateProfileRequest(BaseModel):
    """Update profile request."""
    company_name: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    hiring_focus: Optional[str] = None


@router.get("", response_model=OrgProfileResponse)
async def get_profile(current_user: TokenData = Depends(get_current_user)):
    """Get current org profile."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT email, company_name, industry, stage, company_size,
                   description, website, hiring_focus, profile_completed
            FROM employers
            WHERE id = $1
        """, current_user.employer_id)

        return OrgProfileResponse(
            email=row["email"],
            company_name=row["company_name"],
            industry=row["industry"],
            stage=row["stage"],
            company_size=row["company_size"],
            description=row["description"],
            website=row["website"],
            hiring_focus=row["hiring_focus"],
            profile_completed=row["profile_completed"] or False
        )


@router.put("", response_model=OrgProfileResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Update org profile."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Check if profile is complete (has at least company_name and industry)
        profile_completed = bool(request.company_name and request.industry)

        row = await conn.fetchrow("""
            UPDATE employers
            SET company_name = COALESCE($2, company_name),
                industry = COALESCE($3, industry),
                stage = COALESCE($4, stage),
                company_size = COALESCE($5, company_size),
                description = COALESCE($6, description),
                website = COALESCE($7, website),
                hiring_focus = COALESCE($8, hiring_focus),
                profile_completed = $9,
                updated_at = NOW()
            WHERE id = $1
            RETURNING email, company_name, industry, stage, company_size,
                      description, website, hiring_focus, profile_completed
        """,
            current_user.employer_id,
            request.company_name,
            request.industry,
            request.stage,
            request.company_size,
            request.description,
            request.website,
            request.hiring_focus,
            profile_completed
        )

        return OrgProfileResponse(
            email=row["email"],
            company_name=row["company_name"],
            industry=row["industry"],
            stage=row["stage"],
            company_size=row["company_size"],
            description=row["description"],
            website=row["website"],
            hiring_focus=row["hiring_focus"],
            profile_completed=row["profile_completed"] or False
        )
