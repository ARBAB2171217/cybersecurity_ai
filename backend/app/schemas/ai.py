"""
Pydantic schemas for the AI currency detection request and result payloads.
These types are returned inside StandardResponse[ReportResponse] — the AI
analysis data is embedded in raw_ai_response on the Report model.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GeminiOcrData(BaseModel):
    """Structured OCR data extracted by Gemini Vision from the banknote image."""
    serial_number: Optional[str] = None
    denomination: Optional[int] = None
    year_of_printing: Optional[str] = None


class CombinedOcrData(BaseModel):
    """Combined OCR output from both EasyOCR and Gemini Vision."""
    easyocr_raw: Optional[str] = None
    easyocr_serials: Optional[List[str]] = Field(default_factory=list)
    easyocr_denominations: Optional[List[int]] = Field(default_factory=list)
    gemini_extracted: Optional[GeminiOcrData] = None


class DetectionPipelineResult(BaseModel):
    """
    Strict JSON contract returned by the AI detection pipeline.
    This is stored in Report.raw_ai_response and returned to the frontend.
    """
    status: str = Field(
        description="GENUINE | FAKE | SUSPICIOUS",
        pattern="^(GENUINE|FAKE|SUSPICIOUS)$",
    )
    confidence: float = Field(ge=0.0, le=1.0, description="AI confidence score (0–1)")
    risk_score: float = Field(ge=0.0, le=100.0, description="Composite risk score (0–100)")
    ocr_data: CombinedOcrData = Field(default_factory=CombinedOcrData)
    reasons: List[str] = Field(default_factory=list, description="Human-readable decision reasons")
    summary: Optional[str] = None
    recommendation: Optional[str] = None


class ScanRequest(BaseModel):
    """
    Form-encoded input for POST /api/v1/detection/scan and /analyze.
    Note: file is handled separately as UploadFile by FastAPI.
    """
    denomination: int = Field(
        description="Official Indian Rupee denomination (10, 20, 50, 100, 200, 500, 2000)"
    )
    serial_number: Optional[str] = Field(
        None,
        description="Optional physical serial number printed on the banknote",
    )
