import logging
import cv2
import numpy as np
from typing import Dict, Any, List, Optional
from app.intelligence.pipeline import IntelligencePipeline
from app.intelligence.shared.gemini_reasoner import build_gemini_prompt, execute_gemini_reasoning
from app.intelligence.shared.confidence_calculator import calculate_hybrid_confidence

logger = logging.getLogger("app.intelligence.qr.qr_pipeline")

try:
    import pyzbar.pyzbar as pyzbar
except Exception:
    pyzbar = None

class QRIntelligencePipeline(IntelligencePipeline):
    """
    Production-grade QR Intelligence pipeline.
    """
    def __init__(self, classification: Optional[Dict[str, Any]] = None):
        super().__init__()
        self.classification = classification

    async def preprocess(self, input_data: str) -> Dict[str, Any]:
        """Load and enhance image for better QR decoding (rotation, blur, contrast)."""
        image_path = input_data
        
        if self.classification and "preprocessing" in self.classification:
            return {
                "image_path": image_path,
                "raw_image": None,
                "enhanced_image": None,
                "cached_preproc": True
            }
            
        image = cv2.imread(image_path)
        if image is None:
            return None

        # Basic enhancements
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        return {
            "image_path": image_path,
            "raw_image": image,
            "enhanced_image": enhanced
        }

    async def parse(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Decode all QR codes in the image using multiple fallback strategies for damaged/distorted QRs."""
        if processed_data.get("cached_preproc") and self.classification:
            qr_details = self.classification.get("qr_details", {})
            decoded_values = qr_details.get("decoded_values", [])
            if not decoded_values and qr_details.get("decoded_value"):
                decoded_values = [qr_details.get("decoded_value")]
                
            results = []
            for val in decoded_values:
                if val:
                    results.append({
                        "data": val,
                        "type": qr_details.get("qr_type", "QRCODE"),
                        "polygon": []
                    })
            processed_data["decoded_qrs"] = results
            return processed_data

        enhanced = processed_data["enhanced_image"]
        raw = processed_data["raw_image"]
        
        strategies = [
            enhanced, # Strategy 1: CLAHE enhanced grayscale
            cv2.cvtColor(raw, cv2.COLOR_BGR2GRAY), # Strategy 2: Raw grayscale
        ]
        
        # Strategy 3: Otsu's Thresholding
        _, thresh_otsu = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        strategies.append(thresh_otsu)
        
        # Strategy 4: Adaptive Thresholding (good for varying lighting)
        thresh_adapt = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        strategies.append(thresh_adapt)
        
        # Strategy 5: Morphological closing (good for broken/damaged QR modules)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        morph_close = cv2.morphologyEx(thresh_otsu, cv2.MORPH_CLOSE, kernel)
        strategies.append(morph_close)
        
        decoded_objects = []
        for strat_img in strategies:
            if pyzbar is not None:
                decoded_objects = pyzbar.decode(strat_img)
                if decoded_objects:
                    break # Stop if we found QR codes
                
        results = []
        seen_data = set()
        for obj in decoded_objects:
            try:
                data = obj.data.decode("utf-8")
                if data not in seen_data:
                    seen_data.add(data)
                    results.append({
                        "data": data,
                        "type": obj.type,
                        "polygon": [(p.x, p.y) for p in obj.polygon]
                    })
            except Exception:
                pass

        if not results:
            detector = cv2.QRCodeDetector()
            for strat_img in strategies:
                ok, decoded_info, _, _ = detector.detectAndDecodeMulti(strat_img)
                if ok and decoded_info:
                    for data in decoded_info:
                        if data and data not in seen_data:
                            seen_data.add(data)
                            results.append({"data": data, "type": "QRCODE", "polygon": []})
                    if results:
                        break

                data, _, _ = detector.detectAndDecode(strat_img)
                if data and data not in seen_data:
                    seen_data.add(data)
                    results.append({"data": data, "type": "QRCODE", "polygon": []})
                    break
                
        processed_data["decoded_qrs"] = results
        return processed_data

    async def extract_entities(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Identify QR types (UPI, URL, Contact, etc)."""
        from app.services.qr_type_classifier import QRTypeClassifier
        
        qrs = parsed_data.get("decoded_qrs", [])
        if not qrs:
            return {"qr_count": 0, "primary_type": "Unknown", "qrs": []}
            
        classified_qrs = []
        for qr in qrs:
            classification = QRTypeClassifier.classify(qr["data"])
            from app.services.qr_analyzer import QRAnalyzerService
            validation = QRAnalyzerService.analyze(classification.get("qr_type", "Unknown"), qr["data"])
            
            qr_type = classification.get("qr_type", "Unknown")
            extracted_info = validation.get("extracted_information", {})
            
            classified_qrs.append({
                "data": qr["data"],
                "type": qr_type,
                "extracted_info": extracted_info,
                "validation_status": validation.get("validation_status", "VALID"),
                "validation_errors": validation.get("validation_errors", []),
                "classification_reason": classification.get("classification_reason", "")
            })
            
        return {
            "qr_count": len(qrs),
            "primary_type": classified_qrs[0]["type"],
            "qrs": classified_qrs
        }

    async def run_rules(self, parsed_data: Dict[str, Any], entities: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic risk analysis."""
        from app.services.qr_risk_analyzer import QRRiskAnalyzerService
        
        failed_checks = []
        warning_checks = []
        passed_checks = []
        overall_risk_score = 0
        
        qrs = entities.get("qrs", [])
        for qr in qrs:
            risk_result = QRRiskAnalyzerService.analyze(
                qr_type=qr["type"], 
                decoded_value=qr["data"], 
                extracted_info=qr["extracted_info"], 
                validation_status=qr.get("validation_status", "VALID"),
                validation_errors=qr.get("validation_errors", []),
            )
            failed_checks.extend(risk_result.get("failed_checks", []))
            warning_checks.extend(risk_result.get("warning_checks", []))
            passed_checks.extend(risk_result.get("passed_checks", []))
            overall_risk_score = max(overall_risk_score, risk_result.get("risk_score", 0))
            
        return {
            "failed_checks": failed_checks,
            "warning_checks": warning_checks,
            "passed_checks": passed_checks,
            "risk_score": overall_risk_score
        }

    async def gather_threat_intel(self, parsed_data: Dict[str, Any], entities: Dict[str, Any]) -> Dict[str, Any]:
        """Lookup URL Intelligence or other external intelligence if QR is Website URL."""
        qrs = entities.get("qrs", [])
        if not qrs:
            return {}
            
        primary_qr = qrs[0]
        qr_type = primary_qr.get("type")
        qr_data = primary_qr.get("data")
        
        intel_results = {}
        if qr_type == "Website URL" and qr_data:
            try:
                from app.intelligence.url.url_pipeline import URLIntelligencePipeline
                url_pipeline = URLIntelligencePipeline(qr_data)
                url_intel = await url_pipeline.execute(None)
                intel_results["url_intelligence"] = url_intel
            except Exception as e:
                logger.error(f"Failed to invoke URL intelligence from QR pipeline: {e}")
                
        return intel_results

    async def reason_with_ai(self, parsed_data: Dict[str, Any], entities: Dict[str, Any], rule_results: Dict[str, Any], threat_intel: Dict[str, Any]) -> Dict[str, Any]:
        """Use Gemini 2.5 Flash to generate threat reasoning and scam explanation."""
        if entities["qr_count"] == 0:
            return {
                "status": "NEEDS_MANUAL_VERIFICATION",
                "threat_level": "Unknown",
                "risk_score": 0,
                "confidence": 0.0,
                "summary": "No QR code could be detected in the image.",
                "technical_findings": ["No QR code decoded."],
                "suspicious_indicators": [],
                "recommendation": "Ensure the QR code is clearly visible and well-lit."
            }
            
        instructions = f"""
        Analyze this QR Code content. Provide reasoning on potential scams (e.g. phishing, fake UPI payment requests, malicious APK downloads).
        Do not make generic statements. Reference the specific extracted entities and rule violations.
        """
        
        prompt = build_gemini_prompt(
            context_type="QR Code",
            parsed_data={"raw_data": [qr["data"] for qr in entities["qrs"]]},
            entities=entities,
            rule_results=rule_results,
            threat_intel=threat_intel,
            additional_instructions=instructions
        )
        
        return await execute_gemini_reasoning(prompt, parsed_data["image_path"])

    async def calculate_confidence(self, rule_results: Dict[str, Any], ai_reasoning: Dict[str, Any]) -> float:
        passed = len(rule_results.get("passed_checks", []))
        warning = len(rule_results.get("warning_checks", []))
        failed = len(rule_results.get("failed_checks", []))
        total = passed + warning + failed
        if total == 0:
            return 0.4
        return round(max(0.1, min(1.0, (passed + 0.5 * warning) / total)), 2)

    async def format_decision(self, parsed_data: Dict[str, Any], confidence: float, ai_reasoning: Dict[str, Any], rule_results: Dict[str, Any]) -> Dict[str, Any]:
        qrs = self.context["evidence"]["entities"].get("qrs", [])
        primary_data = qrs[0]["data"] if qrs else ""
        primary_type = qrs[0]["type"] if qrs else "Unknown"
        extracted_info = qrs[0]["extracted_info"] if qrs else {}
        risk_score = int(rule_results.get("risk_score", 0))

        if risk_score <= 10:
            threat_level = "Safe"
            final_status = "SAFE"
        elif risk_score <= 30:
            threat_level = "Low"
            final_status = "LOW_RISK"
        elif risk_score <= 50:
            threat_level = "Medium"
            final_status = "NEEDS_MANUAL_VERIFICATION"
        elif risk_score <= 75:
            threat_level = "High"
            final_status = "SUSPICIOUS"
        else:
            threat_level = "Critical"
            final_status = "DANGEROUS"

        threat_intel = self.context.get("evidence", {}).get("threat_intel", {})
        url_intel = threat_intel.get("url_intelligence")

        return {
            "qr_detected": len(qrs) > 0,
            "qr_count": len(qrs),
            "qr_type": primary_type,
            "decoded_value": primary_data,
            "extracted_information": extracted_info,
            "confidence": confidence,
            "risk_analysis": {
                "risk_score": risk_score,
                "risk_level": threat_level,
                "passed_checks": rule_results.get("passed_checks", []),
                "warning_checks": rule_results.get("warning_checks", []),
                "failed_checks": rule_results.get("failed_checks", []),
                "ai_summary": ai_reasoning.get("summary", ""),
                "prevention_guidance": ai_reasoning.get("recommendation", "")
            },
            "status": final_status,
            "threat_level": threat_level,
            "summary": ai_reasoning.get("summary", "QR analysis completed."),
            "recommendation": ai_reasoning.get("recommendation", ""),
            "url_intelligence": url_intel
        }
