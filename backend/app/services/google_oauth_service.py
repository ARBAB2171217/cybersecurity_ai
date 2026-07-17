import datetime
from typing import Optional
from fastapi import HTTPException, status
from app.security.oauth import google_oauth
from app.repositories.user_repository import UserRepository
from app.repositories.refresh_repository import RefreshRepository
from app.services.jwt_service import jwt_service
from app.services.session_manager import SessionManager
from app.schemas.auth import TokenResponse

class GoogleOAuthService:
    """
    Business service verifying Google ID tokens, linking user profiles,
    and initializing tracked user sessions.
    """
    def __init__(
        self,
        user_repo: UserRepository,
        refresh_repo: RefreshRepository,
        session_manager: SessionManager
    ):
        self.user_repo = user_repo
        self.refresh_repo = refresh_repo
        self.session_manager = session_manager

    async def authenticate_google(
        self,
        credential: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TokenResponse:
        """
        Validates Google ID Token, registers first-time SSO users,
        initializes database sessions, and returns active tokens.
        """
        payload = await google_oauth.verify_id_token(credential)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google OAuth ID Token verification failed."
            )

        email = payload.get("email")
        google_id = payload.get("sub")
        full_name = payload.get("name", "Google User")
        avatar = payload.get("picture")
        email_verified = payload.get("email_verified")
        if isinstance(email_verified, str):
            email_verified = email_verified.lower() == "true"
        elif email_verified is None:
            email_verified = False
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email claim missing from Google ID Token."
            )

        # Check if user exists
        user = await self.user_repo.get_by_email(email)
        if not user:
            # Auto-register new users via passwordless Google Auth
            user_data = {
                "email": email,
                "hashed_password": None,
                "full_name": full_name,
                "is_active": True,
                "is_verified": True,  # Google accounts are pre-verified
                "google_id": google_id,
                "avatar": avatar,
                "provider": "google",
                "email_verified": email_verified
            }
            user = await self.user_repo.create(user_data)
        else:
            # Auto-verify existing local user and update Google details upon successful Google SSO linkage
            updates = {}
            if not user.google_id:
                updates["google_id"] = google_id
            if not user.avatar and avatar:
                updates["avatar"] = avatar
            if user.provider != "google":
                updates["provider"] = "google"
            if not user.email_verified and email_verified:
                updates["email_verified"] = email_verified
            if not user.is_verified:
                updates["is_verified"] = True
                
            if updates:
                await self.user_repo.update(user, updates)
                
        # Generate new JWT pair
        token_pair = jwt_service.generate_token_pair(str(user.id), "USER")
        
        # Save refresh token
        refresh_token_data = {
            "user_id": user.id,
            "token": token_pair.refresh_token,
            "expires_at": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        }
        await self.refresh_repo.create(refresh_token_data)

        # Save session tracking details
        await self.session_manager.create_session(
            token=token_pair.refresh_token,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return token_pair
