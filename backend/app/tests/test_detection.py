import pytest
import uuid
import datetime
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch
from app.main import app
from app.dependencies.auth import get_current_user
from app.routers.scanner import get_report_service, get_ai_detection_service
from app.models.report import ReportStatus

client = TestClient(app)

class MockReport:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

mock_user_id = uuid.UUID("11111111-2222-3333-4444-555555555555")

@pytest.fixture(autouse=True)
def setup_dependencies():
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_user] = lambda: MockReport(
        id=mock_user_id,
        email="citizen@gmail.com",
        full_name="John Doe",
        is_active=True
    )
    yield
    app.dependency_overrides.clear()

def test_scan_note_invalid_denomination():
    with patch('app.routers.scanner.preprocess_universal_image', return_value={"processed_path": "/media/uploads/fake.jpg"}), \
         patch('app.routers.scanner.EvidenceClassificationService.classify', return_value={"detected_type": "Currency", "confidence": 0.95, "selected_pipeline": "Currency Pipeline", "detected_denomination": 300, "detected_serial": "9AA123456"}):
        response = client.post(
            "/api/v1/scanner/scan",
            data={"denomination": 300, "serial_number": "9AA123456"},
            files={"file": ("test.jpg", b"fake-image-data", "image/jpeg")},
            headers={"Authorization": "Bearer mocktoken"}
        )
        assert response.status_code == 400
        assert response.json()["success"] is False
        assert "denomination" in response.json()["message"].lower()

def test_scan_note_success():
    mock_url = "/media/uploads/fake.jpg"
    
    mock_report = MockReport(
        id=uuid.UUID("88888888-9999-0000-1111-222222222222"),
        user_id=mock_user_id,
        denomination=500,
        serial_number="9AA123456",
        image_url=mock_url,
        status=ReportStatus.PENDING,
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
        deleted_at=None
    )

    mock_analyzed = MockReport(
        id=uuid.UUID("88888888-9999-0000-1111-222222222222"),
        user_id=mock_user_id,
        denomination=500,
        serial_number="9AA123456",
        image_url=mock_url,
        is_counterfeit=False,
        confidence_score=0.95,
        status=ReportStatus.APPROVED,
        ocr_text="9AA123456",
        raw_ai_response={"status": "GENUINE", "confidence": 0.95},
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
        deleted_at=None,
        category="Counterfeit Currency",
        title="Currency Scan",
        description=None,
        incident_date=None,
        incident_time=None,
        location=None,
        priority=None,
        evidence=[],
        visibility="PRIVATE",
        likes_count=0,
        comments_count=0,
        bookmarks_count=0,
        views_count=0,
        verification_count=0,
        trending_score=0.0
    )

    mock_upload = AsyncMock()
    mock_upload.save_uploaded_image = AsyncMock(return_value=mock_url)
    
    mock_report_service = MagicMock()
    mock_report_service.create_report = AsyncMock(return_value=mock_report)
    
    mock_ai_service = MagicMock()
    mock_ai_service.analyze_currency_note = AsyncMock(return_value=mock_analyzed)

    app.dependency_overrides[get_report_service] = lambda: mock_report_service
    app.dependency_overrides[get_ai_detection_service] = lambda: mock_ai_service

    with patch('app.routers.scanner.upload_service', mock_upload), \
         patch('app.routers.scanner.preprocess_universal_image', return_value={"processed_path": "/media/uploads/fake.jpg"}), \
         patch('app.routers.scanner.EvidenceClassificationService.classify', return_value={"detected_type": "Currency", "confidence": 0.95, "selected_pipeline": "Currency Pipeline", "detected_denomination": 500, "detected_serial": "9AA123456"}):
        response = client.post(
            "/api/v1/scanner/scan",
            data={"denomination": 500, "serial_number": "9AA123456"},
            files={"file": ("test.jpg", b"fake-image-data", "image/jpeg")},
            headers={"Authorization": "Bearer mocktoken"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["data"]["isCounterfeit"] is False
        assert response.json()["data"]["status"] == "APPROVED"
