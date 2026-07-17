import pytest
import uuid
import datetime
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from app.main import app
from app.dependencies.auth import get_current_user
from app.routers.user import get_user_service

client = TestClient(app)

class MockUser:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

mock_citizen = MockUser(
    id=uuid.UUID("11111111-2222-3333-4444-555555555555"),
    email="citizen@gmail.com",
    full_name="John Doe",
    is_active=True,
    is_verified=True,
    created_at=datetime.datetime.now(),
    updated_at=datetime.datetime.now(),
    deleted_at=None
)

@pytest.fixture(autouse=True)
def setup_dependencies():
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_user] = lambda: mock_citizen
    yield
    app.dependency_overrides.clear()

def test_get_my_profile():
    response = client.get("/api/v1/user/me", headers={"Authorization": "Bearer mocktoken"})
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["email"] == "citizen@gmail.com"

def test_update_my_profile():
    mock_updated = MockUser(
        id=mock_citizen.id,
        email=mock_citizen.email,
        full_name="Updated Name",
        is_active=True,
        is_verified=True,
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
        deleted_at=None
    )
    
    mock_user_service = MagicMock()
    mock_user_service.update_user_profile = AsyncMock(return_value=mock_updated)

    app.dependency_overrides[get_user_service] = lambda: mock_user_service

    response = client.put(
        "/api/v1/user/me",
        json={"full_name": "Updated Name"},
        headers={"Authorization": "Bearer mocktoken"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["full_name"] == "Updated Name"
