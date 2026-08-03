from pydantic import BaseModel
from typing import Generic, TypeVar, Optional
T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Request processed successfully"
    data: Optional[T] = None

unified_response = {"classification": {}, "report_id": "123"}
resp = StandardResponse(success=True, data=unified_response)
print(resp.model_dump())
