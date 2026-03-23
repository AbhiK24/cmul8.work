"""Org profile endpoints."""
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..db.pool import get_pool
from ..auth.jwt import TokenData
from .auth import get_current_user

router = APIRouter(prefix="/profile")


class OrgProfile(BaseModel):
    """Org profile data."""
    name: str
    slug: str
    industry: Optional[str] = None
    stage: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    hiring_focus: Optional[str] = None
    custom_roles: List[str] = []
    profile_completed: bool = False


class OrgProfileResponse(OrgProfile):
    """Org profile response with org_id."""
    org_id: str
    member_count: int = 0


class UpdateProfileRequest(BaseModel):
    """Update profile request."""
    name: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    hiring_focus: Optional[str] = None


class AddCustomRoleRequest(BaseModel):
    """Request to add a custom role."""
    role: str


@router.get("", response_model=OrgProfileResponse)
async def get_profile(current_user: TokenData = Depends(get_current_user)):
    """Get current org profile."""
    if not current_user.org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id, name, slug, industry, stage, company_size,
                   description, website, hiring_focus, custom_roles
            FROM organizations
            WHERE id = $1
        """, current_user.org_id)

        if not row:
            raise HTTPException(status_code=404, detail="Organization not found")

        member_count = await conn.fetchval("""
            SELECT COUNT(*) FROM org_members
            WHERE org_id = $1 AND status = 'active'
        """, current_user.org_id)

        custom_roles = json.loads(row["custom_roles"]) if row["custom_roles"] else []

        # Profile is complete if name and industry are set
        profile_completed = bool(row["name"] and row["industry"])

        return OrgProfileResponse(
            org_id=str(row["id"]),
            name=row["name"],
            slug=row["slug"],
            industry=row["industry"],
            stage=row["stage"],
            company_size=row["company_size"],
            description=row["description"],
            website=row["website"],
            hiring_focus=row["hiring_focus"],
            custom_roles=custom_roles,
            profile_completed=profile_completed,
            member_count=member_count
        )


@router.put("", response_model=OrgProfileResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Update org profile."""
    if not current_user.org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE organizations
            SET name = COALESCE($2, name),
                industry = COALESCE($3, industry),
                stage = COALESCE($4, stage),
                company_size = COALESCE($5, company_size),
                description = COALESCE($6, description),
                website = COALESCE($7, website),
                hiring_focus = COALESCE($8, hiring_focus),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, slug, industry, stage, company_size,
                      description, website, hiring_focus, custom_roles
        """,
            current_user.org_id,
            request.name,
            request.industry,
            request.stage,
            request.company_size,
            request.description,
            request.website,
            request.hiring_focus
        )

        if not row:
            raise HTTPException(status_code=404, detail="Organization not found")

        member_count = await conn.fetchval("""
            SELECT COUNT(*) FROM org_members
            WHERE org_id = $1 AND status = 'active'
        """, current_user.org_id)

        custom_roles = json.loads(row["custom_roles"]) if row.get("custom_roles") else []

        profile_completed = bool(row["name"] and row["industry"])

        return OrgProfileResponse(
            org_id=str(row["id"]),
            name=row["name"],
            slug=row["slug"],
            industry=row["industry"],
            stage=row["stage"],
            company_size=row["company_size"],
            description=row["description"],
            website=row["website"],
            hiring_focus=row["hiring_focus"],
            custom_roles=custom_roles,
            profile_completed=profile_completed,
            member_count=member_count
        )


@router.post("/custom-roles", response_model=OrgProfileResponse)
async def add_custom_role(
    request: AddCustomRoleRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Add a custom role to the org profile."""
    if not current_user.org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    pool = await get_pool()

    async with pool.acquire() as conn:
        # Get current custom roles
        row = await conn.fetchrow("""
            SELECT custom_roles FROM organizations WHERE id = $1
        """, current_user.org_id)

        if not row:
            raise HTTPException(status_code=404, detail="Organization not found")

        current_roles = json.loads(row["custom_roles"]) if row["custom_roles"] else []

        # Add new role if not already present
        role = request.role.strip()
        if role and role not in current_roles:
            current_roles.append(role)

            await conn.execute("""
                UPDATE organizations SET custom_roles = $2 WHERE id = $1
            """, current_user.org_id, json.dumps(current_roles))

        # Return updated profile
        row = await conn.fetchrow("""
            SELECT id, name, slug, industry, stage, company_size,
                   description, website, hiring_focus, custom_roles
            FROM organizations
            WHERE id = $1
        """, current_user.org_id)

        member_count = await conn.fetchval("""
            SELECT COUNT(*) FROM org_members
            WHERE org_id = $1 AND status = 'active'
        """, current_user.org_id)

        custom_roles = json.loads(row["custom_roles"]) if row["custom_roles"] else []
        profile_completed = bool(row["name"] and row["industry"])

        return OrgProfileResponse(
            org_id=str(row["id"]),
            name=row["name"],
            slug=row["slug"],
            industry=row["industry"],
            stage=row["stage"],
            company_size=row["company_size"],
            description=row["description"],
            website=row["website"],
            hiring_focus=row["hiring_focus"],
            custom_roles=custom_roles,
            profile_completed=profile_completed,
            member_count=member_count
        )
