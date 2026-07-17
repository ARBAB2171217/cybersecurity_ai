import uuid
import enum
from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, SoftDeleteMixin

class AdminRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"

class Admin(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "admins"

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
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    role: Mapped[AdminRole] = mapped_column(
        Enum(AdminRole),
        default=AdminRole.ADMIN,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    # Relationships
    sessions = relationship("Session", back_populates="admin", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="admin", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="admin")
