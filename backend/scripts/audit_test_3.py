import asyncio
import json
import logging
from unittest.mock import patch, MagicMock

from app.config.settings import settings
# Overwrite key so it bypasses early checks
settings.GEMINI_API_KEY = "dummy-valid-key-for-test-xyz123"

from app.services.gemini_client import GeminiClient

import glob
image_files = glob.glob("../frontend/public/*.png")
if not image_files:
    image_files = glob.glob("../frontend/public/*.svg")
    
if image_files:
    image_path = image_files[0]
else:
    image_path = "media/uploads/test.png"

async def test_all():
    print("Using image:", image_path)

    # Initialize client manually for the test
    GeminiClient.validate_startup()

    # Mock the internal model
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "status": "SAFE",
        "threat_level": "Low",
        "risk_score": 10,
        "confidence": 0.95,
        "summary": "AI Verified Safe",
        "technical_findings": ["Valid OCR", "Valid Pattern"],
        "suspicious_indicators": [],
        "recommendation": "Safe to proceed",
        "ai_summary": "Verified Safe",
        "explanation": "No threats found",
        "threat_summary": "Safe link",
        "ai_risk_score": 10,
        "ai_confidence": 0.99
    })
    
    with patch.object(GeminiClient._model, 'generate_content', return_value=mock_response):
        print("\n--- Testing Image Intelligence (Currency) ---")
        from app.ai.pipelines.gemini_pipeline import run_gemini_vision
        res = run_gemini_vision(image_path, 500, "ABC123456")
        print("Response:", res[:100], "...")
        print("Success" if "AI Verified Safe" in res else "Failed")

        print("\n--- Testing QR Intelligence ---")
        from app.ai.pipelines.gemini_pipeline import run_gemini_qr_analysis
        res = run_gemini_qr_analysis({"qr_type": "URL", "decoded_value": "http://example.com", "risk_score": 50, "passed_checks": [], "failed_checks": []}, image_path)
        print("Response:", res[:100], "...")
        print("Success" if "Verified Safe" in res else "Failed")

        print("\n--- Testing Screenshot Intelligence ---")
        from app.ai.pipelines.gemini_pipeline import run_gemini_screenshot_analysis
        res = run_gemini_screenshot_analysis({"category": "Unknown", "extracted_text": "Sample text", "risk_score": 50, "threat_level": "Medium", "triggered_rules": [], "entities": {}, "detected_elements": {}}, image_path)
        print("Response:", res[:100], "...")
        print("Success" if "Verified Safe" in res else "Failed")
        
        print("\n--- Testing Currency pipeline ---")
        from app.intelligence.shared.gemini_reasoner import execute_gemini_reasoning
        res = await execute_gemini_reasoning("Test Prompt", image_path)
        print("Response:", res)
        print("Success" if res.get("status") == "SAFE" else "Failed")

if __name__ == "__main__":
    asyncio.run(test_all())
