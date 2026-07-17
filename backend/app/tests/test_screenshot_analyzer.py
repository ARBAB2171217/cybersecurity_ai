import pytest
import uuid
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app
from app.dependencies.auth import get_current_user

client = TestClient(app)

class MockUser:
    def __init__(self):
        self.id = uuid.uuid4()
        self.email = "test@cybershield.ai"
        self.full_name = "Jane Doe"
        self.is_active = True

@pytest.fixture(autouse=True)
def setup_dependencies():
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    yield
    app.dependency_overrides.clear()

def test_analyze_screenshot_invalid_extension():
    response = client.post(
        "/api/v1/detection/analyze-screenshot",
        files={"file": ("test.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["message"]

def test_analyze_screenshot_empty_file():
    response = client.post(
        "/api/v1/detection/analyze-screenshot",
        files={"file": ("test.png", b"", "image/png")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["message"].lower()

@patch("app.ai.pipelines.preprocessing.assess_screenshot_quality")
@patch("app.ai.pipelines.ocr_pipeline.run_ocr")
@patch("app.services.screenshot_service.Image.open")
def test_analyze_screenshot_success(mock_image_open, mock_run_ocr, mock_quality):
    mock_quality.return_value = {"quality_score": 100.0, "quality_status": "ACCEPTABLE", "detected_issues": []}
    # Mock PIL Image verification
    mock_img = MagicMock()
    mock_img.size = (1080, 1920)
    mock_img.format = "PNG"
    mock_img.__enter__.return_value = mock_img
    mock_image_open.return_value = mock_img

    # Mock OCR execution
    mock_run_ocr.return_value = {
        "raw_text": "PAID SUCCESSFULLY TO HDFC BANK UPI ID citizen@paytm REF NO 123456",
        "blocks": [
            {"text": "PAID SUCCESSFULLY", "confidence": 0.95, "bbox": [[0, 0], [10, 10]]}
        ],
        "parsed_serials": [],
        "parsed_denominations": []
    }

    # Generate valid dummy image data
    dummy_image = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

    response = client.post(
        "/api/v1/detection/analyze-screenshot",
        files={"file": ("test.png", dummy_image, "image/png")}
    )

    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["category"] == "Payment Receipt"
    assert res_json["data"]["detected_elements"]["upi_id"] is True
    assert res_json["data"]["detected_elements"]["transaction_details"] is True
    assert res_json["data"]["metadata"]["width"] == 1080
    assert "entities" in res_json["data"]
    assert "citizen@paytm" in res_json["data"]["entities"]["financials"]["upi_ids"]
    assert "HDFC" in res_json["data"]["entities"]["financials"]["banks"]
    assert "risk_score" in res_json["data"]
    assert "threat_level" in res_json["data"]
    assert "triggered_rules" in res_json["data"]


@patch("app.ai.pipelines.preprocessing.assess_screenshot_quality")
@patch("app.ai.pipelines.ocr_pipeline.run_ocr")
@patch("app.services.screenshot_service.Image.open")
def test_analyze_screenshot_suspicious(mock_image_open, mock_run_ocr, mock_quality):
    mock_quality.return_value = {"quality_score": 100.0, "quality_status": "ACCEPTABLE", "detected_issues": []}
    # Mock PIL Image verification
    mock_img = MagicMock()
    mock_img.size = (1080, 1920)
    mock_img.format = "PNG"
    mock_img.__enter__.return_value = mock_img
    mock_image_open.return_value = mock_img

    # Mock OCR execution with high-risk elements: OTP, Urgent KYC and reward cashback hook
    mock_run_ocr.return_value = {
        "raw_text": "URGENT KYC REQUIRED: To avoid account suspension verify one time password code 883921. Claim your reward cashback of Rs. 50000 at http://scam-rewards.in",
        "blocks": [
            {"text": "URGENT KYC REQUIRED", "confidence": 0.95, "bbox": [[0, 0], [10, 10]]}
        ],
        "parsed_serials": [],
        "parsed_denominations": []
    }

    dummy_image = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

    response = client.post(
        "/api/v1/detection/analyze-screenshot",
        files={"file": ("test.png", dummy_image, "image/png")}
    )

    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["risk_score"] > 50
    assert res_json["data"]["threat_level"] in ["High", "Critical"]
    rule_names = [rule["name"] for rule in res_json["data"]["triggered_rules"]]
    assert "OTP / Verification Code Detection" in rule_names
    assert "KYC Identity Verification Request" in rule_names
    assert "Cashback / Reward Scheme Hook" in rule_names
    assert "Web Links / Domains Present" in rule_names

