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
from .auth import get_current_user, require_org_admin


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
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://www.cmul8.work")


class CreateSessionRequest(BaseModel):
    """Request to create a new assessment session."""
    role: str
    industry: str
    stage: str
    function: str
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
    role: str
    has_report: bool = False
    mode: str = "assess"


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
    mode: str = "assess"


async def _create_assessment_session(
    request: CreateSessionRequest,
    current_user: TokenData,
    job_description: Optional[str] = None
) -> SessionResponse:
    """Internal function to create an assessment session."""
    if not current_user.org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    pool = await get_pool()
    candidate_token = secrets.token_urlsafe(32)

    async with pool.acquire() as conn:
        # Get org info
        org = await conn.fetchrow(
            "SELECT name, industry, stage, company_size, description FROM organizations WHERE id = $1",
            current_user.org_id
        )

        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        org_params = {
            "org_name": org["name"],
            "role": request.role,
            "industry": request.industry or org["industry"],
            "stage": request.stage or org["stage"],
            "function": request.function,
            "has_jd": bool(job_description)
        }

        # Create session
        row = await conn.fetchrow("""
            INSERT INTO b2b_sessions (
                org_id, mode, candidate_token, candidate_name, candidate_email,
                candidate_link, candidate_type, org_params, status, created_by
            )
            VALUES ($1, 'assess', $2, $3, $4, '', $5, $6, 'generating', $7)
            RETURNING session_id, created_at
        """,
            current_user.org_id,
            candidate_token,
            request.candidate_name,
            request.candidate_email,
            request.candidate_type or "external",
            json.dumps(org_params),
            current_user.user_id
        )

        session_id = str(row["session_id"])
        candidate_link = f"{FRONTEND_URL}/s/{session_id}/{candidate_token}"

        # Update with candidate link
        await conn.execute("""
            UPDATE b2b_sessions SET candidate_link = $1 WHERE session_id = $2
        """, candidate_link, session_id)

    # Call engine to generate environment
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{ENGINE_URL}/generate",
                json={
                    "session_id": session_id,
                    "org_name": org["name"],
                    "role": request.role,
                    "industry": org_params["industry"],
                    "stage": org_params["stage"],
                    "function": request.function,
                    "candidate_name": request.candidate_name,
                    "company_size": org["company_size"],
                    "company_description": org["description"],
                    "job_description": job_description,
                }
            )
            response.raise_for_status()
    except httpx.HTTPError as e:
        print(f"Engine generation failed: {e}")

    return SessionResponse(
        session_id=session_id,
        candidate_name=request.candidate_name,
        candidate_email=request.candidate_email,
        candidate_link=candidate_link,
        candidate_type=request.candidate_type or "external",
        status="generating",
        created_at=row["created_at"].isoformat(),
        role=request.role,
        mode="assess"
    )


@router.post("/training", response_model=SessionResponse)
async def create_training_session(
    request: CreateTrainingSessionRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Create a training session from a pre-built template."""
    if not current_user.org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    pool = await get_pool()
    candidate_token = secrets.token_urlsafe(32)

    async with pool.acquire() as conn:
        # Fetch the template
        template = await conn.fetchrow("""
            SELECT id, title, skill_category, company_context, agents, tasks,
                   inbox, inject_schedule, artifact_content, framework_name, framework_reference,
                   coaching_prompts, learning_objectives
            FROM training_templates
            WHERE slug = $1
        """, request.template_slug)

        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        company_context = template["company_context"] or {}

        org_params = {
            "org_name": company_context.get("company_name", "Training Company"),
            "role": company_context.get("candidate_role", "Team Member"),
            "industry": company_context.get("industry", "Technology"),
            "stage": "training",
            "function": template["skill_category"],
            "template_title": template["title"],
            "framework_name": template["framework_name"],
        }

        env = {
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
        }

        # Create session
        row = await conn.fetchrow("""
            INSERT INTO b2b_sessions (
                org_id, mode, training_template_id, candidate_token, candidate_name, candidate_email,
                candidate_link, candidate_type, org_params, env, status, created_by
            )
            VALUES ($1, 'train', $2, $3, $4, $5, '', 'internal', $6, $7, 'pending', $8)
            RETURNING session_id, created_at
        """,
            current_user.org_id,
            template["id"],
            candidate_token,
            request.candidate_name,
            request.candidate_email,
            json.dumps(org_params),
            json.dumps(env),
            current_user.user_id
        )

        session_id = str(row["session_id"])
        candidate_link = f"{FRONTEND_URL}/s/{session_id}/{candidate_token}"

        # Update with candidate link
        await conn.execute("""
            UPDATE b2b_sessions SET candidate_link = $1 WHERE session_id = $2
        """, candidate_link, session_id)

    return SessionResponse(
        session_id=session_id,
        candidate_name=request.candidate_name,
        candidate_email=request.candidate_email,
        candidate_link=candidate_link,
        candidate_type="internal",
        status="pending",
        created_at=row["created_at"].isoformat(),
        role=company_context.get("candidate_role", "Team Member"),
        mode="train"
    )


@router.post("", response_model=SessionResponse)
async def create_session(
    data: str = Form(...),
    jd_file: Optional[UploadFile] = File(None),
    current_user: TokenData = Depends(get_current_user)
):
    """Create a new assessment session with optional JD PDF upload."""
    job_description = None

    try:
        request_data = json.loads(data)
        request = CreateSessionRequest(**request_data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON in data field: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request data: {e}")

    if jd_file and jd_file.filename:
        try:
            content = await jd_file.read()
            if content:
                job_description = extract_pdf_text(content)
        except Exception as e:
            print(f"Failed to extract JD: {e}")

    return await _create_assessment_session(request, current_user, job_description)


@router.get("", response_model=SessionListResponse)
async def list_sessions(current_user: TokenData = Depends(get_current_user)):
    """List all sessions for the current organization."""
    if not current_user.org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    pool = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT session_id, candidate_name, candidate_email, candidate_link,
                   candidate_type, status, created_at, org_params, mode,
                   report IS NOT NULL as has_report
            FROM b2b_sessions
            WHERE org_id = $1
            ORDER BY created_at DESC
        """, current_user.org_id)

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
                role=org_params.get("role", "Unknown"),
                has_report=row["has_report"] or False,
                mode=row["mode"] or "assess"
            ))

    return SessionListResponse(sessions=sessions)


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get detailed session info."""
    if not current_user.org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT session_id, candidate_name, candidate_email, candidate_link,
                   status, created_at, started_at, completed_at, org_params, env, report, mode
            FROM b2b_sessions
            WHERE session_id = $1 AND org_id = $2
        """, session_id, current_user.org_id)

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
            report=json.loads(row["report"]) if row["report"] else None,
            mode=row["mode"] or "assess"
        )


@router.get("/{session_id}/context")
async def get_session_context(session_id: str, token: str):
    """Get session context for candidate landing page (public, validates token)."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Try B2B sessions first
        row = await conn.fetchrow("""
            SELECT candidate_name, candidate_token, org_params, env, status, mode
            FROM b2b_sessions
            WHERE session_id = $1
        """, session_id)

        is_b2c = False
        if not row:
            # Try B2C sessions
            row = await conn.fetchrow("""
                SELECT 'Practice User' as candidate_name, candidate_token, org_params, env, status, 'train' as mode
                FROM b2c_sessions
                WHERE session_id = $1
            """, session_id)
            is_b2c = True

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        if row["candidate_token"] != token:
            raise HTTPException(status_code=403, detail="Invalid token")

        if row["status"] == "expired":
            raise HTTPException(status_code=410, detail="Session expired")

        org_params = json.loads(row["org_params"]) if row["org_params"] else {}
        env = json.loads(row["env"]) if row["env"] else None
        mode = row["mode"] or "assess"

        response = {
            "candidate_name": row["candidate_name"],
            "company_name": env.get("company_name") if env else org_params.get("org_name", "Company"),
            "role": org_params.get("role", "Role"),
            "status": row["status"],
            "ready": row["status"] == "pending" and env is not None,
            "mode": mode,
        }

        if mode == "train" and env:
            response["framework_name"] = env.get("framework_name")
            response["framework_reference"] = env.get("framework_reference")
            response["coaching_prompts"] = env.get("coaching_prompts", {})
            response["learning_objectives"] = env.get("learning_objectives", [])

        return response


@router.get("/{session_id}/report/candidate")
async def get_candidate_report(session_id: str):
    """Get candidate-facing report (public, only for completed sessions)."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT candidate_name, org_params, env, report, status
            FROM b2b_sessions
            WHERE session_id = $1
        """, session_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        if row["status"] != "complete":
            raise HTTPException(status_code=404, detail="Report not yet available")

        org_params = json.loads(row["org_params"]) if row["org_params"] else {}
        env = json.loads(row["env"]) if row["env"] else {}
        report = json.loads(row["report"]) if row["report"] else {}

        trait_scores = report.get("trait_scores", {})
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
    """Trigger report generation for a completed session."""
    if not current_user.org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT status, report FROM b2b_sessions
            WHERE session_id = $1 AND org_id = $2
        """, session_id, current_user.org_id)

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        if row["status"] not in ("complete", "in_progress"):
            raise HTTPException(status_code=400, detail="Session must be completed to generate report")

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
