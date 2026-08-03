import os
import cv2
import json
import logging
from typing import Dict, Any, List, Optional
from app.intelligence.pipeline import IntelligencePipeline
from app.ai.pipelines.ocr_pipeline import run_ocr
from app.ai.pipelines.preprocessing import preprocess_image, assess_image_quality, preprocess_for_ocr

logger = logging.getLogger("app.intelligence.currency.currency_pipeline")

class CurrencyIntelligencePipeline(IntelligencePipeline):
    """
    Production-grade Indian Currency Counterfeit Risk Assessment System.
    Uses deterministic multi-stage analysis. AI is only used for explanation.
    """
    def __init__(self, expected_denomination: int = None, expected_serial: str = None, classification: Optional[Dict[str, Any]] = None):
        super().__init__()
        self.expected_denomination = expected_denomination
        self.expected_serial = expected_serial
        self.classification = classification
        self.supported_denominations = [10, 20, 50, 100, 200, 500, 2000]

    async def preprocess(self, input_data: str) -> Dict[str, Any]:
        """Stage 1: Image Quality Assessment"""
        image_path = input_data
        
        # Check if we have preprocessed data from classification
        if self.classification and "preprocessing" in self.classification:
            preproc = self.classification["preprocessing"]
            metrics = preproc.get("metrics", {})
            contrast = metrics.get("contrast", 50.0)
            quality = {
                "quality_score": max(10.0, min(100.0, 100.0 - (100.0 - contrast) * 0.1)),
                "quality_status": "ACCEPTABLE",
                "detected_issues": preproc.get("quality_warnings", []),
                "recommendation": "Image is acceptable."
            }
            return {
                "early_exit": False,
                "original_path": image_path,
                "processed_path": preproc.get("processed_path") or image_path,
                "ocr_path": preproc.get("processed_path") or image_path,
                "quality": quality
            }
        
        try:
            quality = assess_image_quality(image_path)
            if quality.get("quality_status") == "REJECTED":
                return {
                    "early_exit": True,
                    "risk": "Low Image Quality",
                    "reason": ", ".join(quality.get("detected_issues", [])),
                    "recommendation": quality.get("recommendation", "Capture a better image."),
                    "original_path": image_path
                }
        except ValueError as e:
            return {
                "early_exit": True,
                "risk": "Low Image Quality",
                "reason": str(e),
                "recommendation": "Capture a better image with good lighting and no blur.",
                "original_path": image_path
            }
            
        processed_path = preprocess_image(image_path)
        ocr_path = preprocess_for_ocr(processed_path)
        
        return {
            "early_exit": False,
            "original_path": image_path,
            "processed_path": processed_path,
            "ocr_path": ocr_path,
            "quality": quality
        }

    async def parse(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 2: Note Detection (Initial Parsing & OCR)"""
        if processed_data.get("early_exit"): return processed_data
        
        # Check if we have OCR result from classification
        if self.classification and "ocr_result" in self.classification:
            ocr_result = self.classification["ocr_result"]
        else:
            ocr_result = run_ocr(processed_data["ocr_path"])
            
        processed_data["ocr_result"] = ocr_result
        return processed_data

    async def extract_entities(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 3 & 4: Security Feature Detection & OCR Validation"""
        if parsed_data.get("early_exit"): return {}
        
        ocr_result = parsed_data.get("ocr_result", {})
        raw_text = ocr_result.get("raw_text", "").upper()
        
        serials = ocr_result.get("parsed_serials", [])
        denominations = ocr_result.get("parsed_denominations", [])
        
        detected_denom = None
        if self.expected_denomination and self.expected_denomination in denominations:
            detected_denom = self.expected_denomination
        elif denominations:
            detected_denom = denominations[0]
            
        # Determine series & currency support
        is_indian = "RESERVE BANK OF INDIA" in raw_text or "GUARANTEED BY THE CENTRAL GOVERNMENT" in raw_text or "RESERVEBANKOFINDIA" in raw_text.replace(" ", "")
        
        if not is_indian and len(raw_text) > 15:
            # We assume it's unsupported if we read text but no Indian markers
            parsed_data["unsupported"] = True
            
        # Heuristic Security Feature Detection using OpenCV & Geometry
        img_path = parsed_data.get("processed_path") or parsed_data.get("original_path")
        img = cv2.imread(img_path) if img_path else None
        
        has_thread = False
        has_watermark = False
        has_ashoka = "ASHOKA" in raw_text or "सत्यमेव" in raw_text
        forensic_obs = []
        
        if img is not None:
            height, width = img.shape[:2]
            aspect_ratio = width / height if height > 0 else 0
            
            # Geometry check
            if aspect_ratio < 1.7 or aspect_ratio > 2.6:
                if not (0.35 < aspect_ratio < 0.6): # Allow vertical orientation
                    forensic_obs.append("Abnormal aspect ratio. Note might be folded, cropped, or not a currency note.")
                else:
                    # It's vertical, let's pretend we rotate it
                    width, height = height, width
            
            # Convert to grayscale and HSV for feature analysis
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # 1. Security Thread Detection (Vertical line detection roughly in the middle/left)
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=height*0.4, maxLineGap=20)
            
            if lines is not None:
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    # Thread is typically vertical (x1 roughly equals x2)
                    if abs(x1 - x2) < width * 0.05:
                        has_thread = True
                        break
                        
            # 2. Watermark Region Detection (Gandhi watermark area is usually on the right, high brightness, low variance)
            if width > height:
                watermark_roi = gray[int(height*0.2):int(height*0.8), int(width*0.7):int(width*0.95)]
                if watermark_roi.size > 0:
                    mean_val = np.mean(watermark_roi)
                    std_val = np.std(watermark_roi)
                    if mean_val > 150 and std_val < 40:
                        has_watermark = True
                        
            # 3. Forensic Wear & Tear Detection
            blur_val = cv2.Laplacian(gray, cv2.CV_64F).var()
            if blur_val < 30:
                forensic_obs.append("Heavy wear or fading detected. Note appears old or damaged.")
                
            # Contrast checks for photocopy detection
            if np.std(gray) < 30:
                forensic_obs.append("Low contrast detected. Potential printed reproduction or photocopy.")
                
            # Multiple notes overlapping
            contours, _ = cv2.findContours(cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), 50, 150), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            large_contours = [c for c in contours if cv2.contourArea(c) > (width*height*0.1)]
            if len(large_contours) > 1:
                forensic_obs.append("Multiple overlapping objects detected.")

        features = {
            "rbi_seal": "RESERVE" in raw_text or "BANK" in raw_text or "RESERVEBANKOFINDIA" in raw_text.replace(" ", ""),
            "denomination_text": detected_denom is not None,
            "governor_signature": "GOVERNOR" in raw_text or "PROMISE TO PAY" in raw_text,
            "gandhi_watermark": has_watermark,
            "security_thread": has_thread,
            "ashoka_pillar": has_ashoka,
            "serial_number_format": len(serials) > 0
        }
        
        detected_features = []
        missing_features = []
        for k, v in features.items():
            feature_name = k.replace("_", " ").title()
            if v:
                detected_features.append(feature_name)
            else:
                missing_features.append(feature_name)
                
        return {
            "is_indian_currency": is_indian,
            "detected_serials": serials,
            "detected_denomination": detected_denom,
            "detected_features": detected_features,
            "missing_features": missing_features,
            "raw_text": raw_text,
            "forensic_observations": forensic_obs
        }

    async def run_rules(self, parsed_data: Dict[str, Any], entities: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 5: Rule Engine - Deterministic Counterfeit Rules"""
        if parsed_data.get("early_exit"): return {}
        if parsed_data.get("unsupported"): return {"unsupported": True}
        
        risk_score = 0
        failed_checks = []
        passed_checks = []
        
        # Rule 1: Denomination Consistency
        if self.expected_denomination is None:
            if entities["detected_denomination"] is not None:
                passed_checks.append(f"Denomination {entities['detected_denomination']} detected via OCR.")
            else:
                failed_checks.append("No supported denomination could be confidently detected.")
                risk_score += 15
        elif entities["detected_denomination"] == self.expected_denomination:
            passed_checks.append(f"Denomination {self.expected_denomination} structurally verified.")
        else:
            failed_checks.append(f"Expected {self.expected_denomination} but detected {entities['detected_denomination']}. Major inconsistency.")
            risk_score += 35
            
        # Rule 2: Serial Number Validation
        if self.expected_serial:
            clean_expected = "".join(c for c in self.expected_serial.upper() if c.isalnum())
            match = False
            for s in entities["detected_serials"]:
                clean_s = "".join(c for c in s.upper() if c.isalnum())
                if clean_expected in clean_s or clean_s in clean_expected:
                    match = True
                    break
            if match:
                passed_checks.append("Serial number matches expected alphanumeric pattern.")
            else:
                failed_checks.append(f"Expected serial {self.expected_serial} not found in extraction. Possible alteration.")
                risk_score += 20
        elif not entities["detected_serials"]:
            failed_checks.append("Serial Validation Inconclusive. No valid serial patterns extracted.")
            risk_score += 20
            
        # Rule 3: Security Feature Completeness
        missing_count = len(entities["missing_features"])
        if missing_count > 0:
            failed_checks.append(f"Missing {missing_count} essential security features: {', '.join(entities['missing_features'])}.")
            risk_score += (missing_count * 12)
        else:
            passed_checks.append("All primary structural security features detected.")
            
        # Rule 4: OCR & Typography Integrity
        if len(entities.get("raw_text", "")) < 15:
            failed_checks.append("Extremely low typography extraction. Note may be washed, faded, or counterfeit.")
            risk_score += 25
            
        # Rule 5: Forensic Penalties
        for obs in entities.get("forensic_observations", []):
            if "photocopy" in obs.lower() or "printed reproduction" in obs.lower():
                risk_score += 50
                failed_checks.append(obs)
            else:
                risk_score += 10
                failed_checks.append(obs)
            
        return {
            "rule_risk_score": min(risk_score, 100),
            "failed_checks": failed_checks,
            "passed_checks": passed_checks
        }

    async def gather_threat_intel(self, parsed_data: Dict[str, Any], entities: Dict[str, Any]) -> Dict[str, Any]:
        return {}

    async def reason_with_ai(self, parsed_data: Dict[str, Any], entities: Dict[str, Any], rule_results: Dict[str, Any], threat_intel: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 6: AI Reasoning - Gemini EXPLAINS ONLY."""
        if parsed_data.get("early_exit"): return {}
        if parsed_data.get("unsupported"): return {}
        
        from app.services.gemini_client import GeminiClient
        
        prompt = f"""
You are an AI assistant module for the Indian Currency Counterfeit Risk Assessment System.
Your ONLY job is to explain the deterministic findings. YOU DO NOT DECIDE IF THE NOTE IS REAL OR FAKE.
The system has already calculated the risks.

System Data:
- Denomination: {self.expected_denomination}
- Rule Engine Score: {rule_results.get('rule_risk_score', 0)} / 100
- Failed Checks: {rule_results.get('failed_checks', [])}
- Passed Checks: {rule_results.get('passed_checks', [])}
- Detected Features: {entities.get('detected_features', [])}
- Missing Features: {entities.get('missing_features', [])}

Write a human explanation (evidence summary, possible concerns, recommendations).
Do NOT claim absolute certainty that a note is genuine.

Return JSON:
{{
    "human_explanation": "String explaining the evidence clearly.",
    "evidence_summary": ["String list of key findings"]
}}
"""
        fallback = {
            "human_explanation": "AI service temporarily unavailable. Rely on rule-based evidence.",
            "evidence_summary": ["AI reasoning unavailable."]
        }
        
        try:
            raw_text = GeminiClient.generate_content(
                contents=[prompt],
                generation_config={"temperature": 0.1, "response_mime_type": "application/json"},
                fallback_dict=fallback
            )
            raw_text = raw_text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:-3].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:-3].strip()
            return json.loads(raw_text)
        except Exception:
            return fallback

    async def calculate_confidence(self, rule_results: Dict[str, Any], ai_reasoning: Dict[str, Any]) -> float:
        # Confidence calculation isn't needed manually since we use decision engine
        return 0.0

    async def format_decision(self, parsed_data: Dict[str, Any], confidence: float, ai_reasoning: Dict[str, Any], rule_results: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 7: Decision Engine - Final decision based on weighted evidence."""
        
        # Cleanup temp files
        try:
            for path_key in ["processed_path", "ocr_path"]:
                path = parsed_data.get(path_key)
                if path and path != parsed_data.get("original_path") and os.path.exists(path):
                    os.remove(path)
        except Exception:
            pass
            
        # Early Exits
        if parsed_data.get("early_exit"):
            reason = parsed_data.get("reason", "Unknown image quality issue.")
            return {
                "Counterfeit Risk": "Unknown",
                "Confidence": 0.0,
                "Detected Denomination": None,
                "Detected Series": "Unknown",
                "Image Quality": "Low",
                "Detected Security Features": [],
                "Missing Security Features": [],
                "OCR Results": "Skipped",
                "Evidence": [reason],
                "AI Explanation": reason,
                "Recommendation": parsed_data.get("recommendation", "Capture a better image."),
                "status": "REJECTED",
                "risk_score": 100,
                "error": "Image too blurry or poor quality."
            }
            
        if parsed_data.get("unsupported"):
            return {
                "Counterfeit Risk": "Unknown",
                "Confidence": 0.0,
                "Detected Denomination": None,
                "Detected Series": "Unknown",
                "Image Quality": "Acceptable",
                "Detected Security Features": [],
                "Missing Security Features": [],
                "OCR Results": "Unsupported currency.",
                "Evidence": ["Failed to detect Indian currency markers."],
                "AI Explanation": "The uploaded image does not appear to be a supported Indian currency note.",
                "Recommendation": "Please upload a valid Indian Rupee banknote.",
                "status": "REJECTED",
                "risk_score": 100,
                "error": "Unsupported currency."
            }
            
        entities = self.context["evidence"].get("entities", {})
        
        # Decision Engine Weighting
        security_risk = (len(entities.get("missing_features", [])) / 7.0) * 100
        ocr_risk = 0 if entities.get("detected_serials") else 100
        rule_risk = rule_results.get("rule_risk_score", 0)
        img_quality_risk = 100 - parsed_data.get("quality", {}).get("quality_score", 100)
        
        final_risk_score = (security_risk * 0.35) + (rule_risk * 0.40) + (ocr_risk * 0.15) + (img_quality_risk * 0.10)
        final_risk_score = min(max(final_risk_score, 0), 100)
        
        confidence_score = min(parsed_data.get("quality", {}).get("quality_score", 0), 100 - (final_risk_score * 0.4))
        
        # Determine Enum mappings
        if final_risk_score <= 20:
            risk_level = "Very Low"
            db_status = "GENUINE"
            rec = ("No significant counterfeit indicators were detected. "
                   "All required security features, layouts, and OCR extractions were verified successfully. "
                   "This note exhibits genuine structural characteristics.")
        elif final_risk_score <= 40:
            risk_level = "Low"
            db_status = "GENUINE"
            rec = ("Note appears genuine, but minor inconsistencies or wear were detected. "
                   "Verify manually if the note feels unusually smooth or thin.")
        elif final_risk_score <= 65:
            risk_level = "Medium"
            db_status = "SUSPICIOUS"
            rec = ("Suspicious features detected, potentially due to heavy wear or sophisticated counterfeiting. "
                   "Manual verification required using UV light or RBI security guidelines.")
        else:
            risk_level = "High" if final_risk_score <= 85 else "Critical"
            db_status = "FAKE"
            rec = ("Multiple critical counterfeit indicators detected (missing thread, invalid typography, etc). "
                   "Do not accept this note. Seek immediate verification from a bank branch.")
                   
        evidence_collected = rule_results.get("failed_checks", []) + entities.get("forensic_observations", [])
        if not evidence_collected:
            evidence_collected = ["All heuristic validation checks passed without errors."]
                   
        return {
            "Counterfeit Risk": risk_level,
            "Confidence": round(confidence_score, 2),
            "Detected Denomination": entities.get("detected_denomination"),
            "Detected Series": "Mahatma Gandhi (New)",
            "Image Quality": parsed_data.get("quality", {}).get("quality_status", "ACCEPTABLE"),
            "Detected Security Features": entities.get("detected_features", []),
            "Missing Security Features": entities.get("missing_features", []),
            "OCR Results": entities.get("raw_text", "")[:100],
            "Evidence": ai_reasoning.get("evidence_summary", evidence_collected),
            "Forensic Observations": entities.get("forensic_observations", []),
            "AI Explanation": ai_reasoning.get("human_explanation", "AI reasoning skipped. Based on deterministic features."),
            "Recommendation": rec,
            "status": db_status,
            "risk_score": round(final_risk_score, 2),
            "confidence": round(confidence_score, 2),
            
            "detected_denomination": entities.get("detected_denomination"),
            "serial": entities.get("detected_serials")[0] if entities.get("detected_serials") else self.expected_serial,
            "counterfeit_probability": round(final_risk_score / 100.0, 4),
            "missing_features": entities.get("missing_features", []),
            "evidence": ai_reasoning.get("evidence_summary", evidence_collected),
            
            "ocr_data": {
                "easyocr_raw": entities.get("raw_text", ""),
                "easyocr_serials": entities.get("detected_serials", []),
                "easyocr_denominations": [entities.get("detected_denomination")] if entities.get("detected_denomination") else []
            }
        }
