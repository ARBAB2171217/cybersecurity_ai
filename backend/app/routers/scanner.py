import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
import logging

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_report_repo
from app.models.user import User
from app.services.upload_service import upload_service
from app.services.report_service import ReportService
from app.services.ai_detection_service import AIDetectionService
from app.services.pipeline_router_service import PipelineRouterService
from app.services.unified_report_service import UnifiedReportService
from app.ai.pipelines.preprocessing import preprocess_universal_image
from app.schemas.response import StandardResponse

logger = logging.getLogger("app.routers.scanner")
router = APIRouter(prefix="/scanner", tags=["Universal Scanner"])

_media_upload_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../media/uploads")
)
os.makedirs(_media_upload_root, exist_ok=True)

def get_report_service(report_repo=Depends(get_report_repo)) -> ReportService:
    return ReportService(report_repo)

def get_ai_detection_service(report_repo=Depends(get_report_repo)) -> AIDetectionService:
    return AIDetectionService(report_repo)

@router.post("/scan")
async def universal_scan(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    ai_detection_service: AIDetectionService = Depends(get_ai_detection_service),
):
    """
    Universal API Endpoint for AI Scanner.
    1. Saves Image
    2. Classifies Image Type
    3. Routes to appropriate pipeline
    4. Normalizes output
    """
    # 1. Save Image
    raw_local_path = None
    analysis_path = None
    try:
        image_url = await upload_service.save_uploaded_image(file)
        raw_local_path = os.path.join(_media_upload_root, os.path.basename(image_url))
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to upload image: {e}")

    import asyncio

    try:
        # 3. Deterministic multi-stage classification orchestrator
        from app.services.image_classifier_service import ImageClassifierService
        classification = await asyncio.to_thread(
            ImageClassifierService.orchestrate,
            raw_local_path
        )
        preprocessing = classification.get("preprocessing", {})
        analysis_path = preprocessing.get("processed_path") or raw_local_path
        analysis_url = f"/media/uploads/{os.path.basename(analysis_path)}"
        
    except ValueError as e:
        if raw_local_path and os.path.exists(raw_local_path):
            try:
                os.remove(raw_local_path)
            except OSError:
                logger.warning(f"Could not clean up rejected upload: {raw_local_path}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Universal preprocessing/classification failed: {e}", exc_info=True)
        if raw_local_path and os.path.exists(raw_local_path):
            try:
                os.remove(raw_local_path)
            except OSError:
                logger.warning(f"Could not clean up failed upload: {raw_local_path}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Image classification failed: {e}",
        )

    if classification.get("error") and classification.get("selected_pipeline") == "Rejected":
        if raw_local_path and os.path.exists(raw_local_path):
            try:
                os.remove(raw_local_path)
            except OSError:
                logger.warning(f"Could not clean up rejected upload: {raw_local_path}")
        if analysis_path and analysis_path != raw_local_path and os.path.exists(analysis_path):
            try:
                os.remove(analysis_path)
            except OSError:
                logger.warning(f"Could not clean up rejected processed image: {analysis_path}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=classification["error"])

    detected_type = classification.get("detected_type") or classification.get("evidence_type", "Unknown")
    confidence = classification.get("confidence", 0.0)

    if detected_type == "Currency":
        from app.validators.report_validator import validate_report_payload
        try:
            validate_report_payload(
                denomination=classification.get("detected_denomination"),
                serial_number=classification.get("detected_serial")
            )
        except HTTPException as exc:
            for path in {raw_local_path, analysis_path}:
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except OSError:
                        pass
            raise exc

    # 4. Create initial DB report against the normalized image used by pipelines.
    report = await report_service.create_report(
        user_id=current_user.id,
        denomination=classification.get("detected_denomination"),
        serial_number=classification.get("detected_serial"),
        image_url=analysis_url
    )
    
    # Safely extract report_id while the session is fresh
    report_id_str = str(report.id) if report and hasattr(report, "id") else None

    # Persist deterministic routing metadata.
    try:
        report.evidence_type = detected_type
        report.detected_type = detected_type
        report.classification_confidence = confidence
        report.selected_pipeline = classification.get("selected_pipeline")
    except AttributeError:
        pass

    router_output = {}
    try:
        # 5. Route exactly one pipeline.
        router_output = await PipelineRouterService.execute_pipeline(
            detected_type=detected_type,
            image_path=analysis_path,
            original_filename=file.filename or "uploaded.png",
            report_id=report.id,
            ai_detection_service=ai_detection_service,
            classification=classification,
        )

        report.pipeline_used = router_output.get("pipeline_used")
        report.processing_time = router_output.get("processing_time")
        
        # Persist raw output and determine status
        raw_output = router_output.get("raw_output", {})
        if raw_output and isinstance(raw_output, dict):
            report.raw_ai_response = raw_output
            report.status = "APPROVED"
            
            # Use appropriate risk score heuristics based on pipeline output
            risk_score = raw_output.get("risk_score") or raw_output.get("risk_analysis", {}).get("risk_score", 0)
            report.is_counterfeit = bool(risk_score >= 70)
            
            ai_confidence = raw_output.get("ai_analysis", {}).get("ai_confidence") or raw_output.get("confidence")
            if ai_confidence is not None:
                report.confidence_score = float(ai_confidence)

        await report_service.report_repo.db.commit()
    except AttributeError:
        pass
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Universal pipeline routing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Pipeline execution failed: {e}",
        )
    finally:
        # Currency/generic DB services clean their active image. QR/screenshot/document
        # run directly here, so the scanner cleans any remaining upload artifacts.
        for path in {raw_local_path, analysis_path}:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    logger.warning(f"Could not clean up scanner image: {path}")

    # 6. Normalize Response
    unified_response = UnifiedReportService.normalize(
        classification=classification,
        router_output=router_output
    )
    if report_id_str:
        unified_response["report_id"] = report_id_str
        unified_response["id"] = report_id_str  # Add "id" for backward compatibility with frontend

    return StandardResponse(
        success=True,
        message="Scan completed successfully.",
        data=unified_response
    )
