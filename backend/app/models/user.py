import uuid
import datetime
from sqlalchemy import String, Boolean, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, SoftDeleteMixin

class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    google_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True
    )
    avatar: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True
    )
    provider: Mapped[str] = mapped_column(
        String(50),
        default="local",
        nullable=False
    )
    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    last_login: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    last_device: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer,
        server_default="0",
        nullable=False
    )
    otp_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    otp_expiry: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
