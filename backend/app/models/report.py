import uuid
import enum
from sqlalchemy import String, Integer, Boolean, Float, JSON, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, SoftDeleteMixin

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    APPROVED = "APPROVED"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class ReportPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class ReportVisibility(str, enum.Enum):
    PRIVATE = "PRIVATE"
    PUBLIC = "PUBLIC"
    ANONYMOUS = "ANONYMOUS"

class Report(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    category: Mapped[str] = mapped_column(
        String,
        default="Counterfeit Currency",
        nullable=False,
        index=True
    )
    title: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
    description: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
    incident_date: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
    incident_time: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
    location: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
    priority: Mapped[ReportPriority | None] = mapped_column(
        String,
        nullable=True,
        index=True
    )
    evidence: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True
    )
    visibility: Mapped[str] = mapped_column(
        String,
        default=ReportVisibility.PRIVATE.value,
        nullable=False,
        index=True
    )
    
    # Community & Readiness Fields
    likes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comments_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bookmarks_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verification_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    trending_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    # Original Fields
    denomination: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True
    )
    serial_number: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    image_url: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True
    )
    is_counterfeit: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
        index=True
    )
    confidence_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        String,
        default=ReportStatus.PENDING.value,
        nullable=False,
        index=True
    )
    ocr_text: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
    raw_ai_response: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )

    # Classification Routing Fields
    evidence_type: Mapped[str] = mapped_column(
        String,
        default="Unknown",
        nullable=False,
        index=True
    )
    classification_confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )
    selected_pipeline: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
    
    # Universal Scanner Fields
    detected_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True
    )
    pipeline_used: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
    processing_time: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    # Relationships
    user = relationship("User", back_populates="reports")
