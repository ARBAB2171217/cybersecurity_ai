from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel
from app.schemas.common import PageMeta

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Request processed successfully"
    data: Optional[T] = None

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Request processed successfully"
    data: List[T]
    meta: PageMeta
