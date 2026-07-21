import asyncio
import numpy as np
from app.services.classification_service import EvidenceClassificationService

def test_mock_screenshot():
    text_lower = "whatsapp online typing... type a message yesterday 12:30 pm 55% battery wifi"
    aspect_ratio = 0.5
    img = np.zeros((1920, 1080, 3), dtype=np.uint8)
    
    score, evidence = EvidenceClassificationService._score_screenshot(img, text_lower, aspect_ratio)
    print(f"Score: {score}")
    print(f"Evidence: {evidence}")

if __name__ == "__main__":
    test_mock_screenshot()
