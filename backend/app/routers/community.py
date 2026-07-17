import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.database import get_report_repo
from app.database.session import get_async_db
from app.dependencies.auth import get_current_user
from app.routers.reports import get_current_token_payload
from app.schemas.response import StandardResponse
from app.schemas.community import (
    CommentCreateRequest, CommentResponse,
    AbuseReportCreateRequest, AbuseReportResponse,
    CommunityVerificationRequest, CommunityVerificationResponse
)
from app.schemas.report import ReportResponse
from app.repositories.community_repository import CommunityRepository
from app.repositories.report_repository import ReportRepository
from app.services.community_service import CommunityService

router = APIRouter(prefix="/community", tags=["Community"])

def get_community_service(
    db: AsyncSession = Depends(get_async_db),
    report_repo: ReportRepository = Depends(get_report_repo)
) -> CommunityService:
    community_repo = CommunityRepository(db)
    return CommunityService(community_repo, report_repo)

@router.post("/reports/{report_id}/comments", response_model=StandardResponse[CommentResponse])
async def create_comment(
    report_id: uuid.UUID,
    request: CommentCreateRequest,
    token_payload: dict = Depends(get_current_token_payload),
    service: CommunityService = Depends(get_community_service),
):
    user_id = uuid.UUID(token_payload["sub"])
    comment = await service.create_comment(report_id, user_id, request.content, request.parent_id)
    return StandardResponse(success=True, message="Comment added.", data=CommentResponse.model_validate(comment))

@router.get("/reports/{report_id}/comments", response_model=StandardResponse[List[CommentResponse]])
async def get_comments(
    report_id: uuid.UUID,
    service: CommunityService = Depends(get_community_service),
):
    comments = await service.get_comments(report_id)
    return StandardResponse(success=True, message="Comments retrieved.", data=[CommentResponse.model_validate(c) for c in comments])

@router.put("/comments/{comment_id}", response_model=StandardResponse[CommentResponse])
async def update_comment(
    comment_id: uuid.UUID,
    request: CommentCreateRequest,
    token_payload: dict = Depends(get_current_token_payload),
    service: CommunityService = Depends(get_community_service),
):
    user_id = uuid.UUID(token_payload["sub"])
    role = token_payload.get("role", "USER")
    comment = await service.update_comment(comment_id, user_id, role, request.content)
    return StandardResponse(success=True, message="Comment updated.", data=CommentResponse.model_validate(comment))

@router.delete("/comments/{comment_id}", response_model=StandardResponse[None])
async def delete_comment(
    comment_id: uuid.UUID,
    token_payload: dict = Depends(get_current_token_payload),
    service: CommunityService = Depends(get_community_service),
):
    user_id = uuid.UUID(token_payload["sub"])
    role = token_payload.get("role", "USER")
    await service.delete_comment(comment_id, user_id, role)
    return StandardResponse(success=True, message="Comment deleted.", data=None)

@router.post("/reports/{report_id}/likes", response_model=StandardResponse[dict])
async def toggle_like(
    report_id: uuid.UUID,
    token_payload: dict = Depends(get_current_token_payload),
    service: CommunityService = Depends(get_community_service),
):
    user_id = uuid.UUID(token_payload["sub"])
    result = await service.toggle_like(report_id, user_id)
    return StandardResponse(success=True, message="Like toggled.", data=result)

@router.post("/reports/{report_id}/bookmarks", response_model=StandardResponse[dict])
async def toggle_bookmark(
    report_id: uuid.UUID,
    token_payload: dict = Depends(get_current_token_payload),
    service: CommunityService = Depends(get_community_service),
):
    user_id = uuid.UUID(token_payload["sub"])
    result = await service.toggle_bookmark(report_id, user_id)
    return StandardResponse(success=True, message="Bookmark toggled.", data=result)

@router.get("/bookmarks", response_model=StandardResponse[List[ReportResponse]])
async def get_bookmarks(
    token_payload: dict = Depends(get_current_token_payload),
    service: CommunityService = Depends(get_community_service),
):
    user_id = uuid.UUID(token_payload["sub"])
    reports = await service.get_bookmarked_reports(user_id)
    return StandardResponse(success=True, message="Bookmarks retrieved.", data=[ReportResponse.model_validate(r) for r in reports])

@router.post("/reports/{report_id}/abuse", response_model=StandardResponse[AbuseReportResponse])
async def report_abuse(
    report_id: uuid.UUID,
    request: AbuseReportCreateRequest,
    token_payload: dict = Depends(get_current_token_payload),
    service: CommunityService = Depends(get_community_service),
):
    user_id = uuid.UUID(token_payload["sub"])
    abuse = await service.create_abuse_report(report_id, user_id, request.reason, request.details)
    return StandardResponse(success=True, message="Abuse reported.", data=AbuseReportResponse.model_validate(abuse))

@router.post("/reports/{report_id}/verify", response_model=StandardResponse[CommunityVerificationResponse])
async def verify_report(
    report_id: uuid.UUID,
    request: CommunityVerificationRequest,
    token_payload: dict = Depends(get_current_token_payload),
    service: CommunityService = Depends(get_community_service),
):
    user_id = uuid.UUID(token_payload["sub"])
    ver = await service.create_verification(report_id, user_id, request.verdict)
    return StandardResponse(success=True, message="Verification submitted.", data=CommunityVerificationResponse.model_validate(ver))
