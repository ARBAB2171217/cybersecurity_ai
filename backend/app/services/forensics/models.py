from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class PreprocessingContext:
    original_path: str
    processed_path: str
    width: int
    height: int
    aspect_ratio: float
    format: str
    ocr_text: str
    ocr_blocks: List[Dict[str, Any]]
    ocr_confidence: float
    gray_image: Any = None
    rgb_image: Any = None
    edges: Any = None
    top_edges_density: float = 0.0
    bottom_edges_density: float = 0.0
    rectangular_ui_count: int = 0
    qr_payloads: List[Dict[str, Any]] = field(default_factory=list)
    qr_detected: bool = False
    error: Optional[str] = None
    
@dataclass
class FeatureSet:
    is_valid: bool = False

@dataclass
class CurrencyFeatureSet(FeatureSet):
    has_rbi_text: bool = False
    has_rupee_symbol: bool = False
    has_serial: bool = False
    has_denomination: bool = False
    is_currency_aspect: bool = False
    has_security_thread: bool = False
    has_watermark: bool = False
    has_ashoka: bool = False

@dataclass
class ScreenshotFeatureSet(FeatureSet):
    is_phone_aspect: bool = False
    has_status_bar: bool = False
    has_nav_bar: bool = False
    has_chat_layout: bool = False
    has_clock: bool = False
    has_battery_network: bool = False
    has_whatsapp_ui: bool = False
    has_payment_ui: bool = False

@dataclass
class DocumentFeatureSet(FeatureSet):
    is_document_aspect: bool = False
    has_dense_ocr: bool = False
    has_margins: bool = False
    has_document_keywords: bool = False

@dataclass
class QRFeatureSet(FeatureSet):
    has_payload: bool = False
