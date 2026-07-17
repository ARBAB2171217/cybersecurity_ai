from fastapi import APIRouter
from app.schemas.response import StandardResponse

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=StandardResponse[dict])
async def health_check():
    """
    Returns standard status checking metrics of the system.
    """
    return StandardResponse(
        success=True,
        message="System is healthy.",
        data={"status": "online"}
    )
