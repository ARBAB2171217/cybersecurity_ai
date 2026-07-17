import uuid
from typing import Optional, List, Tuple
from app.repositories.audit_repository import AuditRepository
from app.models.audit_log import AuditLog

class AuditService:
    """
    Business service to manage administrative activity audit trails.
    """
    def __init__(self, audit_repo: AuditRepository):
        self.audit_repo = audit_repo

    async def log_action(
        self,
        action: str,
        admin_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        details: Optional[dict] = None
    ) -> AuditLog:
        """
        Submits an audit log record for an admin or user action.
        """
        return await self.audit_repo.log_action(
            action=action,
            admin_id=admin_id,
            user_id=user_id,
            ip_address=ip_address,
            details=details
        )

    async def get_audit_logs(
        self,
        admin_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        page: int = 1,
        size: int = 10
    ) -> Tuple[List[AuditLog], int]:
        """
        Fetches a paginated collection of admin actions.
        """
        return await self.audit_repo.list_audit_logs(
            admin_id=admin_id,
            action=action,
            page=page,
            size=size
        )
