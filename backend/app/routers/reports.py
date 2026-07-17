import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from app.dependencies.database import get_report_repo
from app.dependencies.pagination import get_pagination_params
from app.services.report_service import ReportService
from app.services.jwt_service import jwt_service
from app.schemas.response import StandardResponse
from app.schemas.common import PaginationParams
from app.schemas.report import ReportResponse, ReportStatusUpdateRequest, ReportCreateRequest, ReportVisibilityUpdateRequest
from app.models.report import ReportStatus, ReportPriority, ReportVisibility
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/reports", tags=["Reports"])
security = HTTPBearer()


def get_report_service(report_repo=Depends(get_report_repo)) -> ReportService:
    return ReportService(report_repo)


async def get_current_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Decodes the Bearer token and returns the claims dict."""
    token = credentials.credentials
    payload = jwt_service.verify_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


@router.get("", response_model=StandardResponse[dict])
async def list_reports(
    status_val: Optional[str] = None,
    is_counterfeit: Optional[bool] = None,
    denomination: Optional[int] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    visibility: Optional[str] = None,
    qr_type: Optional[str] = None,
    threat_level: Optional[str] = None,
    risk_score: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "recent",
    pagination: PaginationParams = Depends(get_pagination_params),
    token_payload: dict = Depends(get_current_token_payload),
    service: ReportService = Depends(get_report_service),
):
    """
    Lists paginated scan reports with optional filters.
    Citizens are restricted to their own entries.
    Returns the shape the frontend expects:
    { reports: [...], total: int, page: int, pages: int }
    """
    role = token_payload.get("role")
    sub = token_payload.get("sub")

    user_id_filter = None
    if role not in ["ADMIN", "SUPER_ADMIN"]:
        # If community feed (public/anonymous), don't filter by user, but restrict visibility
        if visibility in ["PUBLIC", "ANONYMOUS"]:
            pass # Anyone can view these
        else:
            # Force user_id filter for PRIVATE reports or personal dashboard
            user_id_filter = uuid.UUID(sub)

    reports, total = await service.list_reports(
        user_id=user_id_filter,
        status_val=status_val,
        is_counterfeit=is_counterfeit,
        denomination=denomination,
        category=category,
        priority=priority,
        visibility=visibility,
        qr_type=qr_type,
        threat_level=threat_level,
        risk_score=risk_score,
        search=search,
        sort_by=sort_by,
        page=pagination.page,
        size=pagination.size,
    )

    total_pages = max(1, (total + pagination.size - 1) // pagination.size)

    # Anonymize if needed
    cleaned_reports = []
    for r in reports:
        if r.visibility == "ANONYMOUS" and role not in ["ADMIN", "SUPER_ADMIN"] and str(r.user_id) != sub:
            r.user_id = None
        
        # Hide private reports from non-owners in case they somehow made it here (safety check)
        if r.visibility == "PRIVATE" and role not in ["ADMIN", "SUPER_ADMIN"] and str(r.user_id) != sub:
            continue
            
        cleaned_reports.append(ReportResponse.model_validate(r))

    # Return a flat dict inside StandardResponse — shape mirrors frontend PaginatedReports type
    return StandardResponse(
        success=True,
        message="Scan reports listed successfully.",
        data={
            "reports": cleaned_reports,
            "total": total,
            "page": pagination.page,
            "pages": total_pages,
        },
    )

@router.post("", response_model=StandardResponse[ReportResponse])
async def create_manual_report(
    request: ReportCreateRequest,
    token_payload: dict = Depends(get_current_token_payload),
    service: ReportService = Depends(get_report_service),
):
    """Creates a new generic cyber crime report."""
    sub = token_payload.get("sub")
    user_id = uuid.UUID(sub) if sub else None

    report = await service.create_manual_report(
        user_id=user_id,
        category=request.category,
        title=request.title,
        description=request.description,
        incident_date=request.incident_date,
        incident_time=request.incident_time,
        location=request.location,
        priority=request.priority,
        evidence=request.evidence,
        visibility=request.visibility or "PRIVATE",
    )
    
    return StandardResponse(
        success=True,
        message="Cyber crime report submitted successfully.",
        data=ReportResponse.model_validate(report),
    )


@router.get("/{report_id}", response_model=StandardResponse[ReportResponse])
async def get_report(
    report_id: uuid.UUID,
    token_payload: dict = Depends(get_current_token_payload),
    service: ReportService = Depends(get_report_service),
):
    """Retrieves details of a report by its UUID, enforcing ownership verification."""
    role = token_payload.get("role")
    sub = token_payload.get("sub")

    report = await service.get_report_by_id(report_id)

    if role not in ["ADMIN", "SUPER_ADMIN"]:
        if report.visibility == "PRIVATE":
            if not report.user_id or str(report.user_id) != sub:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: you do not own this report.",
                )
        elif report.visibility == "ANONYMOUS":
            if not report.user_id or str(report.user_id) != sub:
                report.user_id = None

    # Track view
    report.views_count += 1
    await service.report_repo.db.commit()

    return StandardResponse(
        success=True,
        message="Report retrieved successfully.",
        data=ReportResponse.model_validate(report),
    )


@router.delete("/{report_id}", response_model=StandardResponse[None])
async def delete_report(
    report_id: uuid.UUID,
    token_payload: dict = Depends(get_current_token_payload),
    service: ReportService = Depends(get_report_service),
):
    """
    Soft-deletes a report. Citizens can only delete their own reports.
    Admins can delete any report.
    """
    role = token_payload.get("role")
    sub = token_payload.get("sub")

    report = await service.get_report_by_id(report_id)

    if role not in ["ADMIN", "SUPER_ADMIN"]:
        if not report.user_id or str(report.user_id) != sub:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not own this report.",
            )

    await service.delete_report(report_id)
    return StandardResponse(success=True, message="Report deleted successfully.")


@router.put("/{report_id}/status", response_model=StandardResponse[ReportResponse])
async def update_report_status(
    report_id: uuid.UUID,
    request: ReportStatusUpdateRequest,
    token_payload: dict = Depends(get_current_token_payload),
    service: ReportService = Depends(get_report_service),
):
    """Updates the status or correctness of a report (Admin only)."""
    role = token_payload.get("role")
    if role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative credentials required.",
        )

    updated = await service.update_report_status(
        report_id=report_id,
        status_val=request.status,
        is_counterfeit=request.is_counterfeit,
    )
    return StandardResponse(
        success=True,
        message="Report status updated successfully.",
        data=ReportResponse.model_validate(updated),
    )

@router.put("/{report_id}/visibility", response_model=StandardResponse[ReportResponse])
async def update_report_visibility(
    report_id: uuid.UUID,
    request: ReportVisibilityUpdateRequest,
    token_payload: dict = Depends(get_current_token_payload),
    service: ReportService = Depends(get_report_service),
):
    """Updates the visibility of a report (Owner or Admin)."""
    role = token_payload.get("role")
    sub = token_payload.get("sub")
    
    report = await service.get_report_by_id(report_id)

    if role not in ["ADMIN", "SUPER_ADMIN"]:
        if not report.user_id or str(report.user_id) != sub:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only the owner can change report visibility.",
            )

    updated = await service.update_report_visibility(
        report_id=report_id,
        visibility=request.visibility,
    )
    return StandardResponse(
        success=True,
        message="Report visibility updated successfully.",
        data=ReportResponse.model_validate(updated),
    )

@router.get("/{report_id}/related", response_model=StandardResponse[list[ReportResponse]])
async def get_related_reports(
    report_id: uuid.UUID,
    service: ReportService = Depends(get_report_service),
):
    """Retrieves similar public reports based on category."""
    report = await service.get_report_by_id(report_id)
    
    related, _ = await service.list_reports(
        category=report.category,
        visibility="PUBLIC",
        exclude_report_id=report_id,
        sort_by="popular",
        page=1,
        size=5
    )
    
    return StandardResponse(
        success=True,
        message="Related reports retrieved successfully.",
        data=[ReportResponse.model_validate(r) for r in related],
    )
