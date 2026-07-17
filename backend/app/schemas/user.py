import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.common import TimestampSchema

class UserResponse(TimestampSchema):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    is_active: bool
    is_verified: bool
    avatar: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100, validation_alias="fullName")
    avatar: Optional[str] = Field(None, max_length=512)

class UserSecurityUpdateRequest(BaseModel):
    current_password: str = Field(..., min_length=8, max_length=128, validation_alias="currentPassword")
    new_password: str = Field(..., min_length=8, max_length=128, validation_alias="newPassword")

class UserStatusUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
