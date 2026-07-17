import asyncio
from app.ai.pipelines.gemini_pipeline import run_gemini_vision, run_gemini_qr_analysis, run_gemini_screenshot_analysis

# Using a generic file that exists in the repo
# I will use any real image if it exists.
import glob
image_files = glob.glob("../frontend/public/*.png")
if not image_files:
    image_files = glob.glob("../frontend/public/*.svg")
    
if image_files:
    image_path = image_files[0]
else:
    image_path = "media/uploads/test.png" # still fails

async def test_all():
    print("Using image:", image_path)
    print("--- Testing Image Intelligence (Currency) ---")
    try:
        res = run_gemini_vision(image_path, 500, "ABC123456")
        print("Success")
    except Exception as e:
        print(f"FAILED: {e.__class__.__name__} - {e}")
        
    print("\n--- Testing QR Intelligence ---")
    try:
        res = run_gemini_qr_analysis({"qr_type": "URL", "decoded_value": "http://example.com", "risk_score": 50, "passed_checks": [], "failed_checks": []}, image_path)
        print("Success")
    except Exception as e:
        print(f"FAILED: {e.__class__.__name__} - {e}")
        
    print("\n--- Testing Screenshot Intelligence ---")
    try:
        res = run_gemini_screenshot_analysis({"category": "Unknown", "extracted_text": "Sample text", "risk_score": 50, "threat_level": "Medium", "triggered_rules": [], "entities": {}, "detected_elements": {}}, image_path)
        print("Success")
    except Exception as e:
        print(f"FAILED: {e.__class__.__name__} - {e}")
        
if __name__ == "__main__":
    asyncio.run(test_all())
