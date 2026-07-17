import os
import re
import logging
from typing import Dict, Any, List, Tuple, Optional

import cv2
import numpy as np

from app.ai.pipelines.ocr_pipeline import run_ocr
from app.ai.pipelines.preprocessing import preprocess_universal_image
from app.services.qr_detection_service import QRDetectionService

logger = logging.getLogger("app.services.classification_service")


class EvidenceClassificationService:
    """
    Deterministic image classifier for the Universal Scanner.
    Gemini is intentionally not used here. Routing decisions come only from
    QR decoding, OCR, geometry, layout, and CV heuristics.
    """

    CURRENCY_THRESHOLD = 0.58
    SCREENSHOT_THRESHOLD = 0.55
    DOCUMENT_THRESHOLD = 0.55

    @staticmethod
    def classify(
        image_path: str,
        preprocessing: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not os.path.exists(image_path):
            return EvidenceClassificationService._unknown("File not found")

        try:
            preprocessing = preprocessing or preprocess_universal_image(image_path)
        except ValueError as exc:
            return {
                "evidence_type": "Unknown",
                "detected_type": "Unknown",
                "confidence": 0.0,
                "selected_pipeline": "Rejected",
                "summary": str(exc),
                "error": str(exc),
            }

        processed_path = preprocessing.get("processed_path") or image_path

        # 1. QR Detection has highest priority and returns immediately.
        qr_result = EvidenceClassificationService._detect_qr(processed_path)
        if qr_result.get("qr_detected"):
            return {
                "evidence_type": "QR Code",
                "detected_type": "QR Code",
                "confidence": float(qr_result.get("confidence", 1.0)),
                "selected_pipeline": "QR Pipeline",
                "summary": f"QR Code detected using {qr_result.get('detector', 'deterministic detector')}.",
                "preprocessing": preprocessing,
                "qr_details": qr_result,
                "cached": {"preprocessing": preprocessing},
            }

        img = cv2.imread(processed_path)
        if img is None:
            return EvidenceClassificationService._unknown("Preprocessed image could not be read")

        ocr_result = EvidenceClassificationService._run_ocr_once(processed_path)
        text = ocr_result.get("raw_text", "")
        text_upper = text.upper()
        text_lower = text.lower()
        height, width = img.shape[:2]
        aspect_ratio = width / float(height) if height else 0.0
        blocks = ocr_result.get("blocks", [])

        currency_score, currency_evidence = EvidenceClassificationService._score_currency(
            img=img,
            text_upper=text_upper,
            ocr_result=ocr_result,
            aspect_ratio=aspect_ratio,
        )
        if currency_score >= EvidenceClassificationService.CURRENCY_THRESHOLD:
            denomination = EvidenceClassificationService._first_or_none(ocr_result.get("parsed_denominations", []))
            serial = EvidenceClassificationService._first_or_none(ocr_result.get("parsed_serials", []))
            return EvidenceClassificationService._result(
                detected_type="Currency",
                confidence=currency_score,
                selected_pipeline="Currency Pipeline",
                evidence=currency_evidence,
                preprocessing=preprocessing,
                ocr_result=ocr_result,
                extra={
                    "detected_denomination": denomination,
                    "detected_serial": serial,
                },
            )

        screenshot_score, screenshot_evidence = EvidenceClassificationService._score_screenshot(
            img=img,
            text_lower=text_lower,
            aspect_ratio=aspect_ratio,
        )
        if screenshot_score >= EvidenceClassificationService.SCREENSHOT_THRESHOLD:
            return EvidenceClassificationService._result(
                detected_type="Screenshot",
                confidence=screenshot_score,
                selected_pipeline="Screenshot Pipeline",
                evidence=screenshot_evidence,
                preprocessing=preprocessing,
                ocr_result=ocr_result,
            )

        document_score, document_evidence = EvidenceClassificationService._score_document(
            img=img,
            text_lower=text_lower,
            aspect_ratio=aspect_ratio,
            blocks=blocks,
        )
        if document_score >= EvidenceClassificationService.DOCUMENT_THRESHOLD:
            return EvidenceClassificationService._result(
                detected_type="Document",
                confidence=document_score,
                selected_pipeline="Document Pipeline",
                evidence=document_evidence,
                preprocessing=preprocessing,
                ocr_result=ocr_result,
            )

        return {
            "evidence_type": "Unknown",
            "detected_type": "Unknown",
            "confidence": round(max(currency_score, screenshot_score, document_score), 2),
            "selected_pipeline": "Generic Vision Analysis",
            "summary": "No deterministic class exceeded threshold.",
            "preprocessing": preprocessing,
            "ocr_result": ocr_result,
            "classification_scores": {
                "currency": round(currency_score, 2),
                "screenshot": round(screenshot_score, 2),
                "document": round(document_score, 2),
            },
            "evidence": {
                "currency": currency_evidence,
                "screenshot": screenshot_evidence,
                "document": document_evidence,
            },
            "cached": {
                "preprocessing": preprocessing,
                "ocr_result": ocr_result,
            },
        }

    @staticmethod
    def _detect_qr(image_path: str) -> Dict[str, Any]:
        try:
            return QRDetectionService.detect_and_decode(image_path)
        except Exception as exc:
            logger.warning(f"Deterministic QR check failed: {exc}")
            return {"qr_detected": False, "qr_count": 0, "error": str(exc)}

    @staticmethod
    def _run_ocr_once(image_path: str) -> Dict[str, Any]:
        try:
            return run_ocr(image_path)
        except Exception as exc:
            logger.warning(f"OCR failed during deterministic classification: {exc}")
            return {"raw_text": "", "blocks": [], "parsed_serials": [], "parsed_denominations": []}

    @staticmethod
    def _score_currency(
        img: np.ndarray,
        text_upper: str,
        ocr_result: Dict[str, Any],
        aspect_ratio: float,
    ) -> Tuple[float, List[str]]:
        score = 0.0
        total = 1.0
        evidence: List[str] = []

        def add(condition: bool, weight: float, label: str) -> None:
            nonlocal score
            if condition:
                score += weight
                evidence.append(label)

        denoms = ocr_result.get("parsed_denominations", [])
        serials = ocr_result.get("parsed_serials", [])
        compact = re.sub(r"\s+", "", text_upper)

        add("RESERVE BANK OF INDIA" in text_upper or "RESERVEBANKOFINDIA" in compact, 0.22, "RBI title detected by OCR")
        add("₹" in text_upper or "RUPEE" in text_upper or "RUPEES" in text_upper, 0.10, "Rupee marker detected")
        add("GOVERNOR" in text_upper, 0.10, "Governor signature text detected")
        add(bool(serials) or bool(re.search(r"\b\d[A-Z]{2}\s?\d{6}\b|\b\d{2}[A-Z]\s?\d{6}\b", text_upper)), 0.12, "Indian banknote serial pattern detected")
        add(bool(denoms), 0.10, "Supported denomination detected")
        add((1.85 <= aspect_ratio <= 2.55) or (0.39 <= aspect_ratio <= 0.54), 0.12, "Indian banknote aspect ratio")

        height, width = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        if width and height:
            thread_band = gray[:, int(width * 0.42): int(width * 0.58)]
            side_band = gray[:, : max(1, int(width * 0.18))]
            center_band = gray[:, int(width * 0.35): int(width * 0.65)]
            add(thread_band.size > 0 and float(np.std(thread_band)) > 18.0, 0.08, "Security-thread region has high edge/contrast variance")
            add(side_band.size > 0 and abs(float(np.mean(side_band)) - float(np.mean(center_band))) > 4.0, 0.05, "Watermark-side region differs from center print")

        circles = cv2.HoughCircles(
            cv2.medianBlur(gray, 5),
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=max(20, min(width, height) // 8),
            param1=70,
            param2=26,
            minRadius=8,
            maxRadius=max(12, min(width, height) // 8),
        )
        add(circles is not None or "RBI" in text_upper or "भारत" in text_upper, 0.06, "RBI seal or emblem-like marker detected")
        add("ASHOKA" in text_upper or "सत्यमेव" in text_upper or "LION" in text_upper, 0.05, "Ashoka emblem text/marker detected")

        return min(score / total, 1.0), evidence

    @staticmethod
    def _score_screenshot(
        img: np.ndarray,
        text_lower: str,
        aspect_ratio: float,
    ) -> Tuple[float, List[str]]:
        score = 0.0
        evidence: List[str] = []

        def add(condition: bool, weight: float, label: str) -> None:
            nonlocal score
            if condition:
                score += weight
                evidence.append(label)

        screenshot_keywords = [
            "whatsapp", "telegram", "type a message", "online", "typing",
            "gmail", "inbox", "subject:", "from:", "to:", "sms", "otp",
            "paytm", "phonepe", "gpay", "google pay", "bhim", "upi",
            "transaction id", "txn id", "paid successfully", "debited",
            "credited", "chrome", "safari", "search or type web address",
            "instagram", "facebook", "linkedin", "notification",
        ]
        keyword_hits = [kw for kw in screenshot_keywords if kw in text_lower]
        add(len(keyword_hits) >= 1, 0.18, f"Screenshot UI text detected: {', '.join(keyword_hits[:4])}")
        add(len(keyword_hits) >= 3, 0.12, "Multiple app/payment/browser UI terms detected")
        add((0.42 <= aspect_ratio <= 0.85) or (1.15 <= aspect_ratio <= 2.35), 0.10, "Phone or desktop screenshot aspect ratio")

        # Clock pattern check
        has_clock = bool(re.search(r'\b\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?\b', text_lower))
        add(has_clock, 0.08, "Clock/Time pattern detected")

        # Battery / Signal / Network check
        has_battery_or_signal = any(kw in text_lower for kw in ["battery", "signal", "volte", "lte", "4g", "5g", "wifi", "wi-fi"]) or bool(re.search(r'\b\d{1,2}%\s*(?:battery)?\b', text_lower))
        add(has_battery_or_signal, 0.08, "Battery/Network indicator detected")

        height, width = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        if height and width:
            top = gray[: max(1, int(height * 0.08)), :]
            bottom = gray[int(height * 0.92):, :]
            top_edges = cv2.Canny(top, 60, 160)
            bottom_edges = cv2.Canny(bottom, 60, 160)
            add(float(np.mean(top_edges > 0)) > 0.015, 0.10, "Status-bar/header icon density detected")
            add(float(np.mean(bottom_edges > 0)) > 0.01, 0.07, "Navigation/footer bar icon density detected")

            _, threshold = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY_INV)
            components, _, stats, _ = cv2.connectedComponentsWithStats(threshold, 8)
            rectangular_ui = 0
            for i in range(1, components):
                x, y, w, h, area = stats[i]
                if 20 <= w <= width * 0.95 and 12 <= h <= height * 0.35 and area > 100:
                    rectangular_ui += 1
            add(rectangular_ui >= 8, 0.10, "Repeated UI rows or chat-bubble blocks detected")

        payment_receipt = any(
            kw in text_lower
            for kw in ["transaction successful", "paid successfully", "utr", "ref no", "reference no", "amount", "upi id"]
        )
        add(payment_receipt, 0.13, "UPI/payment receipt layout text detected")

        return min(score, 1.0), evidence

    @staticmethod
    def _score_document(
        img: np.ndarray,
        text_lower: str,
        aspect_ratio: float,
        blocks: List[Dict[str, Any]],
    ) -> Tuple[float, List[str]]:
        score = 0.0
        evidence: List[str] = []

        def add(condition: bool, weight: float, label: str) -> None:
            nonlocal score
            if condition:
                score += weight
                evidence.append(label)

        doc_keywords = [
            "invoice", "receipt", "bill", "tax", "gst", "form", "certificate",
            "government", "ministry", "application", "declaration", "address",
            "date", "signature", "pdf", "page", "total", "amount due",
            "letter", "dear", "statement", "passport", "aadhaar", "pan card",
            "driving license", "doc", "document", "verification", "certify"
        ]
        keyword_hits = [kw for kw in doc_keywords if kw in text_lower]
        add(len(keyword_hits) >= 2, 0.20, f"Document text detected: {', '.join(keyword_hits[:4])}")
        add(0.60 <= aspect_ratio <= 0.82 or 1.20 <= aspect_ratio <= 1.70, 0.12, "Paper/PDF page aspect ratio")
        add(len(blocks) >= 8, 0.12, "Dense OCR text blocks detected")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        bright_ratio = float(np.mean(gray > 210))
        add(bright_ratio > 0.45, 0.09, "Document-like light background")

        edges = cv2.Canny(gray, 60, 160)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        page_like = False
        area = img.shape[0] * img.shape[1]
        for contour in contours:
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            if len(approx) == 4 and cv2.contourArea(contour) > area * 0.35:
                page_like = True
                break
        add(page_like, 0.10, "Large rectangular document boundary detected")

        return min(score, 1.0), evidence

    @staticmethod
    def _result(
        detected_type: str,
        confidence: float,
        selected_pipeline: str,
        evidence: List[str],
        preprocessing: Dict[str, Any],
        ocr_result: Dict[str, Any],
        extra: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        result = {
            "evidence_type": detected_type,
            "detected_type": detected_type,
            "confidence": round(confidence, 2),
            "selected_pipeline": selected_pipeline,
            "summary": f"{detected_type} classified deterministically.",
            "evidence": evidence,
            "preprocessing": preprocessing,
            "ocr_result": ocr_result,
            "cached": {
                "preprocessing": preprocessing,
                "ocr_result": ocr_result,
            },
        }
        if extra:
            result.update(extra)
        return result

    @staticmethod
    def _unknown(reason: str) -> Dict[str, Any]:
        return {
            "evidence_type": "Unknown",
            "detected_type": "Unknown",
            "confidence": 0.0,
            "selected_pipeline": "Generic Vision Analysis",
            "summary": reason,
        }

    @staticmethod
    def _first_or_none(values: List[Any]) -> Any:
        return values[0] if values else None
