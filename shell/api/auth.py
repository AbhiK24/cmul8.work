"""Authentication endpoints for B2B users."""
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import httpx
import jwt as pyjwt
from jwt import PyJWKClient

from ..db.pool import get_pool
from ..auth.jwt import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    TokenData
)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://www.cmul8.work")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class SignupRequest(BaseModel):
    """B2B signup - creates user + org."""
    email: EmailStr
    password: str
    name: str
    org_name: str
    industry: Optional[str] = None
    company_size: Optional[str] = None


class LoginRequest(BaseModel):
    """B2B login request."""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Auth response with token and user info."""
    access_token: str
    token_type: str = "bearer"
    user: dict
    org: Optional[dict] = None


class InviteMemberRequest(BaseModel):
    """Invite a member to the org."""
    email: EmailStr
    name: Optional[str] = None
    role: str = "member"  # 'admin' or 'member'


class AcceptInviteRequest(BaseModel):
    """Accept an org invitation."""
    token: str
    name: Optional[str] = None
    password: Optional[str] = None  # Required if new user


class ForgotPasswordRequest(BaseModel):
    """Forgot password request."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request."""
    token: str
    password: str


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_slug(name: str) -> str:
    """Generate a URL-friendly slug from a name."""
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return f"{slug}-{secrets.token_hex(4)}"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials

    # First try our custom JWT
    token_data = decode_access_token(token)
    if token_data is not None:
        return token_data

    # Try Clerk token (for B2B SSO users)
    try:
        clerk_user = await verify_clerk_token(token)

        # Get or create user from Clerk data
        pool = await get_pool()
        async with pool.acquire() as conn:
            user = await conn.fetchrow(
                "SELECT id, email FROM users WHERE email = $1",
                clerk_user.email
            )

            if not user:
                # Create user from Clerk data
                user_id = await conn.fetchval("""
                    INSERT INTO users (email, clerk_id, name, avatar_url, type)
                    VALUES ($1, $2, $3, $4, 'b2b')
                    RETURNING id
                """, clerk_user.email, clerk_user.clerk_id, clerk_user.name, clerk_user.avatar_url)
            else:
                user_id = user["id"]
                # Update Clerk info
                await conn.execute("""
                    UPDATE users
                    SET clerk_id = COALESCE(clerk_id, $2),
                        name = COALESCE($3, name),
                        avatar_url = COALESCE($4, avatar_url)
                    WHERE id = $1
                """, user_id, clerk_user.clerk_id, clerk_user.name, clerk_user.avatar_url)

            # Get user's primary org
            membership = await conn.fetchrow("""
                SELECT org_id FROM org_members
                WHERE user_id = $1 AND status = 'active'
                ORDER BY joined_at ASC LIMIT 1
            """, user_id)

            org_id = membership["org_id"] if membership else None

        return TokenData(
            user_id=user_id,
            email=clerk_user.email,
            org_id=org_id,
            user_type="b2b"
        )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def require_org_admin(
    current_user: TokenData = Depends(get_current_user)
) -> TokenData:
    """Require user to be an org admin."""
    if not current_user.org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    pool = await get_pool()
    async with pool.acquire() as conn:
        member = await conn.fetchrow("""
            SELECT role FROM org_members
            WHERE org_id = $1 AND user_id = $2 AND status = 'active'
        """, current_user.org_id, current_user.user_id)

        if not member or member["role"] != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


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
        unverified = pyjwt.decode(token, options={"verify_signature": False})
        issuer = unverified.get("iss", "")

        if not issuer:
            raise HTTPException(status_code=401, detail="Invalid token: no issuer")

        # Get JWKS from Clerk
        jwks_url = f"{issuer}/.well-known/jwks.json"
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Verify the token
        payload = pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False}
        )

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

    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


async def send_email(to: str, subject: str, html: str):
    """Send email via Resend."""
    if not RESEND_API_KEY:
        print(f"[DEV] Email to {to}: {subject}")
        return

    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "WorkSim <noreply@cmul8.work>",
                    "to": [to],
                    "subject": subject,
                    "html": html
                }
            )
        except Exception as e:
            print(f"Failed to send email: {e}")


# ============================================
# AUTH ENDPOINTS
# ============================================

@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    B2B Signup Flow:
    1. Create user (type=b2b)
    2. Create organization
    3. Add user as org admin
    4. Return token
    """
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Check if email already exists
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", request.email
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create user
        user_id = await conn.fetchval("""
            INSERT INTO users (email, password_hash, name, type)
            VALUES ($1, $2, $3, 'b2b')
            RETURNING id
        """, request.email, get_password_hash(request.password), request.name)

        # Create organization
        org_slug = generate_slug(request.org_name)
        org_id = await conn.fetchval("""
            INSERT INTO organizations (name, slug, industry, company_size)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        """, request.org_name, org_slug, request.industry, request.company_size)

        # Add user as org admin
        await conn.execute("""
            INSERT INTO org_members (org_id, user_id, role, status, joined_at)
            VALUES ($1, $2, 'admin', 'active', NOW())
        """, org_id, user_id)

    # Create token
    token = create_access_token(
        user_id=str(user_id),
        email=request.email,
        org_id=str(org_id),
        user_type="b2b"
    )

    return AuthResponse(
        access_token=token,
        user={
            "id": str(user_id),
            "email": request.email,
            "name": request.name,
            "type": "b2b"
        },
        org={
            "id": str(org_id),
            "name": request.org_name,
            "slug": org_slug,
            "role": "admin"
        }
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    B2B Login Flow:
    1. Verify credentials
    2. Get user's primary org
    3. Return token with org context
    """
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Get user
        user = await conn.fetchrow("""
            SELECT id, email, password_hash, name, type
            FROM users WHERE email = $1
        """, request.email)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not user["password_hash"]:
            raise HTTPException(status_code=401, detail="Please use social login")

        if not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Update last login
        await conn.execute(
            "UPDATE users SET last_login_at = NOW() WHERE id = $1",
            user["id"]
        )

        # Get user's primary org (first active membership)
        membership = await conn.fetchrow("""
            SELECT o.id, o.name, o.slug, m.role
            FROM org_members m
            JOIN organizations o ON o.id = m.org_id
            WHERE m.user_id = $1 AND m.status = 'active'
            ORDER BY m.joined_at ASC
            LIMIT 1
        """, user["id"])

        org_id = str(membership["id"]) if membership else None
        org_data = None
        if membership:
            org_data = {
                "id": str(membership["id"]),
                "name": membership["name"],
                "slug": membership["slug"],
                "role": membership["role"]
            }

    # Create token
    token = create_access_token(
        user_id=str(user["id"]),
        email=user["email"],
        org_id=org_id,
        user_type=user["type"]
    )

    return AuthResponse(
        access_token=token,
        user={
            "id": str(user["id"]),
            "email": user["email"],
            "name": user["name"],
            "type": user["type"]
        },
        org=org_data
    )


@router.get("/me")
async def get_me(current_user: TokenData = Depends(get_current_user)):
    """Get current user info with org memberships."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        user = await conn.fetchrow("""
            SELECT id, email, name, type, avatar_url, created_at
            FROM users WHERE id = $1
        """, current_user.user_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get all org memberships
        memberships = await conn.fetch("""
            SELECT o.id, o.name, o.slug, m.role, m.status
            FROM org_members m
            JOIN organizations o ON o.id = m.org_id
            WHERE m.user_id = $1
            ORDER BY m.joined_at ASC
        """, current_user.user_id)

        return {
            "user": {
                "id": str(user["id"]),
                "email": user["email"],
                "name": user["name"],
                "type": user["type"],
                "avatar_url": user["avatar_url"],
                "created_at": user["created_at"].isoformat()
            },
            "organizations": [
                {
                    "id": str(m["id"]),
                    "name": m["name"],
                    "slug": m["slug"],
                    "role": m["role"],
                    "status": m["status"]
                }
                for m in memberships
            ],
            "current_org_id": str(current_user.org_id) if current_user.org_id else None
        }


@router.post("/switch-org/{org_id}")
async def switch_org(org_id: str, current_user: TokenData = Depends(get_current_user)):
    """Switch to a different organization (get new token)."""
    pool = await get_pool()
    org_uuid = uuid.UUID(org_id)

    async with pool.acquire() as conn:
        # Verify user is a member of this org
        membership = await conn.fetchrow("""
            SELECT o.id, o.name, o.slug, m.role
            FROM org_members m
            JOIN organizations o ON o.id = m.org_id
            WHERE m.user_id = $1 AND m.org_id = $2 AND m.status = 'active'
        """, current_user.user_id, org_uuid)

        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this organization")

    # Create new token with different org context
    token = create_access_token(
        user_id=str(current_user.user_id),
        email=current_user.email,
        org_id=org_id,
        user_type=current_user.user_type
    )

    return {
        "access_token": token,
        "org": {
            "id": str(membership["id"]),
            "name": membership["name"],
            "slug": membership["slug"],
            "role": membership["role"]
        }
    }


# ============================================
# INVITATION ENDPOINTS
# ============================================

@router.post("/invite")
async def invite_member(
    request: InviteMemberRequest,
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(require_org_admin)
):
    """Admin invites a member to the org."""
    pool = await get_pool()
    invite_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    async with pool.acquire() as conn:
        # Check if already a member
        existing_member = await conn.fetchrow("""
            SELECT m.id FROM org_members m
            JOIN users u ON u.id = m.user_id
            WHERE m.org_id = $1 AND u.email = $2
        """, current_user.org_id, request.email)

        if existing_member:
            raise HTTPException(status_code=400, detail="User is already a member")

        # Check for existing pending invitation
        existing_invite = await conn.fetchrow("""
            SELECT id FROM org_invitations
            WHERE org_id = $1 AND email = $2 AND accepted_at IS NULL AND expires_at > NOW()
        """, current_user.org_id, request.email)

        if existing_invite:
            raise HTTPException(status_code=400, detail="Invitation already pending")

        # Create invitation
        invite_id = await conn.fetchval("""
            INSERT INTO org_invitations (org_id, email, role, token, invited_by, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        """, current_user.org_id, request.email, request.role, invite_token,
            current_user.user_id, expires_at)

        # Get org info
        org = await conn.fetchrow(
            "SELECT name, slug FROM organizations WHERE id = $1",
            current_user.org_id
        )

        inviter = await conn.fetchrow(
            "SELECT name FROM users WHERE id = $1",
            current_user.user_id
        )

    invite_link = f"{FRONTEND_URL}/invite/{invite_token}"

    # Send invitation email
    background_tasks.add_task(
        send_email,
        request.email,
        f"You've been invited to join {org['name']} on WorkSim",
        f"""
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #1a1a1a; margin-bottom: 24px;">You're invited!</h2>
            <p style="color: #666; line-height: 1.6;">
                {inviter['name'] or 'A team admin'} has invited you to join <strong>{org['name']}</strong> on WorkSim.
            </p>
            <a href="{invite_link}"
               style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px;
                      border-radius: 9999px; text-decoration: none; margin: 24px 0;">
                Accept Invitation
            </a>
            <p style="color: #888; font-size: 14px;">
                This invitation expires in 7 days.
            </p>
        </div>
        """
    )

    return {
        "invite_id": str(invite_id),
        "invite_link": invite_link,
        "email": request.email,
        "org_name": org["name"],
        "expires_at": expires_at.isoformat()
    }


@router.get("/invite/{token}")
async def get_invite_info(token: str):
    """Get invitation details (public endpoint for invite page)."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        invite = await conn.fetchrow("""
            SELECT i.email, i.role, i.expires_at, i.accepted_at,
                   o.id as org_id, o.name as org_name, o.slug as org_slug,
                   u.name as invited_by_name
            FROM org_invitations i
            JOIN organizations o ON o.id = i.org_id
            LEFT JOIN users u ON u.id = i.invited_by
            WHERE i.token = $1
        """, token)

        if not invite:
            raise HTTPException(status_code=404, detail="Invitation not found")

        if invite["accepted_at"]:
            raise HTTPException(status_code=400, detail="Invitation already accepted")

        if invite["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Invitation expired")

        # Check if user already exists
        existing_user = await conn.fetchrow(
            "SELECT id, name FROM users WHERE email = $1",
            invite["email"]
        )

    return {
        "email": invite["email"],
        "role": invite["role"],
        "org_name": invite["org_name"],
        "invited_by": invite["invited_by_name"],
        "user_exists": existing_user is not None,
        "user_name": existing_user["name"] if existing_user else None
    }


@router.post("/invite/accept", response_model=AuthResponse)
async def accept_invite(request: AcceptInviteRequest):
    """
    Accept an org invitation.
    - If user exists: just add to org
    - If new user: create account (requires password)
    """
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Get invitation
        invite = await conn.fetchrow("""
            SELECT id, org_id, email, role, expires_at, accepted_at
            FROM org_invitations WHERE token = $1
        """, request.token)

        if not invite:
            raise HTTPException(status_code=404, detail="Invitation not found")

        if invite["accepted_at"]:
            raise HTTPException(status_code=400, detail="Invitation already accepted")

        if invite["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Invitation expired")

        # Check if user exists
        user = await conn.fetchrow(
            "SELECT id, email, name, type FROM users WHERE email = $1",
            invite["email"]
        )

        if user:
            user_id = user["id"]
            user_name = user["name"]
        else:
            # New user - password required
            if not request.password:
                raise HTTPException(status_code=400, detail="Password required for new users")

            # Create user
            user_id = await conn.fetchval("""
                INSERT INTO users (email, password_hash, name, type)
                VALUES ($1, $2, $3, 'b2b')
                RETURNING id
            """, invite["email"], get_password_hash(request.password), request.name)
            user_name = request.name

        # Add to org
        await conn.execute("""
            INSERT INTO org_members (org_id, user_id, role, status, joined_at)
            VALUES ($1, $2, $3, 'active', NOW())
            ON CONFLICT (org_id, user_id) DO UPDATE SET status = 'active', joined_at = NOW()
        """, invite["org_id"], user_id, invite["role"])

        # Mark invitation as accepted
        await conn.execute("""
            UPDATE org_invitations SET accepted_at = NOW() WHERE id = $1
        """, invite["id"])

        # Get org info
        org = await conn.fetchrow(
            "SELECT id, name, slug FROM organizations WHERE id = $1",
            invite["org_id"]
        )

    # Create token
    token = create_access_token(
        user_id=str(user_id),
        email=invite["email"],
        org_id=str(invite["org_id"]),
        user_type="b2b"
    )

    return AuthResponse(
        access_token=token,
        user={
            "id": str(user_id),
            "email": invite["email"],
            "name": user_name,
            "type": "b2b"
        },
        org={
            "id": str(org["id"]),
            "name": org["name"],
            "slug": org["slug"],
            "role": invite["role"]
        }
    )


# ============================================
# PASSWORD RESET ENDPOINTS
# ============================================

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Request a password reset email."""
    pool = await get_pool()
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, email FROM users WHERE email = $1",
            request.email
        )

        if user:
            # Invalidate existing tokens
            await conn.execute("""
                UPDATE password_reset_tokens SET used = TRUE
                WHERE user_id = $1 AND used = FALSE
            """, user["id"])

            # Create new token
            await conn.execute("""
                INSERT INTO password_reset_tokens (user_id, token, expires_at)
                VALUES ($1, $2, $3)
            """, user["id"], reset_token, expires_at)

            # Send reset email
            reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
            background_tasks.add_task(
                send_email,
                user["email"],
                "Reset your WorkSim password",
                f"""
                <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                    <h2 style="color: #1a1a1a; margin-bottom: 24px;">Reset your password</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Click the button below to reset your password. This link expires in 1 hour.
                    </p>
                    <a href="{reset_url}"
                       style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px;
                              border-radius: 9999px; text-decoration: none; margin: 24px 0;">
                        Reset Password
                    </a>
                    <p style="color: #888; font-size: 14px;">
                        If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
                """
            )

    return MessageResponse(message="If an account exists, you will receive a reset email")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest):
    """Reset password using a valid reset token."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        token_row = await conn.fetchrow("""
            SELECT id, user_id, expires_at, used
            FROM password_reset_tokens WHERE token = $1
        """, request.token)

        if not token_row:
            raise HTTPException(status_code=400, detail="Invalid reset token")

        if token_row["used"]:
            raise HTTPException(status_code=400, detail="Token already used")

        if token_row["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Token expired")

        # Update password
        await conn.execute("""
            UPDATE users SET password_hash = $1 WHERE id = $2
        """, get_password_hash(request.password), token_row["user_id"])

        # Mark token as used
        await conn.execute("""
            UPDATE password_reset_tokens SET used = TRUE WHERE id = $1
        """, token_row["id"])

    return MessageResponse(message="Password reset successfully")


@router.post("/logout")
async def logout():
    """Logout (client should discard the token)."""
    return {"message": "Logged out successfully"}
