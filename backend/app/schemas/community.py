import uuid
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from app.schemas.common import TimestampSchema
from app.models.community import AbuseReason, CommunityVerdict

class CommentCreateRequest(BaseModel):
    content: str
    parent_id: Optional[uuid.UUID] = None

class CommentResponse(TimestampSchema):
    id: uuid.UUID
    report_id: uuid.UUID
    user_id: uuid.UUID
    content: str
    parent_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

class LikeResponse(TimestampSchema):
    id: uuid.UUID
    report_id: uuid.UUID
    user_id: uuid.UUID

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

class BookmarkResponse(TimestampSchema):
    id: uuid.UUID
    report_id: uuid.UUID
    user_id: uuid.UUID

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

class AbuseReportCreateRequest(BaseModel):
    reason: AbuseReason
    details: Optional[str] = None

class AbuseReportResponse(TimestampSchema):
    id: uuid.UUID
    report_id: uuid.UUID
    user_id: uuid.UUID
    reason: AbuseReason
    details: Optional[str] = None
    resolved: bool

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

class CommunityVerificationRequest(BaseModel):
    verdict: CommunityVerdict

class CommunityVerificationResponse(TimestampSchema):
    id: uuid.UUID
    report_id: uuid.UUID
    user_id: uuid.UUID
    verdict: CommunityVerdict

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)
