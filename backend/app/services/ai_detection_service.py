import os
import uuid
import logging
from typing import Optional
from fastapi import HTTPException, status
from app.repositories.report_repository import ReportRepository
from app.models.report import Report, ReportStatus
from app.ai.pipelines.detection_pipeline import run_detection_pipeline
import hashlib
import json
from app.services.redis_service import redis_service

logger = logging.getLogger("app.services.ai_detection_service")


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
            try:
                os.remove(local_path)
            except OSError:
                pass
