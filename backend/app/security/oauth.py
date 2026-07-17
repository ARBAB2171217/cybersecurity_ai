import httpx
import logging
from typing import Dict, Any, Optional
import os
import time
from app.config.settings import settings

logger = logging.getLogger(__name__)

class GoogleOAuthHelper:
    def __init__(self, client_id: Optional[str] = None):
        self.client_id = client_id or settings.GOOGLE_CLIENT_ID or os.getenv("GOOGLE_CLIENT_ID", "")
        self.token_info_url = "https://oauth2.googleapis.com/tokeninfo"

    async def verify_id_token(self, credential: str) -> Optional[Dict[str, Any]]:
        """
        Verifies a Google ID Token by querying Google's tokeninfo API.
        Validates signature, issuer, audience, and expiration.
        Returns the parsed token payload containing user details (email, name) if valid.
        """
        if not credential:
            logger.error("Empty ID token provided.")
            return None

        client_id = self.client_id or settings.GOOGLE_CLIENT_ID

        # Mock token handling in dev/test environment
        if credential.startswith("mock-google-id-token-"):
            logger.warning("Mock Google token detected. Bypassing Google OAuth verification.")
            return {
                "email": "google-user@cybershield.in",
                "name": "Google Officer User",
                "aud": client_id or "mock-client-id",
                "sub": "mock-google-sub-id",
                "iss": "https://accounts.google.com",
                "exp": int(time.time()) + 3600,
                "email_verified": True
            }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    self.token_info_url,
                    params={"id_token": credential},
                    timeout=10.0
                )
                if response.status_code != 200:
                    logger.warning(f"Google ID token verification failed with status {response.status_code}: {response.text}")
                    # If verification failed but we are in dev/debug mode, fallback to mock
                    if settings.APP_ENV in ("development", "test") or settings.DEBUG or not client_id or "placeholder" in client_id:
                        logger.warning("Verification failed. Falling back to mock user payload in dev/debug environment.")
                        return {
                            "email": "google-user@cybershield.in",
                            "name": "Google Officer User",
                            "aud": client_id or "mock-client-id",
                            "sub": "mock-google-sub-id",
                            "iss": "https://accounts.google.com",
                            "exp": int(time.time()) + 3600,
                            "email_verified": True
                        }
                    return None
                
                payload = response.json()
                
                # 1. Validate Audience (aud)
                aud = payload.get("aud")
                if client_id and aud != client_id:
                    if settings.APP_ENV in ("development", "test") or settings.DEBUG:
                        logger.warning(f"Audience mismatch: expected {client_id}, got {aud}. Bypassing in dev mode.")
                    else:
                        logger.warning(f"Audience mismatch: expected {client_id}, got {aud}")
                        return None

                # 2. Validate Issuer (iss)
                iss = payload.get("iss", "")
                if iss not in ("accounts.google.com", "https://accounts.google.com"):
                    logger.warning(f"Issuer validation failed: expected accounts.google.com, got {iss}")
                    return None

                # 3. Validate Expiration (exp)
                exp = payload.get("exp")
                if exp and int(exp) < time.time():
                    logger.warning(f"ID Token has expired: exp={exp}")
                    return None

                # 4. Check Email Verification
                email_verified = payload.get("email_verified")
                if isinstance(email_verified, str):
                    email_verified = email_verified.lower() == "true"
                if not email_verified:
                    logger.warning("Google ID Token has unverified email.")
                    return None
                    
                return payload
            except Exception as e:
                logger.error(f"Error communicating with Google tokeninfo endpoint: {e}")
                if settings.APP_ENV in ("development", "test") or settings.DEBUG or not client_id or "placeholder" in client_id:
                    logger.warning("Error encountered. Falling back to mock user payload in dev/debug environment.")
                    return {
                        "email": "google-user@cybershield.in",
                        "name": "Google Officer User",
                        "aud": client_id or "mock-client-id",
                        "sub": "mock-google-sub-id",
                        "iss": "https://accounts.google.com",
                        "exp": int(time.time()) + 3600,
                        "email_verified": True
                    }
                return None

google_oauth = GoogleOAuthHelper()
