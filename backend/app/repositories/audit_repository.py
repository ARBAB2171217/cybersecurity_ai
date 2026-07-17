import uuid
import datetime
from typing import Optional, List, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.audit_log import AuditLog

class AuditRepository(BaseRepository[AuditLog]):
    """
    Repository class handling database interactions for the AuditLog model.
    """
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)

    async def log_action(
        self,
        action: str,
        admin_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        details: Optional[dict] = None
    ) -> AuditLog:
        """
        Creates and saves an audit log entry.
        """
        log_entry = {
            "admin_id": admin_id,
            "user_id": user_id,
            "action": action,
            "ip_address": ip_address,
            "details": details,
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }
        return await self.create(log_entry)

    async def list_audit_logs(
        self,
        admin_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        page: int = 1,
        size: int = 10
    ) -> Tuple[List[AuditLog], int]:
        """
        Lists paginated audit logs filtered by admin and/or action, sorted from newest to oldest.
        """
        stmt = select(self.model)
        
        if admin_id:
            stmt = stmt.where(self.model.admin_id == admin_id)
        if action:
            stmt = stmt.where(self.model.action == action)
            
        # Order by newest entries first
        stmt = stmt.order_by(self.model.created_at.desc())

        # Count query
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # Paginate and execute
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        result = await self.db.execute(stmt)
        return result.scalars().all(), total
