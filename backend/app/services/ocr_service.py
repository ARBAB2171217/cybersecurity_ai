import asyncio
from typing import Dict, Any
from app.ai.pipelines.ocr_pipeline import run_ocr

class OCRService:
    """
    Business service orchestrating optical character recognition on currency note scans.
    """
    def __init__(self):
        pass

    async def extract_text(self, image_path: str) -> Dict[str, Any]:
        """
        Runs EasyOCR parsing inside a worker thread to keep execution non-blocking.
        """
        return await asyncio.to_thread(run_ocr, image_path)
