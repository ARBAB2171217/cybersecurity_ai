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
        "human_explanation": "Test explanation.",
        "evidence_summary": ["test"]
    })

    with patch('app.ai.pipelines.preprocessing.assess_image_quality', return_value={"quality_status": "ACCEPTABLE", "quality_score": 90}), \
         patch('app.ai.pipelines.preprocessing.preprocess_image', return_value="media/uploads/test.png"), \
         patch('app.ai.pipelines.preprocessing.preprocess_for_ocr', return_value="media/uploads/test.png"), \
         patch('app.ai.pipelines.ocr_pipeline.run_ocr', return_value={"raw_text": "RESERVE BANK OF INDIA 500", "parsed_denominations": [500], "parsed_serials": ["123"]}), \
         patch.object(GeminiClient._model, 'generate_content', return_value=mock_response):
        
        from app.intelligence.currency.currency_pipeline import CurrencyIntelligencePipeline
        pipeline = CurrencyIntelligencePipeline(expected_denomination=500, expected_serial="123")
        res = await pipeline.execute('media/uploads/test.png')
        print(json.dumps(res, indent=2))

if __name__ == "__main__":
    asyncio.run(test_all())
