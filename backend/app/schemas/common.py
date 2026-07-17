from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TimestampSchema(BaseModel):
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=10, ge=1, le=100, description="Items per page")

class PageMeta(BaseModel):
    total_items: int = Field(..., description="Total number of items")
    total_pages: int = Field(..., description="Total number of pages")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Items per page")
