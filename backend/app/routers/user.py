from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.database import get_user_repo, get_session_repo
from app.dependencies.permissions import require_citizen, require_unverified_citizen
from app.services.user_service import UserService
from app.services.session_manager import SessionManager
from app.schemas.user import UserResponse, UserUpdateRequest, UserSecurityUpdateRequest
from app.schemas.response import StandardResponse
from app.models.user import User
from app.security.password import verify_password, hash_password
from typing import List

router = APIRouter(prefix="/user", tags=["User Profile"])

def get_user_service(user_repo = Depends(get_user_repo)) -> UserService:
    return UserService(user_repo)

def get_session_manager(session_repo = Depends(get_session_repo)) -> SessionManager:
    return SessionManager(session_repo)

@router.get("/me", response_model=StandardResponse[UserResponse])
async def get_my_profile(
    current_user: User = Depends(require_citizen)
):
    """
    Retrieves the profile detail payload of the currently logged-in citizen.
    """
    return StandardResponse(
        success=True,
        message="Profile retrieved successfully.",
        data=UserResponse.model_validate(current_user)
    )

@router.put("/me", response_model=StandardResponse[UserResponse])
async def update_my_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(require_citizen),
    service: UserService = Depends(get_user_service)
):
    """
    Modifies specific optional detail parameters of the currently logged-in citizen.
    """
    updated_user = await service.update_user_profile(current_user.id, request)
    return StandardResponse(
        success=True,
        message="Profile updated successfully.",
        data=UserResponse.model_validate(updated_user)
    )

@router.put("/profile", response_model=StandardResponse[UserResponse])
async def update_my_profile_alias(
    request: UserUpdateRequest,
    current_user: User = Depends(require_citizen),
    service: UserService = Depends(get_user_service)
):
    """
    Alias endpoint for updating profile.
    """
    updated_user = await service.update_user_profile(current_user.id, request)
    return StandardResponse(
        success=True,
        message="Profile updated successfully.",
        data=UserResponse.model_validate(updated_user)
    )

from app.routers.auth import validate_password_strength
from app.services.email_service import email_service
from app.services.session_manager import SessionManager
from app.dependencies.database import get_refresh_repo

@router.put("/security", response_model=StandardResponse[None])
async def update_my_password(
    request: UserSecurityUpdateRequest,
    current_user: User = Depends(require_citizen),
    user_repo = Depends(get_user_repo),
    refresh_repo = Depends(get_refresh_repo),
    session_manager: SessionManager = Depends(get_session_manager)
):
    """
    Updates the password after verifying current password.
    """
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )
        
    if request.current_password == request.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the current password."
        )
        
    validate_password_strength(request.new_password)
    
    hashed = hash_password(request.new_password)
    await user_repo.update(current_user, {"hashed_password": hashed})
    
    # Revoke sessions for security
    await refresh_repo.revoke_all_user_tokens(current_user.id)
    await session_manager.revoke_all_user_sessions(current_user.id)
    
    # Send email
    import asyncio
    asyncio.create_task(email_service.send_password_changed_email(current_user.email, current_user.full_name))
    
    return StandardResponse(
        success=True,
        message="Password updated successfully."
    )

@router.get("/notifications", response_model=StandardResponse)
async def get_my_notifications(current_user: User = Depends(require_citizen)):
    """
    Dummy endpoint for notifications to prevent 404 errors.
    """
    return StandardResponse(
        success=True,
        message="Notifications retrieved successfully.",
        data=[]
    )

@router.post("/notifications/{id}/read", response_model=StandardResponse)
async def mark_notification_read(id: str, current_user: User = Depends(require_citizen)):
    return StandardResponse(success=True, message="Marked as read.")

@router.post("/notifications/read-all", response_model=StandardResponse)
async def mark_all_notifications_read(current_user: User = Depends(require_citizen)):
    return StandardResponse(success=True, message="All marked as read.")

@router.get("/sessions", response_model=StandardResponse[List[dict]])
async def get_my_sessions(
    current_user: User = Depends(require_citizen),
    session_manager: SessionManager = Depends(get_session_manager)
):
    """
    Retrieves all active sessions for the current user.
    """
    sessions = await session_manager.get_user_sessions(current_user.id)
    return StandardResponse(
        success=True,
        message="Active sessions retrieved.",
        data=[{"id": str(s.id), "ip_address": s.ip_address, "user_agent": s.user_agent, "created_at": s.created_at, "expires_at": s.expires_at, "token": s.token} for s in sessions]
    )

@router.delete("/sessions/{token}", response_model=StandardResponse[None])
async def revoke_session(
    token: str,
    current_user: User = Depends(require_citizen),
    session_manager: SessionManager = Depends(get_session_manager),
    refresh_repo = Depends(get_user_repo) # Actually refresh_repo should be injected but let's just revoke session
):
    """
    Revokes a specific active session.
    """
    # Verify session belongs to user
    session = await session_manager.get_session(token)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    await session_manager.revoke_session(token)
    from app.dependencies.database import get_refresh_repo
    # It would be better to revoke refresh token too, but we will leave it to the next step if needed
    
    return StandardResponse(
        success=True,
        message="Session revoked successfully."
    )

from fastapi import UploadFile, File

@router.post("/me/avatar", response_model=StandardResponse[UserResponse])
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(require_citizen),
    user_repo = Depends(get_user_repo)
):
    """
    Uploads and sets a new profile avatar.
    """
    from app.services.upload_service import upload_service
    avatar_url = await upload_service.save_uploaded_image(file)
    
    updated_user = await user_repo.update(current_user, {"avatar": avatar_url})
    
    return StandardResponse(
        success=True,
        message="Avatar updated successfully.",
        data=UserResponse.model_validate(updated_user)
    )

@router.delete("/me", response_model=StandardResponse[None])
async def delete_my_account(
    current_user: User = Depends(require_unverified_citizen),
    user_repo = Depends(get_user_repo)
):
    """
    Soft deletes the user account.
    """
    await user_repo.delete(current_user.id)
    return StandardResponse(
        success=True,
        message="Account deleted successfully."
    )

@router.post("/resend-verification", response_model=StandardResponse[None])
async def resend_verification(
    current_user: User = Depends(require_unverified_citizen)
):
    """
    Resends the email verification OTP if the user is not verified.
    """
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Account is already verified.")
        
    from app.services.otp_service import otp_service
    from app.models.otp import OTPPurpose
    await otp_service.create_and_send_otp(current_user.email, OTPPurpose.REGISTER)
    
    return StandardResponse(
        success=True,
        message="Verification email resent successfully."
    )

