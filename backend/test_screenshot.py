import asyncio
import json
import logging
from app.config.settings import settings
settings.GEMINI_API_KEY = "dummy-valid-key-for-test-xyz123"
from app.services.gemini_client import GeminiClient

async def test_all():
    GeminiClient.validate_startup()

    from unittest.mock import patch, MagicMock
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "threat_summary": "Test explanation.",
        "scam_category": "Phishing",
        "threat_severity": "High",
        "ai_confidence": 0.9,
        "key_findings": ["test"],
        "risk_explanation": "why risky",
        "prevention_tips": ["dont click"],
        "final_recommendation": "Avoid Completely"
    })

    with patch('app.ai.pipelines.preprocessing.assess_image_quality', return_value={"quality_status": "ACCEPTABLE", "quality_score": 90}), \
         patch('app.ai.pipelines.ocr_pipeline.run_ocr', return_value={"raw_text": "Please send money to UPI ID scammer@okicici immediately", "blocks": []}), \
         patch.object(GeminiClient._model, 'generate_content', return_value=mock_response):
        
        from app.services.evidence_engine import EvidenceIntelligenceEngine
        # create dummy image
        from PIL import Image
        img = Image.new('RGB', (600, 300), color = 'white')
        img.save('media/uploads/test.png')
        
        res = await EvidenceIntelligenceEngine.analyze_screenshot('media/uploads/test.png', 'test.png')
        print(json.dumps(res, indent=2))

if __name__ == "__main__":
    asyncio.run(test_all())
