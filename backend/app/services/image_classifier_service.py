import os
import cv2
import numpy as np
import logging
from PIL import Image
from typing import Dict, Any, Tuple
from app.services.qr_detection_service import QRDetectionService
from app.ai.pipelines.ocr_pipeline import run_ocr

logger = logging.getLogger("app.services.image_classifier_service")

class ImageClassifierService:
    @staticmethod
    def classify(image_path: str) -> Dict[str, Any]:
        """
        Deterministically classifies the image into:
        Currency Note, QR Code, WhatsApp Screenshot, SMS Screenshot, 
        Email Screenshot, UPI Receipt, Bank Receipt, Document, Unknown Image.
        """
        if not os.path.exists(image_path):
            return {"detected_type": "Unknown Image", "confidence": 0.0}

        # 1. Check for QR Code
        try:
            qr_result = QRDetectionService.detect_and_decode(image_path)
            if qr_result and qr_result.get("qr_detected") and qr_result.get("qr_count", 0) > 0:
                return {
                    "detected_type": "QR Code",
                    "confidence": qr_result.get("confidence", 0.99),
                    "qr_details": qr_result
                }
        except Exception as e:
            logger.warning(f"QR detection failed during classification: {e}")

        # Load image for OCR and OpenCV heuristics
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {"detected_type": "Unknown Image", "confidence": 0.0}
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            height, width = img.shape[:2]
            aspect_ratio = float(width) / float(height)

            # Check if aspect ratio matches Indian Currency (typically ~2.2 or ~0.45 if rotated)
            is_currency_ratio = (2.0 < aspect_ratio < 2.5) or (0.4 < aspect_ratio < 0.5)
            
            # Fast OCR
            try:
                ocr_result = run_ocr(image_path)
                text = ocr_result.get("raw_text", "").lower()
            except Exception as e:
                logger.warning(f"OCR failed during classification: {e}")
                text = ""

            # Keywords mapping
            keywords = {
                "UPI Receipt": ["upi", "paytm", "phonepe", "gpay", "successful", "transaction id", "paid to"],
                "Bank Receipt": ["bank", "account", "balance", "transfer", "neft", "rtgs", "ifsc", "statement"],
                "WhatsApp Screenshot": ["type a message", "online", "typing...", "whatsapp", "yesterday", "today"],
                "SMS Screenshot": ["text message", "sms", "sender id", "sent as text", "inbox"],
                "Email Screenshot": ["from:", "to:", "subject:", "compose email", "gmail", "outlook", "inbox"],
                "Currency Note": ["reserve bank of india", "rupees", "gandhi", "bharat"]
            }

            best_match = "Unknown Image"
            highest_score = 0
            
            # Heuristics based text search
            for category, kws in keywords.items():
                score = sum(1 for kw in kws if kw in text)
                if category == "Currency Note" and is_currency_ratio:
                    score += 2  # Aspect ratio boost
                
                if score > highest_score:
                    highest_score = score
                    best_match = category

            confidence = min(highest_score * 0.2 + 0.4, 0.95) if highest_score > 0 else 0.5
            
            # If nothing matched but aspect ratio is currency-like, assume currency with low confidence
            if best_match == "Unknown Image" and is_currency_ratio:
                best_match = "Currency Note"
                confidence = 0.6

            return {
                "detected_type": best_match,
                "confidence": round(confidence, 2)
            }
            
        except Exception as e:
            logger.error(f"Image classification failed: {e}")
            return {"detected_type": "Unknown Image", "confidence": 0.0}
