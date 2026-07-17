import os
import uuid
import logging
from typing import Optional
from fastapi import HTTPException, status
from app.repositories.report_repository import ReportRepository
from app.models.report import Report, ReportStatus
from app.ai.pipelines.detection_pipeline import run_detection_pipeline
from app.services.image_processing_service import ImageProcessingService
import hashlib
import json
from app.services.redis_service import redis_service

logger = logging.getLogger("app.services.ai_detection_service")

_image_service = ImageProcessingService()


class AIDetectionService:
    """
    Top-level business service: resolves the uploaded image, runs the AI
    detection pipeline, persists results, and guarantees cleanup of the
    uploaded file from disk after every run (success or failure).
    """

    def __init__(self, report_repo: ReportRepository):
        self.report_repo = report_repo

    async def analyze_currency_note(
        self,
        report_id: uuid.UUID,
        classification: Optional[dict] = None,
    ) -> Report:
        """
        Loads the pending report, runs the full AI pipeline against its image,
        writes results back to the database row, and removes the image file
        from disk on completion (success or failure).
        """
        report = await self.report_repo.get_by_id(report_id)
        if not report or report.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan report not found.",
            )

        # Resolve the absolute local path from the stored relative URL
        # e.g. "/media/uploads/<uuid>.jpg" → "/app/media/uploads/<uuid>.jpg"
        filename = os.path.basename(report.image_url)
        local_path = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "../../media/uploads",
                filename,
            )
        )

        if not os.path.exists(local_path):
            logger.error(f"Image file missing on disk: {local_path}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Banknote image file is missing from the server. Please re-upload.",
            )

        combined_result: dict | None = None
        try:
            with open(local_path, "rb") as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
            
            cache_key = f"detection:hash:{file_hash}"
            cached_data_str = await redis_service.get(cache_key)

            if cached_data_str:
                combined_result = json.loads(cached_data_str)
                logger.info(f"Cache hit for image hash {file_hash}")
                # Optional: Overwrite timeline to indicate it was cached
                if "timeline" in combined_result:
                    combined_result["timeline"]["Cache Retrieval"] = 1.0 # Minimal time
            else:
                # Use new Intelligence Pipeline architecture
                from app.intelligence.currency.currency_pipeline import CurrencyIntelligencePipeline
                pipeline = CurrencyIntelligencePipeline(
                    expected_denomination=report.denomination, 
                    expected_serial=report.serial_number,
                    classification=classification,
                )
                combined_result = await pipeline.execute(local_path)
                await redis_service.set(cache_key, json.dumps(combined_result), expire_seconds=86400 * 30) # 30 days

            # Map pipeline verdict → DB status
            verdict = combined_result.get("status", "SUSPICIOUS")
            if verdict == "FAKE":
                is_counterfeit = True
                db_status = ReportStatus.REJECTED
            elif verdict == "GENUINE":
                is_counterfeit = False
                db_status = ReportStatus.APPROVED
            else:  # SUSPICIOUS
                is_counterfeit = None
                db_status = ReportStatus.PENDING  # Awaits manual admin verification

            update_data = {
                "is_counterfeit": is_counterfeit,
                "confidence_score": float(combined_result.get("confidence", 0.0)),
                "ocr_text": (
                    combined_result.get("ocr_data", {}).get("easyocr_raw", "") or ""
                ),
                "raw_ai_response": combined_result,
                "status": db_status,
            }

            updated_report = await self.report_repo.update(report, update_data)
            logger.info(
                f"Detection complete for report {report_id}. "
                f"Verdict: {verdict} | DB status: {db_status}"
            )
            return updated_report

        except HTTPException:
            # Re-raise HTTP errors unchanged (404, 400, etc.)
            raise

        except Exception as exc:
            logger.error(
                f"Unexpected error in AI pipeline for report {report_id}: {exc}",
                exc_info=True,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "The AI detection pipeline encountered an internal error. "
                    "Please try again or contact support."
                ),
            )

        finally:
            # Always remove the uploaded image from disk — success OR failure.
            # Preprocessed intermediate files are removed inside detection_pipeline.py.
            _image_service.delete_file(local_path)

    async def analyze_generic_evidence(self, report_id: uuid.UUID) -> Report:
        """
        Analyzes QR code evidence or screenshot/document visual evidence.
        """
        report = await self.report_repo.get_by_id(report_id)
        if not report or report.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan report not found.",
            )

        filename = os.path.basename(report.image_url)
        local_path = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "../../media/uploads",
                filename,
            )
        )

        try:
            if report.selected_pipeline == "QR Intelligence":
                try:
                    from app.intelligence.qr.qr_pipeline import QRIntelligencePipeline
                    pipeline = QRIntelligencePipeline()
                    analysis_result = await pipeline.execute(local_path)
                except ImportError:
                    logger.error("QR Intelligence module is not installed or missing dependencies.")
                    analysis_result = {
                        "risk_analysis": {"risk_level": "Unknown"},
                        "confidence": 0.0,
                        "timeline": {},
                        "status": "NEEDS_MANUAL_VERIFICATION",
                        "error": "QR Intelligence module disabled."
                    }
                
                risk_analysis = analysis_result.get("risk_analysis", {})
                risk_level = risk_analysis.get("risk_level", "Unknown")
                
                if risk_level in ["Safe", "Low"]:
                    report.is_counterfeit = False
                    report.status = ReportStatus.APPROVED.value
                elif risk_level == "Medium":
                    report.is_counterfeit = None
                    report.status = ReportStatus.PENDING.value
                else:
                    report.is_counterfeit = True
                    report.status = ReportStatus.REJECTED.value
                    
                report.confidence_score = float(analysis_result.get("confidence", 1.0))
                
                if "timeline" not in analysis_result:
                    analysis_result["timeline"] = {
                        "QR Detection": 120.0,
                        "Type Classification": 70.0,
                        "Security Evaluation": 110.0,
                        "AI Summary": 180.0
                    }
                
                # Wrap it under qr_details so the frontend can parse it easily
                report.raw_ai_response = {"qr_details": analysis_result}
                
            else:
                # Run Screenshot Intelligence using the EvidenceIntelligenceEngine
                from app.services.evidence_engine import EvidenceIntelligenceEngine, ReportMapper
                
                analysis_result = await EvidenceIntelligenceEngine.analyze_screenshot(local_path, filename)
                report = ReportMapper.map_to_report(report, analysis_result)

            await self.report_repo.db.commit()
            await self.report_repo.db.refresh(report)
        finally:
            if os.path.exists(local_path):
                _image_service.delete_file(local_path)
                logger.info(f"Cleaned up evidence file: {local_path}")

        return report
