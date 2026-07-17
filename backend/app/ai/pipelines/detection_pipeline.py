import os
import asyncio
import logging
import time
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.ai.pipelines.preprocessing import preprocess_image, assess_image_quality
from app.ai.pipelines.ocr_pipeline import run_ocr
from app.ai.pipelines.gemini_pipeline import run_gemini_vision
from app.ai.parsers.response_parser import parse_gemini_response

logger = logging.getLogger("app.ai.pipelines.detection_pipeline")

async def run_detection_pipeline(
    image_path: str,
    denomination: int,
    serial_number: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the entire banknote analysis flow:
    Image path -> Preprocessing -> Parallel OCR + Gemini -> Result Merger & Cross-Validation.
    """
    if not os.path.isabs(image_path):
        image_path = os.path.abspath(image_path)
        
    logger.info(f"Starting counterfeit scan on: {image_path}")

    timeline = {}
    
    # 0. Image Quality Assessment
    t0 = time.time()
    quality_score = 100.0
    try:
        quality_res = await asyncio.to_thread(assess_image_quality, image_path)
        quality_score = quality_res.get("quality_score", 100.0)
    except ValueError as e:
        logger.warning(f"Image quality assessment failed for {image_path}: {e}")
        quality_score = 50.0  # Penalize quality score instead of failing if we want to run the pipeline
        raise HTTPException(status_code=400, detail=str(e))
    timeline["Quality Assessment"] = round((time.time() - t0) * 1000, 2)

    # 1. Preprocessing image
    t1 = time.time()
    proc_path = await asyncio.to_thread(preprocess_image, image_path)
    timeline["Auto Crop & Preprocessing"] = round((time.time() - t1) * 1000, 2)

    # 2. Parallelized extraction to minimize user waiting latency
    t2 = time.time()
    from app.ai.pipelines.feature_detection import SecurityFeatureDetector
    
    async def timed_ocr():
        st = time.time()
        res = await asyncio.to_thread(run_ocr, proc_path)
        return res, round((time.time() - st) * 1000, 2)
        
    async def timed_features():
        st = time.time()
        res = await asyncio.to_thread(SecurityFeatureDetector.detect_features, proc_path, denomination)
        return res, round((time.time() - st) * 1000, 2)
        
    ocr_out, features_out = await asyncio.gather(timed_ocr(), timed_features(), return_exceptions=True)

    if isinstance(ocr_out, Exception):
        logger.error(f"OCR execution failure: {ocr_out}")
        ocr_result = {"raw_text": "", "blocks": [], "parsed_serials": [], "parsed_denominations": []}
        timeline["OCR"] = 0.0
    else:
        ocr_result, ocr_time = ocr_out
        timeline["OCR"] = ocr_time

    if isinstance(features_out, Exception):
        logger.error(f"Feature Detection failure: {features_out}")
        cv_features = {"detected": [], "missing": []}
        timeline["Feature Detection"] = 0.0
    else:
        cv_features, feat_time = features_out
        timeline["Feature Detection"] = feat_time

    # 3. OCR Validation & Currency Identification
    t3 = time.time()
    extracted_text = ocr_result.get("raw_text", "").upper()
    ocr_serials = ocr_result.get("parsed_serials", [])
    ocr_denoms = ocr_result.get("parsed_denominations", [])
    
    # Check Indian Currency (RBI text)
    is_indian_currency = "RESERVE BANK OF INDIA" in extracted_text or "RESERVE BANK" in extracted_text or "BHARATIYA RESERVE BANK" in extracted_text.replace(" ", "")
    
    if not is_indian_currency and len(ocr_denoms) == 0 and len(ocr_serials) == 0:
        logger.warning(f"Unsupported currency or unrecognizable image: {image_path}")
        raise HTTPException(status_code=400, detail="Unsupported currency. Only Indian Rupee (INR) banknotes are supported.")
        
    detected_currency = "Indian Rupee (INR)" if is_indian_currency else "Unknown/Unverified"
    detected_denomination = denomination if denomination in ocr_denoms else (ocr_denoms[0] if ocr_denoms else denomination)
    
    # Validate Serial Number Format (e.g. 1AA 123456 or 12A 345678)
    serial_format_valid = False
    valid_serials = []
    for s in ocr_serials:
        if len(s) >= 9: # Basic length check for standard INR serials
            serial_format_valid = True
            valid_serials.append(s)
            
    ocr_confidence = 100.0 if (is_indian_currency and serial_format_valid and detected_denomination == denomination) else (50.0 if (is_indian_currency or serial_format_valid) else 10.0)
    timeline["OCR Validation"] = round((time.time() - t3) * 1000, 2)

    # 4. Security Feature Detection (from OpenCV CV model)
    t4 = time.time()
    
    detected_features = cv_features.get("detected", [])
    missing_features = cv_features.get("missing", [])

    security_score = 100.0 - (len(missing_features) * 15.0)
    security_score = max(0.0, min(100.0, security_score))
    timeline["Security Features"] = round((time.time() - t4) * 1000, 2)

    # 5. Rule Engine
    t5 = time.time()
    rules_triggered = []
    rule_score = 100.0
    
    if not is_indian_currency:
        rules_triggered.append("Missing 'Reserve Bank of India' text.")
        rule_score -= 30.0
        
    if not serial_format_valid:
        rules_triggered.append("Invalid or missing serial number format.")
        rule_score -= 20.0
        
    if detected_denomination != denomination:
        rules_triggered.append(f"Denomination mismatch. Expected {denomination}, found OCR matches for {ocr_denoms}.")
        rule_score -= 25.0
        
    if len(missing_features) >= 3:
        rules_triggered.append(f"Multiple missing security features ({len(missing_features)}).")
        rule_score -= 25.0
        
    rule_score = max(0.0, min(100.0, rule_score))
    timeline["Rule Engine"] = round((time.time() - t5) * 1000, 2)

    # 6. Final Decision - Deterministic Counterfeit Risk Assessment
    t6 = time.time()
    
    # Weights: Security 40%, Rules 30%, OCR 20%, Image Quality 10%
    weighted_score = (security_score * 0.40) + (rule_score * 0.30) + (ocr_confidence * 0.20) + (quality_score * 0.10)
    
    counterfeit_risk = 100.0 - weighted_score
    
    if counterfeit_risk > 60.0:
        status_verdict = "SUSPICIOUS"
        recommendation = "High counterfeit risk detected. Do not accept this note. Perform manual verification."
    elif counterfeit_risk > 30.0:
        status_verdict = "NEEDS_MANUAL_VERIFICATION"
        recommendation = "Moderate risk. Some security features could not be verified. Check watermark and thread manually."
    else:
        status_verdict = "GENUINE"
        recommendation = "Note appears authentic based on visual security features and OCR validation."

    evidence = rules_triggered + [f"Missing features: {m['feature']}" for m in missing_features]
    if quality_score < 70.0:
        evidence.append("Image quality is poor, which reduces analysis confidence.")
        
    timeline["Decision Engine"] = round((time.time() - t6) * 1000, 2)
    
    # 7. AI Explanation
    t7 = time.time()
    gemini_context = {
        "detected_denomination": detected_denomination,
        "detected_currency": detected_currency,
        "quality_score": quality_score,
        "ocr_serials": valid_serials,
        "ocr_denoms": ocr_denoms,
        "detected_features": detected_features,
        "missing_features": missing_features,
        "rule_score": rule_score,
        "counterfeit_risk": counterfeit_risk,
        "rules_triggered": rules_triggered
    }
    
    try:
        gemini_raw = await asyncio.to_thread(run_gemini_vision, gemini_context, proc_path)
        gemini_result = parse_gemini_response(gemini_raw)
    except Exception as e:
        logger.error(f"Gemini API request failure: {e}")
        gemini_result = {
            "summary": "AI service temporarily unavailable.",
            "explanation": "Could not connect to Gemini.",
            "recommendation": recommendation
        }
    timeline["Gemini Explanation"] = round((time.time() - t7) * 1000, 2)

    # 8. Form unified report structure
    combined = {
        "status": status_verdict,
        "confidence": round(weighted_score, 2),
        "risk_score": round(counterfeit_risk, 2),
        "breakdown": {
            "gemini_confidence": 0.0, # Gemini does not decide authenticity
            "ocr_confidence": round(ocr_confidence, 2),
            "quality_score": round(quality_score, 2),
            "security_features_score": round(security_score, 2),
            "rule_engine_score": round(rule_score, 2)
        },
        "timeline": timeline,
        "ocr_data": {
            "easyocr_raw": ocr_result.get("raw_text"),
            "easyocr_serials": valid_serials,
            "easyocr_denominations": ocr_denoms,
            "detected_currency": detected_currency,
        },
        "reasons": evidence,
        "feature_highlights": detected_features,
        "missing_features": missing_features,
        "summary": gemini_result.get("summary", "Automated risk assessment completed."),
        "recommendation": gemini_result.get("recommendation", recommendation)
    }

    try:
        if proc_path != image_path and os.path.exists(proc_path):
            os.remove(proc_path)
    except Exception as e:
        logger.warning(f"Could not clean up temporary preprocessed image {proc_path}: {e}")

    return combined
