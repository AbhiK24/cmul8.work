"""Authentication endpoints."""
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import httpx
import jwt
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

# Consumer email domains that indicate B2C users (not allowed for enterprise)
CONSUMER_DOMAINS = [
    'gmail.com', 'googlemail.com',
    'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'ymail.com',
    'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com',
    'aol.com',
    'protonmail.com', 'proton.me',
    'zoho.com',
    'mail.com',
    'gmx.com', 'gmx.net',
    'yandex.com', 'yandex.ru',
    'qq.com', '163.com', '126.com',
    'tutanota.com',
    'fastmail.com',
    'hey.com',
]


def is_consumer_email(email: str) -> bool:
    """Check if email is from a consumer domain."""
    domain = email.split('@')[1].lower() if '@' in email else ''
    return domain in CONSUMER_DOMAINS

router = APIRouter(prefix="/auth")
security = HTTPBearer()


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


class RegisterRequest(BaseModel):
    """Registration request."""
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    """Login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User info response."""
    id: str
    email: str


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


async def send_reset_email(email: str, reset_token: str):
    """Send password reset email via Resend."""
    if not RESEND_API_KEY:
        print(f"[DEV] Password reset link: {FRONTEND_URL}/reset-password?token={reset_token}")
        return

    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "cmul8 <noreply@cmul8.work>",
                    "to": [email],
                    "subject": "Reset your password",
                    "html": f"""
                        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                            <h2 style="color: #1a1a1a; margin-bottom: 24px;">Reset your password</h2>
                            <p style="color: #666; line-height: 1.6;">
                                Click the button below to reset your password. This link will expire in 1 hour.
                            </p>
                            <a href="{reset_url}"
                               style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px;
                                      border-radius: 9999px; text-decoration: none; margin: 24px 0;">
                                Reset password
                            </a>
                            <p style="color: #888; font-size: 14px;">
                                If you didn't request this, you can safely ignore this email.
                            </p>
                        </div>
                    """
                }
            )
        except Exception as e:
            print(f"Failed to send reset email: {e}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """Dependency to get the current authenticated user.

    Supports both custom JWT tokens and Clerk tokens.
    For Clerk tokens, creates/updates employer in database.
    """
    token = credentials.credentials

    # First try our custom JWT
    token_data = decode_access_token(token)
    if token_data is not None:
        return token_data

    # Try Clerk token
    try:
        clerk_user = await verify_clerk_token(token)

        # Ensure work email for B2B
        if is_consumer_email(clerk_user.email):
            raise HTTPException(
                status_code=403,
                detail="Enterprise accounts require a work email address"
            )

        # Ensure employer exists in database
        pool = await get_pool()
        async with pool.acquire() as conn:
            employer = await conn.fetchrow(
                "SELECT id, email FROM employers WHERE email = $1",
                clerk_user.email
            )

            if not employer:
                # Create employer from Clerk data
                employer_id = await conn.fetchval("""
                    INSERT INTO employers (email, password_hash, clerk_id, name)
                    VALUES ($1, '', $2, $3)
                    RETURNING id
                """, clerk_user.email, clerk_user.clerk_id, clerk_user.name)
            else:
                employer_id = employer["id"]
                # Update clerk_id if not set
                await conn.execute("""
                    UPDATE employers
                    SET clerk_id = COALESCE(clerk_id, $2),
                        name = COALESCE($3, name)
                    WHERE id = $1
                """, employer_id, clerk_user.clerk_id, clerk_user.name)

        return TokenData(employer_id=str(employer_id), email=clerk_user.email)

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """Register a new employer account."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Check if email already exists
        existing = await conn.fetchrow(
            "SELECT id FROM employers WHERE email = $1",
            request.email
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create new employer
        password_hash = get_password_hash(request.password)
        row = await conn.fetchrow("""
            INSERT INTO employers (email, password_hash)
            VALUES ($1, $2)
            RETURNING id, email
        """, request.email, password_hash)

        # Generate token
        token = create_access_token({
            "employer_id": str(row["id"]),
            "email": row["email"]
        })

        return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login to an existing employer account."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, password_hash FROM employers WHERE email = $1",
            request.email
        )

        if not row or not verify_password(request.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Generate token
        token = create_access_token({
            "employer_id": str(row["id"]),
            "email": row["email"]
        })

        return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: TokenData = Depends(get_current_user)):
    """Get current user info."""
    return UserResponse(id=current_user.employer_id, email=current_user.email)


@router.post("/logout")
async def logout():
    """Logout (client should discard the token)."""
    return {"message": "Logged out successfully"}


@router.post("/clerk", response_model=UserResponse)
async def clerk_login(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Login/register via Clerk token (for enterprise users).

    Verifies the Clerk token, ensures it's a work email, and creates/updates
    the employer in the database.
    """
    token = credentials.credentials
    clerk_user = await verify_clerk_token(token)

    # Ensure work email for B2B
    if is_consumer_email(clerk_user.email):
        raise HTTPException(
            status_code=403,
            detail="Enterprise accounts require a work email address. Personal emails (Gmail, Yahoo, etc.) are not accepted."
        )

    pool = await get_pool()
    async with pool.acquire() as conn:
        employer = await conn.fetchrow(
            "SELECT id, email FROM employers WHERE email = $1",
            clerk_user.email
        )

        if not employer:
            # Create new employer from Clerk data
            employer_id = await conn.fetchval("""
                INSERT INTO employers (email, password_hash, clerk_id, name)
                VALUES ($1, '', $2, $3)
                RETURNING id
            """, clerk_user.email, clerk_user.clerk_id, clerk_user.name)
        else:
            employer_id = employer["id"]
            # Update clerk_id and name if not set
            await conn.execute("""
                UPDATE employers
                SET clerk_id = COALESCE(clerk_id, $2),
                    name = COALESCE($3, name)
                WHERE id = $1
            """, employer_id, clerk_user.clerk_id, clerk_user.name)

    return UserResponse(id=str(employer_id), email=clerk_user.email)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Request a password reset email."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Find employer by email
        employer = await conn.fetchrow(
            "SELECT id, email FROM employers WHERE email = $1",
            request.email
        )

        # Always return success to prevent email enumeration
        if not employer:
            return MessageResponse(message="If an account exists, you will receive a reset email")

        # Generate secure reset token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        # Invalidate any existing tokens for this user
        await conn.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE employer_id = $1 AND used = FALSE",
            employer["id"]
        )

        # Store the new token
        await conn.execute("""
            INSERT INTO password_reset_tokens (employer_id, token, expires_at)
            VALUES ($1, $2, $3)
        """, employer["id"], reset_token, expires_at)

        # Send email in background
        background_tasks.add_task(send_reset_email, employer["email"], reset_token)

    return MessageResponse(message="If an account exists, you will receive a reset email")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest):
    """Reset password using a valid reset token."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Find valid token
        token_row = await conn.fetchrow("""
            SELECT id, employer_id, expires_at, used
            FROM password_reset_tokens
            WHERE token = $1
        """, request.token)

        if not token_row:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")

        if token_row["used"]:
            raise HTTPException(status_code=400, detail="This reset link has already been used")

        if token_row["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="This reset link has expired")

        # Update password
        password_hash = get_password_hash(request.password)
        await conn.execute(
            "UPDATE employers SET password_hash = $1 WHERE id = $2",
            password_hash, token_row["employer_id"]
        )

        # Mark token as used
        await conn.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE id = $1",
            token_row["id"]
        )

    return MessageResponse(message="Password reset successfully")
