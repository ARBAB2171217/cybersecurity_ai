import time
from typing import Dict, Any

class ExplainabilityEngine:
    @staticmethod
    def generate_report(
        detected_type: str, 
        confidence: float, 
        matched_features: list, 
        rejected: list, 
        pipeline: str,
        t0: float
    ) -> Dict[str, Any]:
        return {
            "detected_type": detected_type,
            "confidence": round(confidence, 2),
            "matched_features": matched_features,
            "rejected_classes": rejected,
            "pipeline_selected": pipeline,
            "processing_time_ms": round((time.time() - t0) * 1000, 2)
        }
