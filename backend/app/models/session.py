import uuid
import datetime
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    admin_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    token: Mapped[str] = mapped_column(
        String(512),
        index=True,
        nullable=False
    )
    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True
    )
    user_agent: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True
    )
    expires_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.datetime.utcnow,
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="sessions")
    admin = relationship("Admin", back_populates="sessions")
