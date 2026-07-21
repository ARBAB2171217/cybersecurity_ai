import time
import logging
from typing import Dict, Any
from app.services.forensics.validation_engine import EvidenceValidationService
from app.services.forensics.preprocessing_engine import PreprocessingEngine
from app.services.forensics.registry import DetectorRegistry
from app.services.forensics.detectors import (
    QRDetector, CurrencyDetector, ScreenshotDetector, DocumentDetector
)
from app.services.forensics.voting_engine import FeatureVotingEngine
from app.services.forensics.confidence_engine import ConfidenceEngine
from app.services.forensics.explainability_engine import ExplainabilityEngine

logger = logging.getLogger("app.services.image_classifier_service")

class ImageClassifierService:
    @staticmethod
    def orchestrate(image_path: str) -> Dict[str, Any]:
        t0 = time.time()
        
        # 1. Validation
        try:
            EvidenceValidationService.validate(image_path)
        except ValueError as e:
            return {
                "evidence_type": "Unknown",
                "detected_type": "Unknown",
                "selected_pipeline": "Rejected",
                "confidence": 0.0,
                "error": str(e)
            }
            
        # 2. Preprocessing
        try:
            context = PreprocessingEngine.execute(image_path)
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            return {
                "evidence_type": "Unknown",
                "detected_type": "Unknown",
                "selected_pipeline": "Rejected",
                "confidence": 0.0,
                "error": "Failed to preprocess image."
            }
            
        # 3. Registry & Extractors
        registry = DetectorRegistry()
        registry.register(QRDetector())
        registry.register(CurrencyDetector())
        registry.register(ScreenshotDetector())
        registry.register(DocumentDetector())
        
        feature_sets = registry.execute_all(context)
        
        # 4. Voting Engine
        detected_type, matched, rejected = FeatureVotingEngine.evaluate(feature_sets)
        
        # 5. Confidence Engine
        confidence = ConfidenceEngine.calculate(detected_type, matched, context)
        
        # 6. Pipeline Mapping
        pipeline_map = {
            "QR Code": "QR Pipeline",
            "Currency": "Currency Pipeline",
            "Screenshot": "Screenshot Pipeline",
            "Document": "Document Pipeline",
            "Unknown": "Generic Vision Analysis"
        }
        selected_pipeline = pipeline_map.get(detected_type, "Generic Vision Analysis")
        
        # Serialize preprocessing for compatibility
        preprocessing_dict = {
            "processed_path": context.processed_path,
            "width": context.width,
            "height": context.height,
            "format": context.format,
            "aspect_ratio": context.aspect_ratio
        }
        
        ocr_result = {
            "raw_text": context.ocr_text,
            "blocks": context.ocr_blocks,
            "ocr_confidence": context.ocr_confidence
        }
        
        report = ExplainabilityEngine.generate_report(
            detected_type=detected_type,
            confidence=confidence,
            matched_features=matched,
            rejected=rejected,
            pipeline=selected_pipeline,
            t0=t0
        )
        
        return {
            "evidence_type": detected_type,
            "detected_type": detected_type,
            "confidence": confidence,
            "selected_pipeline": selected_pipeline,
            "preprocessing": preprocessing_dict,
            "ocr_result": ocr_result,
            "explainability": report,
            "qr_details": context.qr_payloads[0] if context.qr_payloads else None
        }
