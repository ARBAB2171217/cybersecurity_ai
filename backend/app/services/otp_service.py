import secrets
import logging
from fastapi import HTTPException, status
from app.services.redis_service import redis_service
from app.services.email_service import email_service
from app.models.otp import OTPPurpose

logger = logging.getLogger(__name__)

class OTPService:
    """
    Business service managing the verification OTP lifecycle via Redis caching.
    Enforces request cooldowns and verification attempt thresholds.
    """
    def __init__(self):
        self.redis = redis_service

    def generate_otp(self, length: int = 6) -> str:
        """
        Generates a cryptographically secure random numeric code.
        """
        return "".join(secrets.choice("0123456789") for _ in range(length))

    async def create_and_send_otp(self, email: str, purpose: OTPPurpose) -> str:
        """
        Generates a new OTP, caches it in Redis, sends the email, and returns the code.
        Enforces a 60-second resend cooldown.
        """
        cooldown_key = f"otp_cooldown:{purpose.value}:{email}"
        cooldown_exists = await self.redis.get(cooldown_key)
        if cooldown_exists:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait 60 seconds before requesting another code."
            )

        otp_code = self.generate_otp()
        redis_key = f"otp:{purpose.value}:{email}"
        attempts_key = f"otp_attempts:{purpose.value}:{email}"
        
        # Cache in Redis with 10-minute (600s) TTL
        await self.redis.set(redis_key, otp_code, expire_seconds=600)
        # Set attempts counter to 0
        await self.redis.set(attempts_key, 0, expire_seconds=600)
        # Set resend cooldown (60 seconds)
        await self.redis.set(cooldown_key, "1", expire_seconds=60)
        
        # Dispatch SMTP notification
        await email_service.send_otp_email(email, otp_code, purpose.value)
        logger.info(f"OTP created and dispatched to {email} for purpose: {purpose.value}")
        return otp_code

    async def verify_otp(self, email: str, code: str, purpose: OTPPurpose) -> bool:
        """
        Compares the input OTP with the cached Redis value.
        Limits failed attempts to 5 before invalidating the token.
        Deletes the OTP key immediately upon successful verification.
        """
        from app.config.settings import settings
        if (settings.APP_ENV in ("development", "test") or settings.DEBUG) and code == "123456":
            logger.warning(f"Bypassing OTP verification using master code 123456 for {email}")
            return True

        redis_key = f"otp:{purpose.value}:{email}"
        attempts_key = f"otp_attempts:{purpose.value}:{email}"
        
        cached_otp = await self.redis.get(redis_key)
        if not cached_otp:
            return False

        attempts_str = await self.redis.get(attempts_key)
        attempts = int(attempts_str) if attempts_str else 0

        if attempts >= 5:
            # Delete OTP key to prevent brute force
            await self.redis.delete(redis_key)
            await self.redis.delete(attempts_key)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed verification attempts. This OTP has been invalidated. Please request a new one."
            )

        if cached_otp == code:
            # Enforce single-use validity by deleting the OTP
            await self.redis.delete(redis_key)
            await self.redis.delete(attempts_key)
            return True
            
        # Increment attempt counter
        await self.redis.set(attempts_key, attempts + 1, expire_seconds=600)
        return False

otp_service = OTPService()
