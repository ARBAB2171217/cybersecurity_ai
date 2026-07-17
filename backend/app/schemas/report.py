import uuid
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel
from app.models.report import ReportStatus, ReportPriority, ReportVisibility
from app.schemas.common import TimestampSchema


class ReportResponse(TimestampSchema):
    """
    Pydantic response schema matching Report database model fields.
    Uses camelCase aliases so the frontend receives camelCase JSON
    (e.g., serialNumber, imageUrl, isCounterfeit, confidenceScore, createdAt).
    """
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    category: str = "Counterfeit Currency"
    title: Optional[str] = None
    description: Optional[str] = None
    incident_date: Optional[str] = None
    incident_time: Optional[str] = None
    location: Optional[str] = None
    priority: Optional[ReportPriority] = None
    evidence: Optional[list] = None
    visibility: str
    
    # Community & Readiness Fields
    likes_count: int
    comments_count: int
    bookmarks_count: int
    views_count: int
    verification_count: int
    trending_score: float
    
    denomination: Optional[int] = None
    serial_number: Optional[str] = None
    image_url: Optional[str] = None
    is_counterfeit: Optional[bool] = None
    confidence_score: Optional[float] = None
    status: str
    ocr_text: Optional[str] = None
    raw_ai_response: Optional[Dict[str, Any]] = None
    
    # Classification Routing Fields
    evidence_type: str = "Unknown"
    classification_confidence: Optional[float] = None
    selected_pipeline: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


class ReportStatusUpdateRequest(BaseModel):
    status: str
    is_counterfeit: Optional[bool] = None

class ReportVisibilityUpdateRequest(BaseModel):
    visibility: str

class ReportCreateRequest(BaseModel):
    category: str
    title: str
    description: str
    incident_date: Optional[str] = None
    incident_time: Optional[str] = None
    location: Optional[str] = None
    priority: Optional[ReportPriority] = None
    evidence: Optional[list] = None
    visibility: Optional[str] = None

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
