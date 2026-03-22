"""Session management endpoints."""
import json
import secrets
import os
import io
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel, EmailStr
from PyPDF2 import PdfReader

from ..db.pool import get_pool
from ..auth.jwt import TokenData
from .auth import get_current_user


def extract_pdf_text(file_content: bytes) -> str:
    """Extract text from a PDF file."""
    try:
        pdf_reader = PdfReader(io.BytesIO(file_content))
        text_parts = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        return "\n".join(text_parts)
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

router = APIRouter(prefix="/sessions")

ENGINE_URL = os.environ.get("ENGINE_URL", "http://engine.railway.internal:8080")


class CreateSessionRequest(BaseModel):
    """Request to create a new session."""
    org_name: Optional[str] = None
    role: str
    industry: str
    stage: str
    function: str
    model: Optional[str] = "cmul8-workenv1"
    candidate_name: str
    candidate_email: EmailStr
    candidate_type: Optional[str] = "external"  # 'internal' or 'external'


class CreateTrainingSessionRequest(BaseModel):
    """Request to create a training session from a template."""
    template_slug: str
    candidate_name: str
    candidate_email: EmailStr


class SessionResponse(BaseModel):
    """Session response."""
    session_id: str
    candidate_name: str
    candidate_email: str
    candidate_link: str
    candidate_type: str = "external"
    status: str
    created_at: str
    org_name: Optional[str] = None
    role: str
    has_report: bool = False
    mode: str = "test"  # 'test' or 'train'


class SessionListResponse(BaseModel):
    """List of sessions."""
    sessions: list[SessionResponse]


class SessionDetailResponse(BaseModel):
    """Detailed session response."""
    session_id: str
    candidate_name: str
    candidate_email: str
    candidate_link: str
    status: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    org_params: dict
    env: Optional[dict] = None
    report: Optional[dict] = None


async def _create_session_internal(
    request: CreateSessionRequest,
    current_user: TokenData,
    job_description: Optional[str] = None
) -> SessionResponse:
    """Internal function to create a session with optional JD."""
    pool = await get_pool()

    # Generate candidate token
    candidate_token = secrets.token_urlsafe(32)

    async with pool.acquire() as conn:
        # Create session record
        row = await conn.fetchrow("""
            INSERT INTO sessions (
                employer_id, candidate_token, candidate_name, candidate_email,
                candidate_link, candidate_type, org_params, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'generating')
            RETURNING session_id, created_at
        """,
            current_user.employer_id,
            candidate_token,
            request.candidate_name,
            request.candidate_email,
            "",  # Will be updated after we have the session_id
            request.candidate_type or "external",
            json.dumps({
                "org_name": request.org_name,
                "role": request.role,
                "industry": request.industry,
                "stage": request.stage,
                "function": request.function,
                "model": request.model,
                "has_jd": bool(job_description)
            })
        )

        session_id = str(row["session_id"])

        # Generate candidate link
        # In production, use the actual domain
        base_url = os.environ.get("FRONTEND_URL", "https://www.cmul8.work")
        candidate_link = f"{base_url}/s/{session_id}/{candidate_token}"

        # Update with candidate link
        await conn.execute("""
            UPDATE sessions SET candidate_link = $1 WHERE session_id = $2
        """, candidate_link, session_id)

    # Fetch full org profile for richer context
    async with pool.acquire() as conn:
        profile_row = await conn.fetchrow("""
            SELECT company_name, industry, stage, company_size, description, hiring_focus
            FROM employers WHERE id = $1
        """, current_user.employer_id)

    org_context = {
        "org_name": profile_row["company_name"] if profile_row else request.org_name,
        "industry": profile_row["industry"] if profile_row else request.industry,
        "stage": profile_row["stage"] if profile_row else request.stage,
        "company_size": profile_row["company_size"] if profile_row else None,
        "description": profile_row["description"] if profile_row else None,
        "hiring_focus": profile_row["hiring_focus"] if profile_row else None,
    }

    # Call engine to generate environment (async, don't wait)
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{ENGINE_URL}/generate",
                json={
                    "session_id": session_id,
                    "org_name": org_context["org_name"],
                    "role": request.role,
                    "industry": org_context["industry"],
                    "stage": org_context["stage"],
                    "function": request.function,
                    "candidate_name": request.candidate_name,
                    "company_size": org_context["company_size"],
                    "company_description": org_context["description"],
                    "hiring_focus": org_context["hiring_focus"],
                    "job_description": job_description,
                }
            )
            response.raise_for_status()
    except httpx.HTTPError as e:
        # Log error but don't fail - generation can be retried
        print(f"Engine generation failed: {e}")

    return SessionResponse(
        session_id=session_id,
        candidate_name=request.candidate_name,
        candidate_email=request.candidate_email,
        candidate_link=candidate_link,
        candidate_type=request.candidate_type or "external",
        status="generating",
        created_at=row["created_at"].isoformat(),
        org_name=request.org_name,
        role=request.role
    )


@router.post("/training", response_model=SessionResponse)
async def create_training_session(
    request: CreateTrainingSessionRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Create a training session from a pre-built template."""
    pool = await get_pool()

    # Fetch the template
    async with pool.acquire() as conn:
        template = await conn.fetchrow("""
            SELECT template_id, title, skill_category, company_context, agents, tasks,
                   inbox, inject_schedule, artifact_content, framework_name, framework_reference,
                   coaching_prompts, learning_objectives
            FROM training_templates
            WHERE slug = $1
        """, request.template_slug)

        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        # Generate candidate token
        candidate_token = secrets.token_urlsafe(32)

        # Get company context from template
        company_context = template["company_context"] or {}

        # Create session record with template data
        row = await conn.fetchrow("""
            INSERT INTO sessions (
                employer_id, candidate_token, candidate_name, candidate_email,
                candidate_link, candidate_type, org_params, status, mode, template_id, env
            )
            VALUES ($1, $2, $3, $4, $5, 'internal', $6, 'pending', 'train', $7, $8)
            RETURNING session_id, created_at
        """,
            current_user.employer_id,
            candidate_token,
            request.candidate_name,
            request.candidate_email,
            "",  # Will be updated after we have the session_id
            json.dumps({
                "org_name": company_context.get("company_name", "Training Company"),
                "role": company_context.get("candidate_role", "Team Member"),
                "industry": company_context.get("industry", "Technology"),
                "stage": "training",
                "function": template["skill_category"],
                "template_title": template["title"],
                "framework_name": template["framework_name"],
            }),
            template["template_id"],
            json.dumps({
                "company_name": company_context.get("company_name", "Training Company"),
                "company_description": company_context.get("company_description", ""),
                "scenario_tension": company_context.get("scenario_tension", ""),
                "agents": template["agents"] or [],
                "inbox": template["inbox"] or [],
                "tasks": template["tasks"] or [],
                "inject_schedule": template["inject_schedule"] or [],
                "artifact_content": template["artifact_content"],
                "mode": "train",
                "framework_name": template["framework_name"],
                "framework_reference": template["framework_reference"],
                "coaching_prompts": template["coaching_prompts"] or {},
                "learning_objectives": template["learning_objectives"] or [],
            })
        )

        session_id = str(row["session_id"])

        # Generate candidate link
        base_url = os.environ.get("FRONTEND_URL", "https://www.cmul8.work")
        candidate_link = f"{base_url}/s/{session_id}/{candidate_token}"

        # Update with candidate link
        await conn.execute("""
            UPDATE sessions SET candidate_link = $1 WHERE session_id = $2
        """, candidate_link, session_id)

    return SessionResponse(
        session_id=session_id,
        candidate_name=request.candidate_name,
        candidate_email=request.candidate_email,
        candidate_link=candidate_link,
        candidate_type="internal",
        status="pending",
        created_at=row["created_at"].isoformat(),
        org_name=company_context.get("company_name"),
        role=company_context.get("candidate_role", "Team Member")
    )


@router.post("", response_model=SessionResponse)
async def create_session(
    data: str = Form(...),
    jd_file: Optional[UploadFile] = File(None),
    current_user: TokenData = Depends(get_current_user)
):
    """Create a new assessment session with optional JD PDF upload.

    Always expects multipart form with 'data' as JSON string.
    """
    job_description = None

    # Parse the JSON data from form field
    try:
        request_data = json.loads(data)
        request = CreateSessionRequest(**request_data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON in data field: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request data: {e}")

    # Extract text from JD PDF if provided
    if jd_file and jd_file.filename:
        try:
            content = await jd_file.read()
            if content:
                job_description = extract_pdf_text(content)
                if job_description:
                    print(f"Extracted JD text: {len(job_description)} characters")
        except Exception as e:
            print(f"Failed to extract JD: {e}")

    return await _create_session_internal(request, current_user, job_description)


@router.get("", response_model=SessionListResponse)
async def list_sessions(current_user: TokenData = Depends(get_current_user)):
    """List all sessions for the current employer."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT session_id, candidate_name, candidate_email, candidate_link,
                   candidate_type, status, created_at, org_params, mode,
                   report IS NOT NULL as has_report
            FROM sessions
            WHERE employer_id = $1
            ORDER BY created_at DESC
        """, current_user.employer_id)

        sessions = []
        for row in rows:
            org_params = json.loads(row["org_params"]) if row["org_params"] else {}
            sessions.append(SessionResponse(
                session_id=str(row["session_id"]),
                candidate_name=row["candidate_name"],
                candidate_email=row["candidate_email"],
                candidate_link=row["candidate_link"],
                candidate_type=row["candidate_type"] or "external",
                status=row["status"],
                created_at=row["created_at"].isoformat(),
                org_name=org_params.get("org_name"),
                role=org_params.get("role", "Unknown"),
                has_report=row["has_report"] or False,
                mode=row["mode"] or "test"
            ))

    return SessionListResponse(sessions=sessions)


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get detailed session info."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT session_id, candidate_name, candidate_email, candidate_link,
                   status, created_at, started_at, completed_at, org_params, env, report
            FROM sessions
            WHERE session_id = $1 AND employer_id = $2
        """, session_id, current_user.employer_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        return SessionDetailResponse(
            session_id=str(row["session_id"]),
            candidate_name=row["candidate_name"],
            candidate_email=row["candidate_email"],
            candidate_link=row["candidate_link"],
            status=row["status"],
            created_at=row["created_at"].isoformat(),
            started_at=row["started_at"].isoformat() if row["started_at"] else None,
            completed_at=row["completed_at"].isoformat() if row["completed_at"] else None,
            org_params=json.loads(row["org_params"]) if row["org_params"] else {},
            env=json.loads(row["env"]) if row["env"] else None,
            report=json.loads(row["report"]) if row["report"] else None
        )


@router.get("/{session_id}/context")
async def get_session_context(session_id: str, token: str):
    """Get session context for candidate landing page (public, validates token)."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT candidate_name, candidate_token, org_params, env, status, mode
            FROM sessions
            WHERE session_id = $1
        """, session_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        if row["candidate_token"] != token:
            raise HTTPException(status_code=403, detail="Invalid token")

        if row["status"] == "expired":
            raise HTTPException(status_code=410, detail="Session expired")

        org_params = json.loads(row["org_params"]) if row["org_params"] else {}
        env = json.loads(row["env"]) if row["env"] else None
        mode = row["mode"] or "test"

        response = {
            "candidate_name": row["candidate_name"],
            "company_name": env.get("company_name") if env else org_params.get("org_name", "Company"),
            "role": org_params.get("role", "Role"),
            "status": row["status"],
            "ready": row["status"] == "pending" and env is not None,
            "mode": mode,
        }

        # Include training-specific data for train mode
        if mode == "train" and env:
            response["framework_name"] = env.get("framework_name")
            response["framework_reference"] = env.get("framework_reference")
            response["coaching_prompts"] = env.get("coaching_prompts", {})
            response["learning_objectives"] = env.get("learning_objectives", [])

        return response


@router.get("/{session_id}/report/candidate")
async def get_candidate_report(session_id: str):
    """Get candidate-facing report (public, only available for completed sessions)."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT candidate_name, org_params, env, report, report_html_candidate, status
            FROM sessions
            WHERE session_id = $1
        """, session_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        if row["status"] != "complete":
            raise HTTPException(status_code=404, detail="Report not yet available")

        org_params = json.loads(row["org_params"]) if row["org_params"] else {}
        env = json.loads(row["env"]) if row["env"] else {}
        report = json.loads(row["report"]) if row["report"] else {}

        # Build candidate-friendly report (less detailed than employer report)
        trait_scores = report.get("trait_scores", {})

        # Extract strengths (high scores) and growth areas (lower scores)
        strengths = []
        growth_areas = []
        for trait, data in trait_scores.items():
            if isinstance(data, dict) and "score" in data:
                if data["score"] >= 7:
                    strengths.append(f"Strong {trait.replace('_', ' ')}")
                elif data["score"] < 5:
                    growth_areas.append(f"Developing {trait.replace('_', ' ')}")

        return {
            "candidate_name": row["candidate_name"],
            "role": org_params.get("role", "Role"),
            "company_name": env.get("company_name") or org_params.get("org_name", "Company"),
            "overall_band": report.get("overall_band", "Calibrating"),
            "trait_scores": trait_scores,
            "strengths": strengths or report.get("key_observations", [])[:3],
            "growth_areas": growth_areas or [],
            "session_summary": report.get("session_summary", "Your simulation has been completed and analyzed."),
        }


@router.post("/{session_id}/score")
async def trigger_scoring(
    session_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Trigger report generation for a completed session (employer only)."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT status, report FROM sessions
            WHERE session_id = $1 AND employer_id = $2
        """, session_id, current_user.employer_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        if row["status"] not in ("complete", "in_progress"):
            raise HTTPException(status_code=400, detail="Session must be completed to generate report")

    # Call engine to score
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{ENGINE_URL}/score",
                json={"session_id": session_id}
            )
            response.raise_for_status()
            return {"status": "success", "message": "Report generated successfully"}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Scoring failed: {e}")
