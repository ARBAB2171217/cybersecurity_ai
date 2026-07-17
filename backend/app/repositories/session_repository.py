import uuid
import datetime
from typing import Optional, List
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.session import Session

class SessionRepository(BaseRepository[Session]):
    """
    Repository class handling database interactions for the Session model.
    """
    def __init__(self, db: AsyncSession):
        super().__init__(Session, db)

    async def get_by_token(self, token: str) -> Optional[Session]:
        stmt = select(self.model).where(self.model.token == token)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_user_sessions(self, user_id: uuid.UUID) -> List[Session]:
        now = datetime.datetime.now(datetime.timezone.utc)
        stmt = select(self.model).where(
            self.model.user_id == user_id,
            self.model.expires_at > now
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_active_admin_sessions(self, admin_id: uuid.UUID) -> List[Session]:
        now = datetime.datetime.now(datetime.timezone.utc)
        stmt = select(self.model).where(
            self.model.admin_id == admin_id,
            self.model.expires_at > now
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def revoke_session(self, token: str) -> None:
        stmt = delete(self.model).where(self.model.token == token)
        await self.db.execute(stmt)
        await self.db.commit()

    async def revoke_all_user_sessions(self, user_id: uuid.UUID) -> None:
        stmt = delete(self.model).where(self.model.user_id == user_id)
        await self.db.execute(stmt)
        await self.db.commit()

    async def revoke_all_admin_sessions(self, admin_id: uuid.UUID) -> None:
        stmt = delete(self.model).where(self.model.admin_id == admin_id)
        await self.db.execute(stmt)
        await self.db.commit()

    async def clean_expired_sessions(self) -> int:
        now = datetime.datetime.now(datetime.timezone.utc)
        stmt = delete(self.model).where(self.model.expires_at <= now)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount
