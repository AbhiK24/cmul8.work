"""B2C Authentication using Clerk."""
import os
import uuid
import httpx
import jwt
from jwt import PyJWKClient
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from ..db.pool import get_pool

router = APIRouter(prefix="/b2c", tags=["b2c-auth"])
security = HTTPBearer()

# Clerk configuration
CLERK_PUBLISHABLE_KEY = os.environ.get("CLERK_PUBLISHABLE_KEY", "")
CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY", "")

# Cache for JWKS client
_jwks_client: Optional[PyJWKClient] = None


def get_jwks_client() -> PyJWKClient:
    """Get or create JWKS client for Clerk token verification."""
    global _jwks_client
    if _jwks_client is None:
        # Extract Clerk frontend API from publishable key
        # Format: pk_test_xxxx or pk_live_xxxx
        if CLERK_PUBLISHABLE_KEY:
            # Clerk JWKS URL is based on the frontend API
            # We'll get it from the token's issuer during verification
            pass
    return _jwks_client


class ClerkUser(BaseModel):
    """Clerk user data."""
    clerk_id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None


async def verify_clerk_token(token: str) -> ClerkUser:
    """Verify a Clerk JWT and return user data."""
    try:
        # First decode without verification to get the issuer
        unverified = jwt.decode(token, options={"verify_signature": False})
        issuer = unverified.get("iss", "")

        if not issuer:
            raise HTTPException(status_code=401, detail="Invalid token: no issuer")

        # Get JWKS from Clerk
        jwks_url = f"{issuer}/.well-known/jwks.json"
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False}  # Clerk doesn't always set aud
        )

        # Extract user info from Clerk token
        # Clerk tokens have user info in various claims
        clerk_id = payload.get("sub", "")
        email = payload.get("email", "") or payload.get("primary_email", "")
        name = payload.get("name", "") or payload.get("full_name", "")
        avatar_url = payload.get("image_url", "") or payload.get("profile_image_url", "")

        return ClerkUser(
            clerk_id=clerk_id,
            email=email,
            name=name if name else None,
            avatar_url=avatar_url if avatar_url else None
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


async def get_current_b2c_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get current B2C user from Clerk token."""
    token = credentials.credentials
    clerk_user = await verify_clerk_token(token)

    # Ensure user exists in our database
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check if user exists
        user = await conn.fetchrow(
            "SELECT id, email, name, avatar_url FROM users WHERE email = $1",
            clerk_user.email
        )

        if not user:
            # Create user from Clerk data
            user_id = await conn.fetchval("""
                INSERT INTO users (email, name, avatar_url, auth_provider, provider_id)
                VALUES ($1, $2, $3, 'clerk', $4)
                RETURNING id
            """, clerk_user.email, clerk_user.name, clerk_user.avatar_url, clerk_user.clerk_id)
        else:
            user_id = user["id"]
            # Update user info if changed
            await conn.execute("""
                UPDATE users
                SET name = COALESCE($2, name),
                    avatar_url = COALESCE($3, avatar_url),
                    provider_id = $4,
                    last_login_at = NOW()
                WHERE id = $1
            """, user_id, clerk_user.name, clerk_user.avatar_url, clerk_user.clerk_id)

    return {
        "user_id": str(user_id),
        "email": clerk_user.email,
        "name": clerk_user.name,
        "clerk_id": clerk_user.clerk_id
    }


class B2CUserResponse(BaseModel):
    """B2C user info response."""
    id: str
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    job_role: Optional[str]
    experience_level: Optional[str]


@router.get("/me", response_model=B2CUserResponse)
async def get_b2c_me(current_user: dict = Depends(get_current_b2c_user)):
    """Get current B2C user info."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        user = await conn.fetchrow("""
            SELECT id, email, name, avatar_url, job_role, experience_level
            FROM users WHERE id = $1
        """, uuid.UUID(current_user["user_id"]))

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return B2CUserResponse(
            id=str(user["id"]),
            email=user["email"],
            name=user["name"],
            avatar_url=user["avatar_url"],
            job_role=user["job_role"],
            experience_level=user["experience_level"]
        )


class UpdateProfileRequest(BaseModel):
    """Update profile request."""
    name: Optional[str] = None
    job_role: Optional[str] = None
    experience_level: Optional[str] = None
    goals: Optional[list[str]] = None


@router.patch("/me")
async def update_b2c_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_b2c_user)
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

        if request.job_role is not None:
            updates.append(f"job_role = ${param_count}")
            values.append(request.job_role)
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

        values.append(uuid.UUID(current_user["user_id"]))
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ${param_count}"

        await conn.execute(query, *values)
        return {"message": "Profile updated"}
