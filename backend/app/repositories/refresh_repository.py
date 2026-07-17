import uuid
import datetime
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.refresh_token import RefreshToken

class RefreshRepository(BaseRepository[RefreshToken]):
    """
    Repository class handling database interactions for the RefreshToken model.
    """
    def __init__(self, db: AsyncSession):
        super().__init__(RefreshToken, db)

    async def get_by_token(self, token: str) -> Optional[RefreshToken]:
        stmt = select(self.model).where(
            self.model.token == token,
            self.model.revoked_at.is_(None)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_any_by_token(self, token: str) -> Optional[RefreshToken]:
        """Gets token regardless of revocation status."""
        stmt = select(self.model).where(self.model.token == token)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_token(self, token: str) -> bool:
        stmt = (
            update(self.model)
            .where(
                self.model.token == token,
                self.model.revoked_at.is_(None)
            )
            .values(revoked_at=datetime.datetime.now(datetime.timezone.utc))
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    async def revoke_all_user_tokens(self, user_id: uuid.UUID) -> None:
        stmt = (
            update(self.model)
            .where(
                self.model.user_id == user_id,
                self.model.revoked_at.is_(None)
            )
            .values(revoked_at=datetime.datetime.now(datetime.timezone.utc))
        )
        await self.db.execute(stmt)
        await self.db.commit()

    async def revoke_all_admin_tokens(self, admin_id: uuid.UUID) -> None:
        stmt = (
            update(self.model)
            .where(
                self.model.admin_id == admin_id,
                self.model.revoked_at.is_(None)
            )
            .values(revoked_at=datetime.datetime.now(datetime.timezone.utc))
        )
        await self.db.execute(stmt)
        await self.db.commit()
