import asyncio
import json
import logging
from app.config.settings import settings
# Overwrite key so it bypasses early checks
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
    
    # We also need a real image
    from PIL import Image
    img = Image.new('RGB', (600, 300), color = 'white')
    img.save('media/uploads/test.png')

    with patch.object(GeminiClient._model, 'generate_content', return_value=mock_response):
        from app.intelligence.currency.currency_pipeline import CurrencyIntelligencePipeline
        pipeline = CurrencyIntelligencePipeline(expected_denomination=500, expected_serial="123")
        res = await pipeline.execute('media/uploads/test.png')
        print(json.dumps(res, indent=2))

if __name__ == "__main__":
    asyncio.run(test_all())
