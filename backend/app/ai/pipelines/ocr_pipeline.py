import re
import logging
from typing import Dict, Any

logger = logging.getLogger("app.ai.pipelines.ocr_pipeline")

# Lazy-loaded Reader
_reader = None

def get_ocr_reader():
    """
    Returns or instantiates a thread-safe EasyOCR Reader.
    Uses CPU by default to maintain stability inside containers.
    """
    global _reader
    if _reader is None:
        import easyocr
        logger.info("Initializing EasyOCR Reader model...")
        _reader = easyocr.Reader(['en', 'hi'], gpu=False)
    return _reader

def run_ocr(image_path: str) -> Dict[str, Any]:
    """
    Runs text extraction on the image, parsing candidate serial numbers and denominations.
    """
    try:
        reader = get_ocr_reader()
        results = reader.readtext(image_path)
        
        blocks = []
        raw_strings = []
        
        for bbox, text, confidence in results:
            blocks.append({
                "text": text,
                "confidence": float(confidence),
                "bbox": [[int(pt[0]), int(pt[1])] for pt in bbox]
            })
            raw_strings.append(text)
            
        full_raw_text = " ".join(raw_strings)
        logger.info(f"OCR Raw Result: '{full_raw_text}'")

        # Extract potential Indian Banknote Serial Numbers via regex matching:
        # Formats: 1AA 123456 (modern) or 12A 345678 (older series)
        serials = []
        for text in raw_strings:
            # Strip non-alphanumeric characters to handle OCR spacing issues
            cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
            match = re.search(r'\d[A-Z]{2}\d{6}|\d{2}[A-Z]\d{6}', cleaned)
            if match:
                serials.append(match.group())

        # Extract denomination numbers matching Indian Banknote denominations
        denominations = []
        for text in raw_strings:
            match = re.search(r'\b(10|20|50|100|200|500|2000)\b', text)
            if match:
                denominations.append(int(match.group()))

        return {
            "raw_text": full_raw_text,
            "blocks": blocks,
            "parsed_serials": list(set(serials)),
            "parsed_denominations": list(set(denominations))
        }
        
    except Exception as e:
        logger.error(f"OCR execution failed: {e}", exc_info=True)
        return {
            "raw_text": "",
            "blocks": [],
            "parsed_serials": [],
            "parsed_denominations": []
        }
