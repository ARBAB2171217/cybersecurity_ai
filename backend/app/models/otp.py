import uuid
import enum
import datetime
from sqlalchemy import String, Boolean, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, TimestampMixin

class OTPPurpose(str, enum.Enum):
    LOGIN = "LOGIN"
    REGISTER = "REGISTER"
    PASSWORD_RESET = "PASSWORD_RESET"

class OTP(Base, TimestampMixin):
    __tablename__ = "otps"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    email: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False
    )
    code: Mapped[str] = mapped_column(
        String(10),
        nullable=False
    )
    purpose: Mapped[OTPPurpose] = mapped_column(
        Enum(OTPPurpose),
        nullable=False
    )
    expires_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    is_used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
