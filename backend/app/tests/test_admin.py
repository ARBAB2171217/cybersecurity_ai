import pytest
import uuid
import datetime
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from app.main import app
from app.dependencies.admin import get_current_admin
from app.routers.admin import get_user_service, get_admin_service
from app.models.admin import AdminRole
from app.security.jwt import create_access_token

client = TestClient(app)

class MockAdmin:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

class MockUser:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

mock_admin = MockAdmin(
    id=uuid.UUID("22222222-3333-4444-5555-666666666666"),
    email="admin@cybershield.in",
    full_name="System Administrator",
    role=AdminRole.ADMIN,
    is_active=True,
    created_at=datetime.datetime.now(),
    updated_at=datetime.datetime.now(),
    deleted_at=None
)

@pytest.fixture(scope="module")
def admin_headers():
    token = create_access_token(subject=str(mock_admin.id), role="ADMIN")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(autouse=True)
def setup_dependencies():
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    yield
    app.dependency_overrides.clear()

def test_admin_list_users(admin_headers):
    mock_admin.role = AdminRole.ADMIN
    mock_user = MockUser(
        id=uuid.UUID("11111111-2222-3333-4444-555555555555"),
        email="citizen@gmail.com",
        full_name="John Doe",
        is_active=True,
        is_verified=True,
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
        deleted_at=None
    )

    mock_user_service = MagicMock()
    mock_user_service.list_users = AsyncMock(return_value=([mock_user], 1))

    app.dependency_overrides[get_user_service] = lambda: mock_user_service

    response = client.get("/api/v1/admin/users", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert isinstance(response.json()["data"], list)
    assert response.json()["data"][0]["email"] == "citizen@gmail.com"

def test_admin_list_admins():
    mock_admin.role = AdminRole.SUPER_ADMIN
    super_token = create_access_token(subject=str(mock_admin.id), role="SUPER_ADMIN")
    super_headers = {"Authorization": f"Bearer {super_token}"}

    mock_admin_service = MagicMock()
    mock_admin_service.list_admins = AsyncMock(return_value=([mock_admin], 1))

    app.dependency_overrides[get_admin_service] = lambda: mock_admin_service

    response = client.get("/api/v1/admin/admins", headers=super_headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert isinstance(response.json()["data"], list)
    assert response.json()["data"][0]["email"] == "admin@cybershield.in"
