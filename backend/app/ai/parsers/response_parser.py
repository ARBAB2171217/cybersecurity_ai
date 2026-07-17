import json
import logging
from typing import Dict, Any, Union

logger = logging.getLogger("app.ai.parsers.response_parser")


def parse_gemini_response(raw_input: Union[str, dict]) -> Dict[str, Any]:
    """
    Parses and sanitizes raw output from the Gemini API into a standardized
    schema dict. Handles both string (JSON) and dict inputs defensively.
    Provides safe fallbacks for any parsing or structural validation errors.
    """
    # If a dict was passed directly (e.g. from mock or already-parsed result)
    if isinstance(raw_input, dict):
        data = raw_input
    else:
        cleaned = str(raw_input).strip()

        # Strip markdown block formatting if present
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "", 1)
            cleaned = cleaned.replace("```", "", 1)
            cleaned = cleaned.strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(
                f"JSON parsing failed for Gemini response: {e}. "
                f"Raw (first 500 chars): {str(raw_input)[:500]}"
            )
            return {
                "status": "SUSPICIOUS",
                "confidence": 0.0,
                "risk_score": 100.0,
                "ocr_data": {},
                "reasons": ["AI system returned an invalid response format."],
                "summary": "AI output could not be decoded as JSON.",
                "recommendation": "Perform manual administrator verification.",
            }

    # Extract and normalize fields with safe type coercion
    status_val = str(data.get("status", "SUSPICIOUS")).strip().upper()
    if status_val not in {"GENUINE", "FAKE", "SUSPICIOUS"}:
        status_val = "SUSPICIOUS"

    try:
        confidence = float(data.get("confidence", 0.0))
        confidence = max(0.0, min(1.0, confidence))
    except (TypeError, ValueError):
        confidence = 0.0

    try:
        risk_score = float(data.get("risk_score", 0.0))
        risk_score = max(0.0, min(100.0, risk_score))
    except (TypeError, ValueError):
        risk_score = 0.0

    reasons = data.get("reasons", [])
    if not isinstance(reasons, list):
        reasons = [str(reasons)] if reasons else ["No specific reasons provided."]

    return {
        "status": status_val,
        "confidence": confidence,
        "risk_score": risk_score,
        "ocr_data": data.get("ocr_data", {}),
        "reasons": reasons,
        "summary": str(data.get("summary", "No summary provided.")),
        "recommendation": str(data.get("recommendation", "No recommendation provided.")),
    }
