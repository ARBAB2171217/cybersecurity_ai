import time
from typing import Dict, Any, Optional
import logging
from app.services.ai_detection_service import AIDetectionService
from app.services.evidence_engine import EvidenceIntelligenceEngine
from fastapi import HTTPException

logger = logging.getLogger("app.services.pipeline_router_service")

class PipelineRouterService:
    @staticmethod
    async def execute_pipeline(
        detected_type: str, 
        image_path: str, 
        original_filename: str, 
        report_id: str,
        ai_detection_service: AIDetectionService,
        classification: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Routes the image to exactly one existing pipeline and returns the raw output.
        """
        start_time = time.time()
        pipeline_used = "Generic Pipeline"
        raw_output = {}

        try:
            if detected_type in {"Currency", "Currency Note"}:
                pipeline_used = "Currency Pipeline"
                analyzed_report = await ai_detection_service.analyze_currency_note(report_id, classification)
                raw_output = analyzed_report.raw_ai_response or {}

            elif detected_type == "QR Code":
                pipeline_used = "QR Pipeline"
                from app.intelligence.qr.qr_pipeline import QRIntelligencePipeline
                pipeline = QRIntelligencePipeline(classification)
                raw_output = await pipeline.execute(image_path)

            elif detected_type == "Screenshot":
                pipeline_used = "Screenshot Pipeline"
                raw_output = await EvidenceIntelligenceEngine.analyze_screenshot(image_path, original_filename, classification)

            elif detected_type == "Document":
                pipeline_used = "Document Pipeline"
                raw_output = await EvidenceIntelligenceEngine.analyze_screenshot(image_path, original_filename, classification)
                raw_output["category"] = raw_output.get("category") or "Document"

            else:
                pipeline_used = "Generic Vision Analysis"
                raw_output = {
                    "detected_type": "Unknown",
                    "status": "UNKNOWN",
                    "risk_score": 0,
                    "confidence": classification.get("confidence", 0.0) if classification else 0.0,
                    "summary": "Image was not confidently classified. No threat or authenticity verdict was inferred.",
                    "recommendation": "Upload a clearer QR, Indian currency note, screenshot, or document for a deterministic scan.",
                    "preprocessing": (classification or {}).get("preprocessing"),
                    "ocr_text": (classification or {}).get("ocr_result", {}).get("raw_text", ""),
                    "classification_scores": (classification or {}).get("classification_scores", {}),
                }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Pipeline execution failed for {pipeline_used}: {e}")
            raw_output = {
                "error": str(e),
                "pipeline": pipeline_used,
                "status": "PIPELINE_ERROR",
            }

        processing_time = round((time.time() - start_time) * 1000, 2)
        
        return {
            "pipeline_used": pipeline_used,
            "processing_time": processing_time,
            "raw_output": raw_output
        }
