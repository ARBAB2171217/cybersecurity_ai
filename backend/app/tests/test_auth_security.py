import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from app.services.otp_service import otp_service
from app.models.otp import OTPPurpose
from app.routers.auth import validate_password_strength
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest

@pytest.mark.asyncio
async def test_otp_attempt_limits():
    email = "test_otp_limits@example.com"
    purpose = OTPPurpose.PASSWORD_RESET
    
    # Pre-populate OTP and fake attempts count to 5
    await otp_service.redis.set(f"otp:{purpose.value}:{email}", "123456", expire_seconds=60)
    await otp_service.redis.set(f"otp_attempts:{purpose.value}:{email}", 5, expire_seconds=60)
    
    # The 6th verification call should raise HTTPException due to too many attempts
    with pytest.raises(HTTPException) as exc_info:
        await otp_service.verify_otp(email, "000000", purpose)
    
    assert exc_info.value.status_code == 400
    assert "Too many failed verification attempts" in exc_info.value.detail
    
    # Verify the OTP key has been deleted
    cached_otp = await otp_service.redis.get(f"otp:{purpose.value}:{email}")
    assert cached_otp is None

@pytest.mark.asyncio
async def test_otp_resend_cooldown():
    email = "test_cooldown@example.com"
    purpose = OTPPurpose.REGISTER
    
    # Trigger first send
    await otp_service.create_and_send_otp(email, purpose)
    
    # Trying to send again immediately should raise 429 too many requests due to cooldown
    with pytest.raises(HTTPException) as exc_info:
        await otp_service.create_and_send_otp(email, purpose)
        
    assert exc_info.value.status_code == 429
    assert "Please wait 60 seconds" in exc_info.value.detail

@pytest.mark.asyncio
async def test_brute_force_lockout():
    # Setup mocks
    mock_user_repo = MagicMock()
    mock_user_repo.get_by_email = AsyncMock(return_value=None)  # triggers failure
    mock_admin_repo = MagicMock()
    mock_refresh_repo = MagicMock()
    mock_session_manager = MagicMock()
    
    auth_service = AuthService(mock_user_repo, mock_admin_repo, mock_refresh_repo, mock_session_manager)
    
    email = "lockout_victim@example.com"
    login_req = LoginRequest(email=email, password="Password123!")
    
    # Perform 4 failed logins (should raise 401 unauthorized)
    for _ in range(4):
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login_user(login_req)
        assert exc_info.value.status_code == 401
        
    # The 5th failed login should lock the account and raise 423 Locked
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.login_user(login_req)
    assert exc_info.value.status_code == 423
    assert "locked for 15 minutes" in exc_info.value.detail
    
    # Subsequent calls should immediately raise 423
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.login_user(login_req)
    assert exc_info.value.status_code == 423

def test_password_strength_validation():
    # Weak: short
    with pytest.raises(HTTPException) as exc:
        validate_password_strength("Ab1!")
    assert "at least 8 characters" in exc.value.detail
    
    # Weak: no number
    with pytest.raises(HTTPException) as exc:
        validate_password_strength("Abcdefgh!")
    assert "contain at least one number" in exc.value.detail

    # Weak: no uppercase
    with pytest.raises(HTTPException) as exc:
        validate_password_strength("abcdefgh1!")
    assert "at least one uppercase letter" in exc.value.detail

    # Weak: no lowercase
    with pytest.raises(HTTPException) as exc:
        validate_password_strength("ABCDEFGH1!")
    assert "at least one lowercase letter" in exc.value.detail

    # Strong: valid
    validate_password_strength("StrongPassword123!")
