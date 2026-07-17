import cv2
import os
import logging
from typing import Dict, Any
from app.services.qr_type_classifier import QRTypeClassifier
from app.services.qr_analyzer import QRAnalyzerService

logger = logging.getLogger("app.services.qr_detection_service")

class QRDetectionService:
    """
    Engine to detect and decode QR codes from an image using OpenCV.
    Supports single or multiple QR codes in the same image.
    """

    @staticmethod
    def detect_and_decode(image_path: str) -> Dict[str, Any]:
        """Detects and decodes QR code(s) from an image."""
        if not os.path.exists(image_path):
            return {"qr_detected": False, "qr_count": 0, "error": "Image file not found."}

        image = cv2.imread(image_path)
        if image is None:
            return {"qr_detected": False, "qr_count": 0, "error": "Image could not be decoded."}

        decoded_values = []
        detector_used = None

        try:
            import pyzbar.pyzbar as pyzbar

            for candidate in (image, cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)):
                decoded_objects = pyzbar.decode(candidate)
                if decoded_objects:
                    decoded_values = [
                        obj.data.decode("utf-8", errors="replace")
                        for obj in decoded_objects
                        if obj.data
                    ]
                    detector_used = "pyzbar"
                    break
        except Exception as exc:
            logger.debug(f"pyzbar QR detection unavailable or failed: {exc}")

        if not decoded_values:
            detector = cv2.QRCodeDetector()
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            strategies = [image, gray]
            enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
            strategies.append(enhanced)
            _, otsu = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            strategies.append(otsu)

            for candidate in strategies:
                ok, decoded_info, _, _ = detector.detectAndDecodeMulti(candidate)
                if ok and decoded_info:
                    decoded_values = [value for value in decoded_info if value]
                    detector_used = "opencv-multi"
                    break
                value, _, _ = detector.detectAndDecode(candidate)
                if value:
                    decoded_values = [value]
                    detector_used = "opencv-single"
                    break

        decoded_values = list(dict.fromkeys(decoded_values))
        if not decoded_values:
            return {"qr_detected": False, "qr_count": 0}

        data = decoded_values[0]
        classification = QRTypeClassifier.classify(data)
        validation = QRAnalyzerService.analyze(classification.get("qr_type", "Unknown"), data)

        return {
            "qr_detected": True,
            "qr_count": len(decoded_values),
            "decoded_value": data,
            "decoded_values": decoded_values,
            "qr_type": classification.get("qr_type", "Unknown"),
            "confidence": classification.get("confidence", 1.0),
            "classification_reason": classification.get("classification_reason"),
            "extracted_information": validation.get("extracted_information", {}),
            "validation_status": validation.get("validation_status", "VALID"),
            "validation_errors": validation.get("validation_errors", []),
            "detector": detector_used,
        }
