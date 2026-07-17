from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_async_db
from app.dependencies.permissions import require_admin_or_super
from app.dependencies.auth import get_current_user
from app.services.analytics_service import AnalyticsService
from app.schemas.response import StandardResponse
from app.models.admin import Admin
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_analytics_service(db: AsyncSession = Depends(get_async_db)) -> AnalyticsService:
    return AnalyticsService(db)


@router.get("/dashboard", response_model=StandardResponse[dict])
async def get_dashboard_analytics(
    current_admin: Admin = Depends(require_admin_or_super),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """Returns high-level currency note scan and counterfeit analytics (Admin only)."""
    stats = await service.get_dashboard_summary()
    return StandardResponse(
        success=True,
        message="Dashboard statistics compiled.",
        data=stats,
    )


@router.get("/me", response_model=StandardResponse[dict])
async def get_user_analytics(
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """
    Returns scan statistics for the currently authenticated citizen.
    Used by the user dashboard to populate stats cards and charts.
    """
    stats = await service.get_user_summary(user_id=current_user.id)
    return StandardResponse(
        success=True,
        message="User analytics compiled.",
        data=stats,
    )
