"""JWT authentication utilities."""
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# Configuration
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "worksim-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenData(BaseModel):
    """Unified token payload data."""
    user_id: uuid.UUID
    email: str
    org_id: Optional[uuid.UUID] = None  # B2B users have org context
    user_type: str = "b2b"  # 'b2b' or 'b2c'


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(
    user_id: str,
    email: str,
    org_id: Optional[str] = None,
    user_type: str = "b2b",
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode = {
        "user_id": user_id,
        "email": email,
        "user_type": user_type,
        "exp": expire
    }
    if org_id:
        to_encode["org_id"] = org_id
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT access token.

    Returns:
        TokenData if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("user_id")
        email = payload.get("email")

        if user_id is None or email is None:
            return None

        return TokenData(
            user_id=uuid.UUID(user_id),
            email=email,
            org_id=uuid.UUID(payload["org_id"]) if payload.get("org_id") else None,
            user_type=payload.get("user_type", "b2b")
        )
    except (JWTError, ValueError):
        return None
