import os
import logging
import uuid as _uuid
from typing import Optional

from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status

from app.dependencies.database import get_report_repo
from app.dependencies.auth import get_current_user
from app.validators.image_validator import get_validated_upload_file
from app.validators.report_validator import validate_report_payload
from app.services.report_service import ReportService
from app.services.upload_service import upload_service
from app.services.ai_detection_service import AIDetectionService
from pydantic import BaseModel
from app.schemas.response import StandardResponse
from app.schemas.report import ReportResponse
from app.models.user import User
from app.models.admin import Admin

logger = logging.getLogger("app.routers.detection")

router = APIRouter(prefix="/detection", tags=["Detection"])

_media_upload_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../media/uploads")
)


def get_report_service(report_repo=Depends(get_report_repo)) -> ReportService:
    return ReportService(report_repo)


def get_ai_detection_service(report_repo=Depends(get_report_repo)) -> AIDetectionService:
    return AIDetectionService(report_repo)





@router.get("/{report_id}", response_model=StandardResponse[ReportResponse])
async def get_detection_result(
    report_id: str,
    report_service: ReportService = Depends(get_report_service),
    current_user: User = Depends(get_current_user),
):
    """
    Fetches a completed detection result by its report UUID.
    Citizens can only access their own reports; Admins can access all.
    """
    try:
        rid = _uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid report ID format. Expected a UUID.",
        )

    report = await report_service.get_report_by_id(rid)

    if not isinstance(current_user, Admin):
        if report.user_id is None or str(report.user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not own this report.",
            )

    return StandardResponse(
        success=True,
        message="Detection result retrieved.",
        data=ReportResponse.model_validate(report),
    )


class URLResolveRequest(BaseModel):
    url: str


class RedirectChainStep(BaseModel):
    url: str
    status_code: int
    hostname: str
    server: str
    content_type: str


class RedirectResolveResponse(BaseModel):
    original_url: str
    final_url: str
    total_redirects: int
    redirect_chain: list[RedirectChainStep]
    status_code: int
    error: Optional[str] = None
    https_enabled: bool
    port: str
    server: str
    content_type: str


@router.post("/resolve-url", response_model=StandardResponse[RedirectResolveResponse])
async def resolve_url_redirects(
    payload: URLResolveRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Programmatically resolves all redirects for a URL, tracing the chain
    and validating safety characteristics (timeouts, loops).
    """
    from app.services.redirect_resolver import RedirectResolverService
    
    result = await RedirectResolverService.resolve_url(payload.url)
    
    return StandardResponse(
        success=True,
        message="Redirect chain resolved successfully.",
        data=RedirectResolveResponse(**result)
    )


class URLAnalyzeRequest(BaseModel):
    originalUrl: str
    finalUrl: str


class URLAnalyzeResponse(BaseModel):
    original_url: str
    final_url: str
    website_category: str
    final_risk_score: int
    final_threat_level: str
    cyber_threat: str
    privacy_risk: str
    financial_risk: str
    download_risk: str
    forensics: Optional[dict] = None
    threat_intel: dict
    triggered_rules: list[str]
    evidence_collected: list[str]
    recommendations: list[str]
    processing_time: float
    ai_available: bool
    ai_summary: str
    ai_confidence: Optional[float]


@router.post("/analyze-url", response_model=StandardResponse[URLAnalyzeResponse])
async def analyze_url_gemini(
    payload: URLAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """
    Uses the new URLIntelligencePipeline.
    """
    from app.intelligence.url.url_pipeline import URLIntelligencePipeline
    
    pipeline = URLIntelligencePipeline(payload.originalUrl)
    result = await pipeline.execute(None)
    
    response_data = URLAnalyzeResponse(
        original_url=result.get("original_url", payload.originalUrl),
        final_url=result.get("final_url", payload.finalUrl),
        website_category=result.get("website_category", "Unknown"),
        final_risk_score=result.get("final_risk_score", 0),
        final_threat_level=result.get("final_threat_level", "Unknown"),
        cyber_threat=result.get("cyber_threat", "Unknown"),
        privacy_risk=result.get("privacy_risk", "Unknown"),
        financial_risk=result.get("financial_risk", "Unknown"),
        download_risk=result.get("download_risk", "Unknown"),
        forensics=result.get("forensics"),
        threat_intel=result.get("threat_intel", {}),
        triggered_rules=result.get("triggered_rules", []),
        evidence_collected=result.get("evidence_collected", []),
        recommendations=result.get("recommendations", []),
        processing_time=result.get("timeline", {}).get("total_ms", 0.0),
        ai_available=result.get("ai_available", False),
        ai_summary=result.get("ai_summary", ""),
        ai_confidence=result.get("ai_confidence")
    )
        
    from app.models.report import ReportStatus
    report_data = {
        "user_id": current_user.id,
        "category": "URL Intelligence",
        "title": f"URL Scan: {payload.originalUrl[:50]}",
        "evidence_type": "URL",
        "detected_type": "URL",
        "pipeline_used": "URL",
        "status": ReportStatus.APPROVED.value,
        "raw_ai_response": response_data.model_dump(),
        "is_counterfeit": True if response_data.final_risk_score >= 70 else False,
        "confidence_score": response_data.ai_confidence or 0.0
    }
    await report_service.report_repo.create(report_data)

    return StandardResponse(
        success=True,
        message="URL intelligence pipeline completed successfully.",
        data=response_data
    )


@router.post("/analyze-screenshot")
async def analyze_screenshot(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Direct endpoint for analyzing screenshots.
    """
    filename = file.filename or "uploaded_screenshot.png"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PNG, JPG, JPEG are supported."
        )

    # Read content to check size
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    await file.seek(0)

    # Save to media/uploads temporarily
    from app.services.upload_service import upload_service
    image_url = await upload_service.save_uploaded_image(file)
    local_path = os.path.join(_media_upload_root, os.path.basename(image_url))

    try:
        from app.services.evidence_engine import EvidenceIntelligenceEngine
        analysis_result = await EvidenceIntelligenceEngine.analyze_screenshot(local_path, filename)
        return StandardResponse(
            success=True,
            message="Screenshot analyzed successfully.",
            data=analysis_result
        )
    finally:
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError:
                pass









