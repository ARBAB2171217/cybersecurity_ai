from typing import Dict, Any

class UnifiedReportService:
    @staticmethod
    def normalize(detected_type: str, classification_confidence: float, router_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes outputs from different pipelines into a single Unified schema.
        """
        raw = router_output.get("raw_output", {})
        pipeline_used = router_output.get("pipeline_used", "Unknown Pipeline")
        processing_time = router_output.get("processing_time", 0.0)

        # Base schema mapping
        unified = {
            "DetectedType": detected_type,
            "detected_type": detected_type,
            "confidence": classification_confidence,
            "risk_score": 0,
            "threat_level": "UNKNOWN",
            "threat_category": "General",
            "evidence": [],
            "ai_summary": "Analysis completed.",
            "recommendations": [],
            "pipeline_used": pipeline_used,
            "processing_time": processing_time,
            "preprocessing": raw.get("preprocessing"),
            "url_intelligence": raw.get("url_intelligence"),
        }

        # Handling errors during pipeline execution
        if "error" in raw:
            unified["ai_summary"] = f"Pipeline failed: {raw['error']}"
            unified["threat_level"] = "ERROR"
            return unified

        # Map Screenshot Pipeline format
        if pipeline_used == "Screenshot Pipeline":
            risk = raw.get("risk_analysis", {})
            unified["risk_score"] = risk.get("risk_score", raw.get("risk_score", 0))
            unified["threat_level"] = risk.get("threat_level", raw.get("threat_level", "UNKNOWN"))
            unified["threat_category"] = raw.get("category", detected_type)
            unified["ai_summary"] = raw.get("ai_analysis", {}).get("threat_summary", "Extracted text and entities successfully.")
            if "ocr_text" in raw:
                unified["evidence"].append(f"Text length: {len(raw['ocr_text'])}")
            unified["evidence"].extend([rule.get("name", "") for rule in risk.get("triggered_rules", []) if isinstance(rule, dict)])
            unified["recommendations"] = raw.get("ai_analysis", {}).get("prevention_tips", [])

        elif pipeline_used == "Document Pipeline":
            risk = raw.get("risk_analysis", {})
            unified["risk_score"] = risk.get("risk_score", 0)
            unified["threat_level"] = risk.get("threat_level", "UNKNOWN")
            unified["threat_category"] = raw.get("category", "Document")
            unified["ai_summary"] = raw.get("ai_analysis", {}).get("threat_summary", "Document OCR analysis completed.")
            if "ocr_text" in raw:
                unified["evidence"].append(f"Text length: {len(raw['ocr_text'])}")
            unified["recommendations"] = raw.get("ai_analysis", {}).get("prevention_tips", [])

        # Map QR Pipeline format
        elif pipeline_used == "QR Pipeline":
            risk = raw.get("risk_analysis", {})
            unified["risk_score"] = risk.get("risk_score", raw.get("risk_score", 0))
            unified["threat_level"] = risk.get("risk_level", raw.get("threat_level", "UNKNOWN"))
            unified["threat_category"] = "QR Risk"
            unified["ai_summary"] = raw.get("summary", "QR Analysis Complete")
            unified["evidence"] = risk.get("failed_checks", []) + risk.get("warning_checks", [])
            recommendation = raw.get("recommendation") or risk.get("prevention_guidance")
            unified["recommendations"] = recommendation if isinstance(recommendation, list) else ([recommendation] if recommendation else [])

        # Map Currency Pipeline format
        elif pipeline_used == "Currency Pipeline":
            unified["risk_score"] = raw.get("risk_score", 0)
            unified["threat_level"] = raw.get("status", "UNKNOWN")
            unified["threat_category"] = "Counterfeit Currency"
            unified["ai_summary"] = raw.get("AI Explanation") or raw.get("summary", "Currency Analysis Complete")
            unified["evidence"] = raw.get("Evidence", []) or raw.get("reasons", [])
            if "Recommendation" in raw:
                unified["recommendations"] = [raw["Recommendation"]]
            elif "recommendation" in raw:
                unified["recommendations"] = [raw["recommendation"]]

        elif pipeline_used == "Generic Vision Analysis":
            unified["risk_score"] = raw.get("risk_score", 0)
            unified["threat_level"] = raw.get("status", "UNKNOWN")
            unified["threat_category"] = "Unknown"
            unified["ai_summary"] = raw.get("summary", "Image was not confidently classified.")
            unified["evidence"] = [f"OCR text length: {len(raw.get('ocr_text', ''))}"]
            recommendation = raw.get("recommendation")
            unified["recommendations"] = [recommendation] if recommendation else []

        return unified
