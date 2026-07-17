import asyncio
import os
import uuid
from app.services.evidence_engine import EvidenceIntelligenceEngine
from app.ai.pipelines.gemini_pipeline import run_gemini_vision, run_gemini_qr_analysis, run_gemini_screenshot_analysis

async def test_all():
    print("--- Testing Image Intelligence (Currency) ---")
    try:
        res = run_gemini_vision("media/uploads/test.png", 500, "ABC123456")
        print("Success")
    except Exception as e:
        print(f"FAILED: {e.__class__.__name__} - {e}")
        
    print("\n--- Testing QR Intelligence ---")
    try:
        res = run_gemini_qr_analysis({"qr_type": "URL", "decoded_value": "http://example.com", "risk_score": 50, "passed_checks": [], "failed_checks": []}, "media/uploads/test.png")
        print("Success")
    except Exception as e:
        print(f"FAILED: {e.__class__.__name__} - {e}")
        
    print("\n--- Testing Screenshot Intelligence ---")
    try:
        res = run_gemini_screenshot_analysis({"category": "Unknown", "extracted_text": "Sample text", "risk_score": 50, "threat_level": "Medium", "triggered_rules": [], "entities": {}, "detected_elements": {}}, "media/uploads/test.png")
        print("Success")
    except Exception as e:
        print(f"FAILED: {e.__class__.__name__} - {e}")
        
    print("\n--- Testing Evidence Engine (Screenshot) ---")
    try:
        res = await EvidenceIntelligenceEngine.analyze_screenshot("media/uploads/test.png", "test.png")
        print("Success")
    except Exception as e:
        print(f"FAILED: {e.__class__.__name__} - {e}")

if __name__ == "__main__":
    asyncio.run(test_all())
