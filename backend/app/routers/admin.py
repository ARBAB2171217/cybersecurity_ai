import uuid
from fastapi import APIRouter, Depends
from app.dependencies.database import get_admin_repo, get_user_repo
from app.dependencies.permissions import require_admin_or_super, require_super_admin
from app.dependencies.pagination import get_pagination_params
from app.services.admin_service import AdminService
from app.services.user_service import UserService
from app.schemas.user import UserResponse
from app.schemas.admin import AdminResponse, AdminCreateRequest, AdminUpdateRequest
from app.schemas.response import StandardResponse, PaginatedResponse
from app.schemas.common import PaginationParams, PageMeta
from app.models.admin import Admin

router = APIRouter(prefix="/admin", tags=["Admin Management"])

def get_admin_service(admin_repo = Depends(get_admin_repo)) -> AdminService:
    return AdminService(admin_repo)

def get_user_service(user_repo = Depends(get_user_repo)) -> UserService:
    return UserService(user_repo)

@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_users(
    pagination: PaginationParams = Depends(get_pagination_params),
    current_admin: Admin = Depends(require_admin_or_super),
    user_service: UserService = Depends(get_user_service)
):
    """
    Returns a paginated log list of all registered citizens.
    """
    users, total = await user_service.list_users(page=pagination.page, size=pagination.size)
    total_pages = (total + pagination.size - 1) // pagination.size
    
    meta = PageMeta(
        total_items=total,
        total_pages=max(1, total_pages),
        page=pagination.page,
        size=pagination.size
    )
    
    data = [UserResponse.model_validate(u) for u in users]
    return PaginatedResponse(
        success=True,
        message="Citizens successfully listed.",
        data=data,
        meta=meta
    )

@router.get("/admins", response_model=PaginatedResponse[AdminResponse])
async def list_admins(
    pagination: PaginationParams = Depends(get_pagination_params),
    current_admin: Admin = Depends(require_super_admin),
    admin_service: AdminService = Depends(get_admin_service)
):
    """
    Returns a paginated list of all administrators (Super Admin only).
    """
    admins, total = await admin_service.list_admins(page=pagination.page, size=pagination.size)
    total_pages = (total + pagination.size - 1) // pagination.size
    
    meta = PageMeta(
        total_items=total,
        total_pages=max(1, total_pages),
        page=pagination.page,
        size=pagination.size
    )
    
    data = [AdminResponse.model_validate(a) for a in admins]
    return PaginatedResponse(
        success=True,
        message="Administrators successfully listed.",
        data=data,
        meta=meta
    )

@router.post("/admins", response_model=StandardResponse[AdminResponse])
async def create_admin(
    request: AdminCreateRequest,
    current_admin: Admin = Depends(require_super_admin),
    admin_service: AdminService = Depends(get_admin_service)
):
    """
    Registers a new sub-administrator credential profile (Super Admin only).
    """
    new_admin = await admin_service.create_admin(request)
    return StandardResponse(
        success=True,
        message="Administrator account created.",
        data=AdminResponse.model_validate(new_admin)
    )

@router.put("/admins/{admin_id}", response_model=StandardResponse[AdminResponse])
async def update_admin(
    admin_id: uuid.UUID,
    request: AdminUpdateRequest,
    current_admin: Admin = Depends(require_super_admin),
    admin_service: AdminService = Depends(get_admin_service)
):
    """
    Updates administrative details or switches active status keys (Super Admin only).
    """
    updated = await admin_service.update_admin(admin_id, request)
    return StandardResponse(
        success=True,
        message="Administrator profile updated.",
        data=AdminResponse.model_validate(updated)
    )

@router.delete("/admins/{admin_id}", response_model=StandardResponse[None])
async def delete_admin(
    admin_id: uuid.UUID,
    current_admin: Admin = Depends(require_super_admin),
    admin_service: AdminService = Depends(get_admin_service)
):
    """
    Soft-deletes an administrative account profile (Super Admin only).
    """
    await admin_service.delete_admin(admin_id)
    return StandardResponse(
        success=True,
        message="Administrator account deleted successfully."
    )

from app.dependencies.database import get_refresh_repo, get_session_repo
from app.services.session_manager import SessionManager
from pydantic import BaseModel

class UserStatusUpdate(BaseModel):
    is_active: bool

@router.post("/users/{user_id}/force-logout", response_model=StandardResponse[None])
async def force_logout_user(
    user_id: uuid.UUID,
    current_admin: Admin = Depends(require_admin_or_super),
    refresh_repo = Depends(get_refresh_repo),
    session_repo = Depends(get_session_repo)
):
    """
    Forcefully terminates all active sessions for a user.
    """
    session_manager = SessionManager(session_repo)
    await refresh_repo.revoke_all_user_tokens(user_id)
    await session_manager.revoke_all_user_sessions(user_id)
    return StandardResponse(
        success=True,
        message="User logged out from all devices."
    )

@router.put("/users/{user_id}/status", response_model=StandardResponse[UserResponse])
async def update_user_status(
    user_id: uuid.UUID,
    request: UserStatusUpdate,
    current_admin: Admin = Depends(require_admin_or_super),
    user_repo = Depends(get_user_repo)
):
    """
    Enables or disables a user account.
    """
    user = await user_repo.get_by_id(user_id)
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    updated = await user_repo.update(user, {"is_active": request.is_active})
    return StandardResponse(
        success=True,
        message="User status updated successfully.",
        data=UserResponse.model_validate(updated)
    )

class AdminResetPasswordRequest(BaseModel):
    new_password: str

@router.post("/users/{user_id}/reset-password", response_model=StandardResponse[None])
async def admin_reset_user_password(
    user_id: uuid.UUID,
    request: AdminResetPasswordRequest,
    current_admin: Admin = Depends(require_admin_or_super),
    user_repo = Depends(get_user_repo),
    refresh_repo = Depends(get_refresh_repo),
    session_repo = Depends(get_session_repo)
):
    """
    Force resets a user's password and logs them out.
    """
    from app.security.password import hash_password
    from app.routers.auth import validate_password_strength
    
    validate_password_strength(request.new_password)
    
    user = await user_repo.get_by_id(user_id)
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    hashed = hash_password(request.new_password)
    await user_repo.update(user, {"hashed_password": hashed})
    
    # Revoke sessions
    session_manager = SessionManager(session_repo)
    await refresh_repo.revoke_all_user_tokens(user_id)
    await session_manager.revoke_all_user_sessions(user_id)
    
    # Send email notification
    from app.services.email_service import email_service
    import asyncio
    asyncio.create_task(email_service.send_password_changed_email(user.email, user.full_name))
    
    return StandardResponse(
        success=True,
        message="User password reset successfully."
    )
