from typing import List
from fastapi import HTTPException, status
from app.models.admin import AdminRole

class RoleChecker:
    """
    FastAPI dependency to verify if the requester's role meets endpoint requirements.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user_role: str) -> str:
        # SUPER_ADMIN bypasses all checks
        if user_role == AdminRole.SUPER_ADMIN.value:
            return user_role
            
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have the required permissions to access this resource."
            )
        return user_role

# Predefined role dependency checkpoints
allow_citizen_only = RoleChecker(["USER"])
allow_admin_only = RoleChecker(["ADMIN"])
allow_admin_or_super = RoleChecker(["ADMIN", "SUPER_ADMIN"])
allow_super_only = RoleChecker(["SUPER_ADMIN"])
