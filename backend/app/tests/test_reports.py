import pytest
import uuid
import datetime
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from app.main import app
from app.routers.reports import get_current_token_payload, get_report_service
from app.models.report import Report, ReportStatus

client = TestClient(app)

mock_user_id = uuid.UUID("11111111-2222-3333-4444-555555555555")

@pytest.fixture(autouse=True)
def setup_dependencies():
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_token_payload] = lambda: {
        "sub": str(mock_user_id),
        "role": "USER"
    }
    yield
    app.dependency_overrides.clear()

def test_list_my_reports():
    mock_report_service = MagicMock()
    mock_report_service.list_reports = AsyncMock(return_value=([], 0))

    app.dependency_overrides[get_report_service] = lambda: mock_report_service

    response = client.get("/api/v1/reports")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert isinstance(response.json()["data"]["reports"], list)

def test_get_report_details_not_found():
    mock_report_service = MagicMock()
    mock_report_service.get_report_by_id = AsyncMock(
        side_effect=HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan report not found.")
    )

    app.dependency_overrides[get_report_service] = lambda: mock_report_service

    response = client.get("/api/v1/reports/b3c018e5-2131-48b3-910c-9392ee2d6ad8")
    assert response.status_code == 404
    assert response.json()["success"] is False
