import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.dependencies.database import get_user_repo, get_admin_repo, get_refresh_repo, get_session_repo, get_audit_repo
from app.repositories.user_repository import UserRepository
from app.repositories.admin_repository import AdminRepository
from app.repositories.session_repository import SessionRepository
from app.services.auth_service import AuthService
from app.services.google_oauth_service import GoogleOAuthService
from app.services.session_manager import SessionManager
from app.services.audit_service import AuditService
from app.services.otp_service import otp_service
from app.services.jwt_service import jwt_service
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshTokenRequest,
    GoogleAuthRequest, OTPRequest, OTPVerifyRequest, PasswordResetRequest, PasswordResetConfirmRequest
)
from app.schemas.user import UserResponse
from app.schemas.admin import AdminResponse
from app.schemas.response import StandardResponse
from app.validators.auth_validator import validate_registration_payload
from app.models.otp import OTPPurpose
from app.security.password import hash_password
from app.security.rate_limit import auth_rate_limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

def get_auth_service(
    user_repo = Depends(get_user_repo),
    admin_repo = Depends(get_admin_repo),
    refresh_repo = Depends(get_refresh_repo),
    session_repo = Depends(get_session_repo),
    audit_repo = Depends(get_audit_repo)
) -> AuthService:
    session_manager = SessionManager(session_repo)
    audit_service = AuditService(audit_repo)
    return AuthService(user_repo, admin_repo, refresh_repo, session_manager, audit_service)

def get_google_service(
    user_repo = Depends(get_user_repo),
    refresh_repo = Depends(get_refresh_repo),
    session_repo = Depends(get_session_repo)
) -> GoogleOAuthService:
    session_manager = SessionManager(session_repo)
    return GoogleOAuthService(user_repo, refresh_repo, session_manager)

def validate_password_strength(password: str) -> None:
    """
    Enforces strong password rules.
    """
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not any(c.islower() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter.")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")

@router.post("/register", response_model=StandardResponse[TokenResponse], dependencies=[Depends(auth_rate_limiter)])
async def register(
    request: RegisterRequest,
    request_obj: Request,
    service: AuthService = Depends(get_auth_service)
):
    """
    Registers a new citizen profile, validates strength rules, and returns access credentials.
    """
    validated = validate_registration_payload(request)
    ip_address = request_obj.client.host if request_obj.client else None
    user_agent = request_obj.headers.get("user-agent")
    
    tokens = await service.register_user(validated, ip_address=ip_address, user_agent=user_agent)
    return StandardResponse(
        success=True,
        message="Registration completed successfully. Verification email sent.",
        data=tokens
    )

@router.post("/login/user", response_model=StandardResponse[TokenResponse], dependencies=[Depends(auth_rate_limiter)])
async def login_user(
    request: LoginRequest,
    request_obj: Request,
    service: AuthService = Depends(get_auth_service)
):
    """
    Authenticates a citizen using email and password.
    """
    ip_address = request_obj.client.host if request_obj.client else None
    user_agent = request_obj.headers.get("user-agent")
    
    tokens = await service.login_user(request, ip_address=ip_address, user_agent=user_agent)
    return StandardResponse(
        success=True,
        message="Citizen authorization successful.",
        data=tokens
    )

@router.post("/login/admin", response_model=StandardResponse[TokenResponse], dependencies=[Depends(auth_rate_limiter)])
async def login_admin(
    request: LoginRequest,
    request_obj: Request,
    service: AuthService = Depends(get_auth_service)
):
    """
    Authenticates an administrator using email and password.
    """
    ip_address = request_obj.client.host if request_obj.client else None
    user_agent = request_obj.headers.get("user-agent")
    
    tokens = await service.login_admin(request, ip_address=ip_address, user_agent=user_agent)
    return StandardResponse(
        success=True,
        message="Administrator authorization successful.",
        data=tokens
    )

@router.post("/refresh", response_model=StandardResponse[TokenResponse])
async def refresh_tokens(
    request: RefreshTokenRequest,
    request_obj: Request,
    service: AuthService = Depends(get_auth_service)
):
    """
    Exchanges an active unexpired Refresh token for a new token pair.
    """
    ip_address = request_obj.client.host if request_obj.client else None
    user_agent = request_obj.headers.get("user-agent")
    
    tokens = await service.rotate_refresh_token(request.refresh_token, ip_address=ip_address, user_agent=user_agent)
    return StandardResponse(
        success=True,
        message="Authentication token pair successfully refreshed.",
        data=tokens
    )

@router.post("/google", response_model=StandardResponse[TokenResponse])
async def google_login(
    request: GoogleAuthRequest,
    request_obj: Request,
    service: GoogleOAuthService = Depends(get_google_service)
):
    """
    Authenticates via Google ID token. Auto-registers the user if they do not exist.
    """
    ip_address = request_obj.client.host if request_obj.client else None
    user_agent = request_obj.headers.get("user-agent")
    
    tokens = await service.authenticate_google(request.credential, ip_address=ip_address, user_agent=user_agent)
    return StandardResponse(
        success=True,
        message="Google Single-Sign-On login completed.",
        data=tokens
    )

@router.post("/otp/send", response_model=StandardResponse[None], dependencies=[Depends(auth_rate_limiter)])
async def send_otp(request: OTPRequest):
    """
    Sends a numeric verification code to the target email address using SMTP.
    """
    await otp_service.create_and_send_otp(request.email, request.purpose)
    return StandardResponse(
        success=True,
        message="Verification OTP successfully sent."
    )

@router.post("/otp/verify", response_model=StandardResponse[bool], dependencies=[Depends(auth_rate_limiter)])
async def verify_otp(
    request: OTPVerifyRequest,
    user_repo: UserRepository = Depends(get_user_repo)
):
    """
    Verifies that the OTP code matches the cache.
    """
    verified = await otp_service.verify_otp(request.email, request.code, request.purpose)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification failed: invalid or expired OTP."
        )
        
    if request.purpose == OTPPurpose.REGISTER:
        user = await user_repo.get_by_email(request.email)
        if user:
            was_verified = user.is_verified
            await user_repo.update(user, {"is_verified": True, "email_verified": True})
            if not was_verified:
                from app.services.email_service import email_service
                await email_service.send_welcome_email(user.email, user.full_name)
            
    return StandardResponse(
        success=True,
        message="OTP verified successfully.",
        data=True
    )

@router.get("/me", response_model=StandardResponse)
async def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_repo: UserRepository = Depends(get_user_repo),
    admin_repo: AdminRepository = Depends(get_admin_repo)
):
    """
    Retrieves user profile data for authenticated users (Citizen or Admin).
    """
    token = credentials.credentials
    payload = jwt_service.verify_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token."
        )
    
    sub = payload.get("sub")
    role = payload.get("role")
    
    if role in ["ADMIN", "SUPER_ADMIN"]:
        admin = await admin_repo.get_by_id(uuid.UUID(sub))
        if not admin or not admin.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Administrator not found.")
        return StandardResponse(
            success=True,
            message="Administrator profile retrieved successfully.",
            data=AdminResponse.model_validate(admin).model_dump()
        )
    else:
        user = await user_repo.get_by_id(uuid.UUID(sub))
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Citizen profile not found.")
        return StandardResponse(
            success=True,
            message="Citizen profile retrieved successfully.",
            data=UserResponse.model_validate(user).model_dump()
        )

@router.post("/logout", response_model=StandardResponse[None])
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    refresh_repo = Depends(get_refresh_repo),
    session_repo = Depends(get_session_repo)
):
    """
    Terminates session by revoking all refresh tokens.
    """
    token = credentials.credentials
    payload = jwt_service.verify_token(token)
    if payload and payload.get("type") == "access":
        sub = payload.get("sub")
        role = payload.get("role")
        session_manager = SessionManager(session_repo)
        try:
            user_uuid = uuid.UUID(sub)
            if role in ["ADMIN", "SUPER_ADMIN"]:
                await refresh_repo.revoke_all_admin_tokens(user_uuid)
                await session_manager.revoke_all_admin_sessions(user_uuid)
            else:
                await refresh_repo.revoke_all_user_tokens(user_uuid)
                await session_manager.revoke_all_user_sessions(user_uuid)
        except ValueError:
            pass
            
    return StandardResponse(
        success=True,
        message="Session successfully terminated."
    )

@router.post("/logout/all", response_model=StandardResponse[None])
async def logout_all(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    refresh_repo = Depends(get_refresh_repo),
    session_repo = Depends(get_session_repo)
):
    """
    Terminates all sessions across all devices for the authenticated user/admin.
    """
    token = credentials.credentials
    payload = jwt_service.verify_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token."
        )
        
    sub = payload.get("sub")
    role = payload.get("role")
    user_uuid = uuid.UUID(sub)
    
    session_manager = SessionManager(session_repo)
    if role in ["ADMIN", "SUPER_ADMIN"]:
        await refresh_repo.revoke_all_admin_tokens(user_uuid)
        await session_manager.revoke_all_admin_sessions(user_uuid)
    else:
        await refresh_repo.revoke_all_user_tokens(user_uuid)
        await session_manager.revoke_all_user_sessions(user_uuid)
        
    return StandardResponse(
        success=True,
        message="Successfully logged out from all devices."
    )

@router.post("/forgot-password", response_model=StandardResponse[None], dependencies=[Depends(auth_rate_limiter)])
async def forgot_password(request: PasswordResetRequest, user_repo: UserRepository = Depends(get_user_repo)):
    """
    Initiates the password reset flow.
    Prevents user enumeration by always returning success.
    """
    user = await user_repo.get_by_email(request.email)
    if user:
        await otp_service.create_and_send_otp(request.email, OTPPurpose.PASSWORD_RESET)
    
    return StandardResponse(
        success=True,
        message="Password reset verification code successfully sent."
    )

@router.post("/reset-password", response_model=StandardResponse[None], dependencies=[Depends(auth_rate_limiter)])
async def reset_password(
    request: PasswordResetConfirmRequest,
    user_repo = Depends(get_user_repo),
    refresh_repo = Depends(get_refresh_repo),
    session_repo = Depends(get_session_repo)
):
    """
    Verifies the OTP code, resets the user's password, invalidates previous sessions/tokens,
    and sends a Password Changed confirmation email.
    """
    validate_password_strength(request.new_password)
    
    verified = await otp_service.verify_otp(request.email, request.code, OTPPurpose.PASSWORD_RESET)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification failed: invalid or expired OTP."
        )
        
    user = await user_repo.get_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    hashed = hash_password(request.new_password)
    await user_repo.update(user, {"hashed_password": hashed})
    
    # Invalidate other sessions and refresh tokens on password change for safety
    await refresh_repo.revoke_all_user_tokens(user.id)
    session_manager = SessionManager(session_repo)
    await session_manager.revoke_all_user_sessions(user.id)
    
    # Send confirmation email
    from app.services.email_service import email_service
    await email_service.send_password_changed_email(user.email, user.full_name)
    
    return StandardResponse(
        success=True,
        message="Password reset successfully completed."
    )
