import jwt
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Union, Optional
from app.config.settings import settings
from app.config.constants import JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

logger = logging.getLogger(__name__)

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT access token.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "access",
        "role": role
    }
    secret = settings.JWT_SECRET_KEY or settings.SECRET_KEY
    return jwt.encode(to_encode, secret, algorithm=JWT_ALGORITHM)

def create_refresh_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT refresh token.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh",
        "role": role
    }
    secret = settings.JWT_REFRESH_SECRET_KEY or settings.SECRET_KEY
    return jwt.encode(to_encode, secret, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    try:
        # Decode without verification first to determine token type
        unverified = jwt.decode(token, options={"verify_signature": False})
        token_type = unverified.get("type", "access")
        if token_type == "refresh":
            secret = settings.JWT_REFRESH_SECRET_KEY or settings.SECRET_KEY
        else:
            secret = settings.JWT_SECRET_KEY or settings.SECRET_KEY
        return jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        logger.warning("Token signature has expired.")
        raise
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token signature: {e}")
        raise
