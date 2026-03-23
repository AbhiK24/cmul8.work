"""B2C Authentication endpoints - Social OAuth for individual users."""
import os
import secrets
import uuid
from datetime import datetime, timezone
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import httpx

from ..db.pool import get_pool
from ..auth.jwt import create_access_token, decode_access_token

# OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
LINKEDIN_CLIENT_ID = os.environ.get("LINKEDIN_CLIENT_ID", "")
LINKEDIN_CLIENT_SECRET = os.environ.get("LINKEDIN_CLIENT_SECRET", "")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://www.cmul8.work")
BACKEND_URL = os.environ.get("BACKEND_URL", "https://shell-production-e454.up.railway.app")

router = APIRouter(prefix="/b2c")
security = HTTPBearer()


# ============ Models ============

class B2CUserResponse(BaseModel):
    """B2C user info response."""
    id: str
    email: str
    name: str | None
    avatar_url: str | None
    auth_provider: str
    current_role: str | None
    experience_level: str | None


class B2CTokenResponse(BaseModel):
    """Token response for B2C users."""
    access_token: str
    token_type: str = "bearer"
    user: B2CUserResponse


class B2CTokenData(BaseModel):
    """Token data for B2C users."""
    user_id: str
    email: str
    user_type: str = "b2c"


# ============ Auth Dependencies ============

async def get_current_b2c_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> B2CTokenData:
    """Dependency to get the current authenticated B2C user."""
    token = credentials.credentials
    payload = decode_access_token(token, raw=True)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Check if this is a B2C token
    if payload.get('user_type') != 'b2c':
        raise HTTPException(status_code=401, detail="Invalid B2C token")

    user_id = payload.get('user_id')
    email = payload.get('email')

    if not user_id or not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return B2CTokenData(
        user_id=user_id,
        email=email,
        user_type='b2c'
    )


# ============ Google OAuth ============

@router.get("/auth/google")
async def google_login(redirect_uri: str = Query(default=None)):
    """Redirect to Google OAuth."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    # Store redirect_uri in state for callback
    state = secrets.token_urlsafe(16)
    if redirect_uri:
        state = f"{state}:{redirect_uri}"

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/b2c/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account"
    }

    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=google_auth_url)


@router.get("/auth/google/callback")
async def google_callback(code: str = Query(...), state: str = Query(default="")):
    """Handle Google OAuth callback."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    # Parse redirect_uri from state
    parts = state.split(":", 1)
    redirect_uri = parts[1] if len(parts) > 1 else f"{FRONTEND_URL}/dashboard"

    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{BACKEND_URL}/b2c/auth/google/callback"
            }
        )

        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        # Get user info from Google
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")

        google_user = user_info_response.json()

    # Create or update user in database
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check if user exists
        existing_user = await conn.fetchrow(
            "SELECT id, email, name, avatar_url FROM users WHERE auth_provider = 'google' AND provider_id = $1",
            google_user["id"]
        )

        if existing_user:
            # Update last login
            await conn.execute(
                "UPDATE users SET last_login_at = $1, name = $2, avatar_url = $3 WHERE id = $4",
                datetime.now(timezone.utc),
                google_user.get("name"),
                google_user.get("picture"),
                existing_user["id"]
            )
            user_id = str(existing_user["id"])
            email = existing_user["email"]
        else:
            # Check if email already exists with different provider
            email_exists = await conn.fetchrow(
                "SELECT id, auth_provider FROM users WHERE email = $1",
                google_user["email"]
            )

            if email_exists:
                # Redirect with error - email already registered with different provider
                error_redirect = f"{FRONTEND_URL}/login?error=email_exists&provider={email_exists['auth_provider']}"
                return RedirectResponse(url=error_redirect)

            # Create new user
            new_user = await conn.fetchrow("""
                INSERT INTO users (email, name, avatar_url, auth_provider, provider_id, last_login_at)
                VALUES ($1, $2, $3, 'google', $4, $5)
                RETURNING id, email
            """,
                google_user["email"],
                google_user.get("name"),
                google_user.get("picture"),
                google_user["id"],
                datetime.now(timezone.utc)
            )
            user_id = str(new_user["id"])
            email = new_user["email"]

    # Generate JWT token for B2C user
    jwt_token = create_access_token({
        "user_id": user_id,
        "email": email,
        "user_type": "b2c"
    })

    # Redirect to frontend with token
    redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
    return RedirectResponse(url=redirect_url)


# ============ LinkedIn OAuth ============

@router.get("/auth/linkedin")
async def linkedin_login(redirect_uri: str = Query(default=None)):
    """Redirect to LinkedIn OAuth."""
    if not LINKEDIN_CLIENT_ID:
        raise HTTPException(status_code=500, detail="LinkedIn OAuth not configured")

    state = secrets.token_urlsafe(16)
    if redirect_uri:
        state = f"{state}:{redirect_uri}"

    params = {
        "client_id": LINKEDIN_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/b2c/auth/linkedin/callback",
        "response_type": "code",
        "scope": "openid profile email",
        "state": state
    }

    linkedin_auth_url = f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"
    return RedirectResponse(url=linkedin_auth_url)


@router.get("/auth/linkedin/callback")
async def linkedin_callback(code: str = Query(...), state: str = Query(default="")):
    """Handle LinkedIn OAuth callback."""
    if not LINKEDIN_CLIENT_ID or not LINKEDIN_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="LinkedIn OAuth not configured")

    parts = state.split(":", 1)
    redirect_uri = parts[1] if len(parts) > 1 else f"{FRONTEND_URL}/dashboard"

    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_response = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "client_id": LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{BACKEND_URL}/b2c/auth/linkedin/callback"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        # Get user info from LinkedIn (using OpenID Connect userinfo endpoint)
        user_info_response = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")

        linkedin_user = user_info_response.json()

    # Create or update user in database
    pool = await get_pool()
    async with pool.acquire() as conn:
        provider_id = linkedin_user.get("sub")  # OpenID Connect subject identifier

        existing_user = await conn.fetchrow(
            "SELECT id, email, name, avatar_url FROM users WHERE auth_provider = 'linkedin' AND provider_id = $1",
            provider_id
        )

        if existing_user:
            await conn.execute(
                "UPDATE users SET last_login_at = $1, name = $2, avatar_url = $3 WHERE id = $4",
                datetime.now(timezone.utc),
                linkedin_user.get("name"),
                linkedin_user.get("picture"),
                existing_user["id"]
            )
            user_id = str(existing_user["id"])
            email = existing_user["email"]
        else:
            email_exists = await conn.fetchrow(
                "SELECT id, auth_provider FROM users WHERE email = $1",
                linkedin_user["email"]
            )

            if email_exists:
                error_redirect = f"{FRONTEND_URL}/login?error=email_exists&provider={email_exists['auth_provider']}"
                return RedirectResponse(url=error_redirect)

            new_user = await conn.fetchrow("""
                INSERT INTO users (email, name, avatar_url, auth_provider, provider_id, last_login_at)
                VALUES ($1, $2, $3, 'linkedin', $4, $5)
                RETURNING id, email
            """,
                linkedin_user["email"],
                linkedin_user.get("name"),
                linkedin_user.get("picture"),
                provider_id,
                datetime.now(timezone.utc)
            )
            user_id = str(new_user["id"])
            email = new_user["email"]

    jwt_token = create_access_token({
        "user_id": user_id,
        "email": email,
        "user_type": "b2c"
    })

    redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
    return RedirectResponse(url=redirect_url)


# ============ User Endpoints ============

@router.get("/me", response_model=B2CUserResponse)
async def get_b2c_me(current_user: B2CTokenData = Depends(get_current_b2c_user)):
    """Get current B2C user info."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        user = await conn.fetchrow("""
            SELECT id, email, name, avatar_url, auth_provider, current_role, experience_level
            FROM users WHERE id = $1
        """, uuid.UUID(current_user.user_id))

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return B2CUserResponse(
            id=str(user["id"]),
            email=user["email"],
            name=user["name"],
            avatar_url=user["avatar_url"],
            auth_provider=user["auth_provider"],
            current_role=user["current_role"],
            experience_level=user["experience_level"]
        )


@router.post("/logout")
async def b2c_logout():
    """Logout B2C user (client should discard the token)."""
    return {"message": "Logged out successfully"}


class UpdateProfileRequest(BaseModel):
    """Update profile request."""
    name: str | None = None
    current_role: str | None = None
    experience_level: str | None = None
    goals: list[str] | None = None


@router.patch("/me")
async def update_b2c_profile(
    request: UpdateProfileRequest,
    current_user: B2CTokenData = Depends(get_current_b2c_user)
):
    """Update B2C user profile."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        updates = []
        values = []
        param_count = 1

        if request.name is not None:
            updates.append(f"name = ${param_count}")
            values.append(request.name)
            param_count += 1

        if request.current_role is not None:
            updates.append(f"current_role = ${param_count}")
            values.append(request.current_role)
            param_count += 1

        if request.experience_level is not None:
            updates.append(f"experience_level = ${param_count}")
            values.append(request.experience_level)
            param_count += 1

        if request.goals is not None:
            updates.append(f"goals = ${param_count}")
            values.append(request.goals)
            param_count += 1

        if not updates:
            return {"message": "No updates provided"}

        values.append(uuid.UUID(current_user.user_id))
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ${param_count}"

        await conn.execute(query, *values)

    return {"message": "Profile updated"}
