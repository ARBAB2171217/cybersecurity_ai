import re
import numpy as np
from app.services.forensics.models import *

class FeatureExtractor:
    def extract(self, context: PreprocessingContext) -> FeatureSet:
        raise NotImplementedError

class CurrencyFeatureExtractor(FeatureExtractor):
    def extract(self, context: PreprocessingContext) -> CurrencyFeatureSet:
        text = context.ocr_text.upper()
        compact = re.sub(r"\s+", "", text)
        
        has_rbi = "RESERVE BANK OF INDIA" in text or "RESERVEBANKOFINDIA" in compact
        has_rupee = "₹" in text or "RUPEE" in text
        
        serials = bool(re.search(r"\b\d[A-Z]{2}\s?\d{6}\b|\b\d{2}[A-Z]\s?\d{6}\b", text))
        denoms = bool(re.search(r'\b(10|20|50|100|200|500|2000)\b', text))
        
        ar = context.aspect_ratio
        is_curr_ar = (1.85 <= ar <= 2.55) or (0.39 <= ar <= 0.54)
        
        return CurrencyFeatureSet(
            is_valid=True,
            has_rbi_text=has_rbi,
            has_rupee_symbol=has_rupee,
            has_serial=serials,
            has_denomination=denoms,
            is_currency_aspect=is_curr_ar,
            has_security_thread=False,
            has_watermark=False,
            has_ashoka="ASHOKA" in text or "सत्यमेव" in text
        )

class ScreenshotFeatureExtractor(FeatureExtractor):
    def extract(self, context: PreprocessingContext) -> ScreenshotFeatureSet:
        text = context.ocr_text.lower()
        ar = context.aspect_ratio
        
        is_phone = (0.42 <= ar <= 0.85) or (1.15 <= ar <= 2.35)
        has_status = context.top_edges_density > 0.015
        has_nav = context.bottom_edges_density > 0.01
        has_chat = context.rectangular_ui_count >= 8
        has_clock = bool(re.search(r'\b\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?\b', text))
        has_batt = any(kw in text for kw in ["battery", "signal", "volte", "4g", "5g", "wifi"])
        has_wa = any(kw in text for kw in ["type a message", "online", "typing", "whatsapp"])
        has_pay = any(kw in text for kw in ["transaction successful", "utr", "upi id"])
        
        return ScreenshotFeatureSet(
            is_valid=True,
            is_phone_aspect=is_phone,
            has_status_bar=has_status,
            has_nav_bar=has_nav,
            has_chat_layout=has_chat,
            has_clock=has_clock,
            has_battery_network=has_batt,
            has_whatsapp_ui=has_wa,
            has_payment_ui=has_pay
        )

class DocumentFeatureExtractor(FeatureExtractor):
    def extract(self, context: PreprocessingContext) -> DocumentFeatureSet:
        ar = context.aspect_ratio
        is_doc = (0.60 <= ar <= 0.82) or (1.20 <= ar <= 1.70)
        has_dense = len(context.ocr_blocks) >= 8
        
        text = context.ocr_text.lower()
        has_kw = any(kw in text for kw in ["invoice", "receipt", "tax", "gst", "certificate"])
        
        return DocumentFeatureSet(
            is_valid=True,
            is_document_aspect=is_doc,
            has_dense_ocr=has_dense,
            has_margins=False,
            has_document_keywords=has_kw
        )

class QRFeatureExtractor(FeatureExtractor):
    def extract(self, context: PreprocessingContext) -> QRFeatureSet:
        return QRFeatureSet(
            is_valid=context.qr_detected,
            has_payload=context.qr_detected
        )
