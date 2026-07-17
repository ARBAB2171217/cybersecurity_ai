import asyncio
from typing import Dict, Any
from app.ai.pipelines.gemini_pipeline import run_gemini_vision
from app.ai.parsers.response_parser import parse_gemini_response

class GeminiService:
    """
    Business service executing Gemini Flash Lite Vision analysis on currency notes.
    """
    def __init__(self):
        pass

    async def analyze_banknote(self, image_path: str, denomination: int, serial_number: str = None) -> Dict[str, Any]:
        """
        Calls Gemini Vision and returns normalized results.
        """
        raw_text = await asyncio.to_thread(
            run_gemini_vision,
            image_path,
            denomination,
            serial_number
        )
        return parse_gemini_response(raw_text)


