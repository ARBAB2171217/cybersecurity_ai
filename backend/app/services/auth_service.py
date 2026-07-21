import uuid
import datetime
from typing import Optional
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.repositories.admin_repository import AdminRepository
from app.repositories.refresh_repository import RefreshRepository
from app.security.password import hash_password, verify_password
from app.services.jwt_service import jwt_service
from app.services.redis_service import redis_service
from app.services.otp_service import otp_service
from app.services.session_manager import SessionManager
from app.models.otp import OTPPurpose
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

from app.services.audit_service import AuditService

class AuthService:
    """
    Business service orchestrating identity verification, credential checks,
    token rotations, session tracking, and brute force lockout mitigation.
    """
    def __init__(
        self,
        user_repo: UserRepository,
        admin_repo: AdminRepository,
        refresh_repo: RefreshRepository,
        session_manager: SessionManager,
        audit_service: AuditService
    ):
        self.user_repo = user_repo
        self.admin_repo = admin_repo
        self.refresh_repo = refresh_repo
        self.session_manager = session_manager
        self.audit_service = audit_service

    async def register_user(
        self,
        request: RegisterRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TokenResponse:
        # Check if email is already registered
        email = request.email.strip().lower()
        existing = await self.user_repo.get_by_email(email)
        if existing:
            # Prevent enumeration by returning success without giving access
            return
            
        hashed = hash_password(request.password)
        user_data = {
            "email": email,
            "hashed_password": hashed,
            "full_name": request.full_name,
            "is_active": True,
            "is_verified": False
        }
        
        user = await self.user_repo.create(user_data)
        # Trigger registration OTP verification email immediately
        await otp_service.create_and_send_otp(user.email, OTPPurpose.REGISTER)
        
        await self.audit_service.log_action(
            action="USER_REGISTERED",
            user_id=user.id,
            ip_address=ip_address,
            details={"email": email, "user_agent": user_agent}
        )
        
        return None

    async def login_user(
        self,
        request: LoginRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TokenResponse:
        email = request.email.strip().lower()
        lockout_key = f"lockout:{email}"
        attempts_key = f"login_attempts:{email}"

        # Check if locked out
        is_locked = await redis_service.get(lockout_key)
        if is_locked:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="This account has been temporarily locked out due to multiple failed login attempts. Please try again in 15 minutes."
            )

        user = await self.user_repo.get_by_email(email)
        if not user or not user.hashed_password or not verify_password(request.password, user.hashed_password):
            # Increment failed attempts
            attempts_str = await redis_service.get(attempts_key)
            attempts = int(attempts_str) if attempts_str else 0
            attempts += 1
            if attempts >= 5:
                await redis_service.set(lockout_key, "1", expire_seconds=900)  # 15 minutes lockout
                await redis_service.delete(attempts_key)
                await self.user_repo.update(user, {"failed_login_attempts": attempts})
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Too many failed login attempts. This account has been locked for 15 minutes."
                )
            else:
                await redis_service.set(attempts_key, attempts, expire_seconds=900)
                await self.user_repo.update(user, {"failed_login_attempts": attempts})
                await self.audit_service.log_action(
                    action="FAILED_LOGIN",
                    user_id=user.id,
                    ip_address=ip_address,
                    details={"email": email, "user_agent": user_agent, "attempts": attempts}
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password."
                )

        # Reset failed attempts on successful login
        await redis_service.delete(attempts_key)
        await self.user_repo.update(user, {"failed_login_attempts": 0})

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated."
            )

        if not user.is_verified:
            # Send OTP and prompt user to verify
            await otp_service.create_and_send_otp(user.email, OTPPurpose.REGISTER)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. A verification code has been sent to your email."
            )

        # 1. Device Recognition & Security Notifications
        is_new_device = user.last_device is not None and user.last_device != user_agent
        
        if is_new_device:
            from app.services.email_service import email_service
            await email_service.send_unknown_device_email(user.email, user.full_name, str(user_agent), str(ip_address))
            
            # Require OTP for unknown devices
            await otp_service.create_and_send_otp(user.email, OTPPurpose.LOGIN)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Login from a new device detected. A verification code has been sent to your email."
            )

        # Update last_login
        now = datetime.datetime.now(datetime.timezone.utc)
        await self.user_repo.update(user, {"last_login": now, "last_device": user_agent})

        token_pair = jwt_service.generate_token_pair(str(user.id), "USER")
        
        # Revoke old user refresh tokens & sessions to prevent session hijacking
        await self.refresh_repo.revoke_all_user_tokens(user.id)
        await self.session_manager.revoke_all_user_sessions(user.id)
        
        # Save new refresh token
        refresh_token_data = {
            "user_id": user.id,
            "token": token_pair.refresh_token,
            "expires_at": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        }
        await self.refresh_repo.create(refresh_token_data)
        
        # Save new session
        await self.session_manager.create_session(
            token=token_pair.refresh_token,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        await self.audit_service.log_action(
            action="USER_LOGIN_SUCCESS",
            user_id=user.id,
            ip_address=ip_address,
            details={"email": email, "user_agent": user_agent}
        )
        
        return token_pair

    async def login_admin(
        self,
        request: LoginRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TokenResponse:
        email = request.email.strip().lower()
        lockout_key = f"lockout_admin:{email}"
        attempts_key = f"login_attempts_admin:{email}"

        # Check if locked out
        is_locked = await redis_service.get(lockout_key)
        if is_locked:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="This administrator account is locked out. Please wait 15 minutes."
            )

        admin = await self.admin_repo.get_by_email(email)
        if not admin or not verify_password(request.password, admin.hashed_password):
            # Increment failed attempts
            attempts_str = await redis_service.get(attempts_key)
            attempts = int(attempts_str) if attempts_str else 0
            attempts += 1
            if attempts >= 5:
                await redis_service.set(lockout_key, "1", expire_seconds=900)
                await redis_service.delete(attempts_key)
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Too many failed login attempts. Admin account locked for 15 minutes."
                )
            else:
                await redis_service.set(attempts_key, attempts, expire_seconds=900)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password."
                )

        # Reset failed attempts on success
        await redis_service.delete(attempts_key)

        if not admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account is deactivated."
            )

        token_pair = jwt_service.generate_token_pair(str(admin.id), admin.role.value)
        
        # Revoke old admin tokens & sessions
        await self.refresh_repo.revoke_all_admin_tokens(admin.id)
        await self.session_manager.revoke_all_admin_sessions(admin.id)
        
        # Save new refresh token
        refresh_token_data = {
            "admin_id": admin.id,
            "token": token_pair.refresh_token,
            "expires_at": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        }
        await self.refresh_repo.create(refresh_token_data)
        
        # Save session
        await self.session_manager.create_session(
            token=token_pair.refresh_token,
            admin_id=admin.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        await self.audit_service.log_action(
            action="ADMIN_LOGIN_SUCCESS",
            admin_id=admin.id,
            ip_address=ip_address,
            details={"email": email, "user_agent": user_agent}
        )
        
        return token_pair

    async def rotate_refresh_token(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TokenResponse:
        # Retrieve the token (even if revoked)
        token_obj = await self.refresh_repo.get_any_by_token(refresh_token)
        if not token_obj:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Invalid refresh token."
            )
            
        # Token Replay Detection
        if token_obj.revoked_at is not None:
            # Token was already used/revoked, but someone is trying to use it again.
            # Revoke all sessions for this user as they might be compromised.
            if token_obj.user_id:
                await self.refresh_repo.revoke_all_user_tokens(token_obj.user_id)
                await self.session_manager.revoke_all_user_sessions(token_obj.user_id)
            elif token_obj.admin_id:
                await self.refresh_repo.revoke_all_admin_tokens(token_obj.admin_id)
                await self.session_manager.revoke_all_admin_sessions(token_obj.admin_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token reuse detected. All sessions revoked for security."
            )
            
        # Check if expired
        now = datetime.datetime.now(datetime.timezone.utc)
        expires_at = token_obj.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=datetime.timezone.utc)
            
        if expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Expired refresh token."
            )
            
        # Revoke current token & session
        await self.refresh_repo.revoke_token(refresh_token)
        await self.session_manager.revoke_session(refresh_token)
        
        # Generate new token pairs
        if token_obj.user_id:
            await self.audit_service.log_action(
                action="TOKEN_REFRESH",
                user_id=token_obj.user_id,
                ip_address=ip_address,
                details={"user_agent": user_agent}
            )
            token_pair = jwt_service.generate_token_pair(str(token_obj.user_id), "USER")
            refresh_token_data = {
                "user_id": token_obj.user_id,
                "token": token_pair.refresh_token,
                "expires_at": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
            }
            await self.session_manager.create_session(
                token=token_pair.refresh_token,
                user_id=token_obj.user_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
        else:
            admin = await self.admin_repo.get_by_id(token_obj.admin_id)
            if not admin:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Admin owner not found."
                )
            token_pair = jwt_service.generate_token_pair(str(token_obj.admin_id), admin.role.value)
            refresh_token_data = {
                "admin_id": token_obj.admin_id,
                "token": token_pair.refresh_token,
                "expires_at": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
            }
            await self.session_manager.create_session(
                token=token_pair.refresh_token,
                admin_id=token_obj.admin_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
        await self.refresh_repo.create(refresh_token_data)
        return token_pair

    async def logout(self, refresh_token: str, ip_address: Optional[str] = None) -> None:
        token_obj = await self.refresh_repo.get_any_by_token(refresh_token)
        if token_obj:
            await self.audit_service.log_action(
                action="LOGOUT",
                user_id=token_obj.user_id,
                admin_id=token_obj.admin_id,
                ip_address=ip_address
            )
        await self.refresh_repo.revoke_token(refresh_token)
        await self.session_manager.revoke_session(refresh_token)
