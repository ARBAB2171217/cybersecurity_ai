import datetime
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.otp import OTP, OTPPurpose

class OTPRepository(BaseRepository[OTP]):
    """
    Repository class handling database interactions for the OTP model.
    """
    def __init__(self, db: AsyncSession):
        super().__init__(OTP, db)

    async def get_active_otp(self, email: str, code: str, purpose: OTPPurpose) -> Optional[OTP]:
        """
        Retrieves an active, unused, and unexpired OTP for verification.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        stmt = select(self.model).where(
            self.model.email == email,
            self.model.code == code,
            self.model.purpose == purpose,
            self.model.is_used == False,
            self.model.expires_at > now
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def invalidate_otps(self, email: str, purpose: OTPPurpose) -> None:
        """
        Invalidates all unused OTPs for a given email and purpose (e.g., when a new OTP is requested).
        """
        stmt = (
            update(self.model)
            .where(
                self.model.email == email,
                self.model.purpose == purpose,
                self.model.is_used == False
            )
            .values(is_used=True)
        )
        await self.db.execute(stmt)
        await self.db.commit()
