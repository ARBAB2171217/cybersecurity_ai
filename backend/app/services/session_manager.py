import uuid
import datetime
from typing import Optional, List
from fastapi import Request
from app.repositories.session_repository import SessionRepository
from app.models.session import Session
from app.config.constants import REFRESH_TOKEN_EXPIRE_DAYS

class SessionManager:
    """
    Service managing active user and administrator sessions.
    Stores login time, client IP, and browser metadata.
    """
    def __init__(self, session_repo: SessionRepository):
        self.session_repo = session_repo

    async def create_session(
        self,
        token: str,
        user_id: Optional[uuid.UUID] = None,
        admin_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        expires_delta_days: int = REFRESH_TOKEN_EXPIRE_DAYS
    ) -> Session:
        """
        Creates and persists a new login session.
        """
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=expires_delta_days)
        
        session_data = {
            "token": token,
            "user_id": user_id,
            "admin_id": admin_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "expires_at": expires_at
        }
        
        return await self.session_repo.create(session_data)

    async def get_session(self, token: str) -> Optional[Session]:
        """
        Retrieves a session and verifies it hasn't expired.
        """
        session = await self.session_repo.get_by_token(token)
        if not session:
            return None
            
        now = datetime.datetime.now(datetime.timezone.utc)
        expires_at = session.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=datetime.timezone.utc)
            
        if expires_at <= now:
            await self.session_repo.revoke_session(token)
            return None
            
        return session

    async def get_user_sessions(self, user_id: uuid.UUID) -> List[Session]:
        return await self.session_repo.get_active_user_sessions(user_id)

    async def revoke_session(self, token: str) -> None:
        """
        Terminates the specific session.
        """
        await self.session_repo.revoke_session(token)

    async def revoke_all_user_sessions(self, user_id: uuid.UUID) -> None:
        """
        Logs out user from all devices.
        """
        await self.session_repo.revoke_all_user_sessions(user_id)

    async def revoke_all_admin_sessions(self, admin_id: uuid.UUID) -> None:
        """
        Logs out admin from all devices.
        """
        await self.session_repo.revoke_all_admin_sessions(admin_id)

    async def clear_expired(self) -> int:
        """
        Deletes all expired sessions from the database.
        """
        return await self.session_repo.clean_expired_sessions()
