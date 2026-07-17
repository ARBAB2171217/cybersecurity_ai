from typing import Generic, TypeVar, Type, Optional, List, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
import datetime
from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    """
    Generic Base Repository implementing standard async CRUD patterns.
    """
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: Any) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: ModelType, obj_in: dict) -> ModelType:
        for field in obj_in:
            if hasattr(db_obj, field):
                setattr(db_obj, field, obj_in[field])
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, id: Any, soft: bool = False) -> bool:
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return False
            
        if soft and hasattr(db_obj, "deleted_at"):
            db_obj.deleted_at = datetime.datetime.now(datetime.timezone.utc)
            self.db.add(db_obj)
        else:
            await self.db.delete(db_obj)
            
        await self.db.commit()
        return True

    async def list_paginated(
        self, page: int = 1, size: int = 10, filters: dict = None
    ) -> Tuple[List[ModelType], int]:
        stmt = select(self.model)
        
        # Apply exact filters if provided
        if filters:
            for attr, val in filters.items():
                if hasattr(self.model, attr) and val is not None:
                    stmt = stmt.where(getattr(self.model, attr) == val)
                    
        # Automatically exclude soft deleted records
        if hasattr(self.model, "deleted_at"):
            stmt = stmt.where(getattr(self.model, "deleted_at").is_(None))

        # Get count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # Paginated fetch
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        
        result = await self.db.execute(stmt)
        return result.scalars().all(), total

    async def exists(self, id: Any) -> bool:
        stmt = select(self.model.id).where(self.model.id == id)
        result = await self.db.execute(stmt)
        return result.scalar() is not None
