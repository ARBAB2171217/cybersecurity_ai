from typing import Dict, Any

class UnifiedReportService:
    @staticmethod
    def normalize(classification: Dict[str, Any], router_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enforces a strict enterprise JSON contract explicitly separating 
        Classification from Intelligence Risk Analysis.
        """
        raw = router_output.get("raw_output", {})
        pipeline_used = router_output.get("pipeline_used", "Unknown Pipeline")
        
        explainability = classification.get("explainability", {})
        
        # 1. Classification Block
        unified = {
            "classification": {
                "detected_type": classification.get("detected_type", "Unknown"),
                "subtype": raw.get("category", classification.get("detected_type", "Unknown")),
                "confidence": classification.get("confidence", 0.0),
                "pipeline": pipeline_used,
                "processing_time_ms": explainability.get("processing_time_ms", 0),
                "matched_features": explainability.get("matched_features", []),
                "rejected_classes": explainability.get("rejected_classes", []),
            },
            "classification_evidence": [],
            "analysis": {
                "risk_score": 0,
                "threat_level": "UNKNOWN",
                "triggered_rules": [],
                "evidence": [],
                "recommendations": []
            }
        }
        
        # 2. Extract classification evidence
        if "ocr_result" in classification:
            ocr_text = classification["ocr_result"].get("raw_text", "")
            if ocr_text:
                unified["classification_evidence"].append(f"OCR Extracted {len(ocr_text)} characters")
                
        # 3. Handle Pipeline Errors
        if "error" in raw:
            unified["analysis"]["recommendations"].append(f"Pipeline failed: {raw['error']}")
            unified["analysis"]["threat_level"] = "ERROR"
            return unified
            
        # 4. Intelligence Module Mapping
        if pipeline_used == "Screenshot Pipeline" or pipeline_used == "Document Pipeline":
            risk = raw.get("risk_analysis", {})
            unified["analysis"]["risk_score"] = risk.get("risk_score", raw.get("risk_score", 0))
            unified["analysis"]["threat_level"] = risk.get("threat_level", raw.get("threat_level", "UNKNOWN"))
            unified["analysis"]["triggered_rules"] = risk.get("triggered_rules", [])
            unified["analysis"]["recommendations"] = raw.get("ai_analysis", {}).get("prevention_tips", [])
            unified["analysis"]["evidence"].append(raw.get("ai_analysis", {}).get("threat_summary", "Analysis completed."))
            
        elif pipeline_used == "QR Pipeline":
            risk = raw.get("risk_analysis", {})
            unified["analysis"]["risk_score"] = risk.get("risk_score", raw.get("risk_score", 0))
            unified["analysis"]["threat_level"] = risk.get("risk_level", raw.get("threat_level", "UNKNOWN"))
            
            failed = risk.get("failed_checks", [])
            warnings = risk.get("warning_checks", [])
            
            unified["analysis"]["triggered_rules"] = [{"name": c} for c in failed + warnings]
            
            recommendation = raw.get("recommendation") or risk.get("prevention_guidance")
            unified["analysis"]["recommendations"] = recommendation if isinstance(recommendation, list) else ([recommendation] if recommendation else [])
            unified["analysis"]["evidence"].append(raw.get("summary", "QR Analysis Complete"))
            
            if "qr_details" in classification and classification["qr_details"]:
                unified["classification"]["subtype"] = classification["qr_details"].get("payload_type", "URL")
                
        elif pipeline_used == "Currency Pipeline":
            unified["analysis"]["risk_score"] = raw.get("risk_score", 0)
            unified["analysis"]["threat_level"] = raw.get("status", "UNKNOWN")
            
            evidence = raw.get("Evidence", []) or raw.get("reasons", [])
            unified["analysis"]["evidence"] = evidence
            
            unified["analysis"]["triggered_rules"] = [{"name": "Counterfeit Indicator", "description": e} for e in evidence if "missing" in e.lower() or "suspicious" in e.lower()]
            
            if "Recommendation" in raw:
                unified["analysis"]["recommendations"] = [raw["Recommendation"]]
            elif "recommendation" in raw:
                unified["analysis"]["recommendations"] = [raw["recommendation"]]
                
        else:
            unified["analysis"]["risk_score"] = raw.get("risk_score", 0)
            unified["analysis"]["threat_level"] = raw.get("status", "UNKNOWN")
            unified["analysis"]["evidence"] = [raw.get("summary", "Image was not confidently classified.")]
            
            recommendation = raw.get("recommendation")
            unified["analysis"]["recommendations"] = [recommendation] if recommendation else []
            
        return unified
