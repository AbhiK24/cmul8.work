"""JWT authentication utilities."""
import os
from datetime import datetime, timedelta
from typing import Optional, Union

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# Configuration
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "worksim-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenData(BaseModel):
    """Token payload data for B2B (employers)."""
    employer_id: str
    email: str


class B2CTokenData(BaseModel):
    """Token payload data for B2C (individual users)."""
    user_id: str
    email: str
    user_type: str = "b2c"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str, raw: bool = False) -> Optional[Union[TokenData, B2CTokenData, dict]]:
    """Decode and validate a JWT access token.

    Args:
        token: The JWT token to decode
        raw: If True, return the raw payload dict instead of a model

    Returns:
        TokenData for B2B, B2CTokenData for B2C, raw dict if raw=True, or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if raw:
            return payload

        # Check if this is a B2C token
        if payload.get("user_type") == "b2c":
            user_id = payload.get("user_id")
            email = payload.get("email")
            if user_id is None or email is None:
                return None
            return B2CTokenData(user_id=user_id, email=email, user_type="b2c")

        # B2B token (employer)
        employer_id = payload.get("employer_id")
        email = payload.get("email")
        if employer_id is None or email is None:
            return None
        return TokenData(employer_id=employer_id, email=email)
    except JWTError:
        return None
