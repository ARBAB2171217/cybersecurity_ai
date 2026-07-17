import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.admin import AdminRole
from app.schemas.common import TimestampSchema

class AdminResponse(TimestampSchema):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: AdminRole
    is_active: bool

    model_config = {
        "from_attributes": True
    }

class AdminCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: AdminRole = Field(default=AdminRole.ADMIN)

class AdminUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[AdminRole] = None
    is_active: Optional[bool] = None
