import logging
from typing import Optional, Dict, Any
from app.security.jwt import create_access_token, create_refresh_token, decode_token
from app.config.constants import ACCESS_TOKEN_EXPIRE_MINUTES
from app.schemas.auth import TokenResponse

logger = logging.getLogger(__name__)

class JWTService:
    """
    Business service to orchestrate JWT generation and decoding.
    """
    @staticmethod
    def generate_token_pair(subject: str, role: str) -> TokenResponse:
        """
        Generates access and refresh tokens for a user/admin.
        """
        access_token = create_access_token(subject=subject, role=role)
        refresh_token = create_refresh_token(subject=subject, role=role)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="Bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Validates token signature and returns the parsed payload, or None if invalid.
        """
        try:
            return decode_token(token)
        except Exception as e:
            logger.warning(f"JWT verification failure: {e}")
            return None

jwt_service = JWTService()
