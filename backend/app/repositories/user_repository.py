from typing import Optional, List, Tuple
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.user import User

class UserRepository(BaseRepository[User]):
    """
    Repository class handling database interactions for the User model.
    """
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(self.model).where(
            func.lower(self.model.email) == email.strip().lower(),
            self.model.deleted_at.is_(None)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def search_users(self, query: str, page: int = 1, size: int = 10) -> Tuple[List[User], int]:
        stmt = select(self.model).where(
            self.model.deleted_at.is_(None),
            or_(
                self.model.email.ilike(f"%{query}%"),
                self.model.full_name.ilike(f"%{query}%")
            )
        )
        
        # Count query
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # Paginate and execute
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        result = await self.db.execute(stmt)
        return result.scalars().all(), total
