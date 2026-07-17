import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from app.main import app
from app.dependencies.database import get_user_repo, get_refresh_repo
from app.models.user import User

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()

def test_register_success():
    mock_user = User(
        id="11111111-2222-3333-4444-555555555555",
        email="citizen@gmail.com",
        full_name="John Doe",
        hashed_password="hashed_pw",
        is_active=True
    )
    
    mock_user_repo = MagicMock()
    mock_user_repo.get_by_email = AsyncMock(return_value=None)
    mock_user_repo.create = AsyncMock(return_value=mock_user)
    
    mock_refresh_repo = MagicMock()
    mock_refresh_repo.create = AsyncMock(return_value=None)

    mock_admin_repo = MagicMock()
    mock_session_repo = MagicMock()
    mock_session_repo.create = AsyncMock(return_value=MagicMock())

    from app.dependencies.database import get_admin_repo, get_session_repo
    app.dependency_overrides[get_user_repo] = lambda: mock_user_repo
    app.dependency_overrides[get_refresh_repo] = lambda: mock_refresh_repo
    app.dependency_overrides[get_admin_repo] = lambda: mock_admin_repo
    app.dependency_overrides[get_session_repo] = lambda: mock_session_repo
         
    response = client.post("/api/v1/auth/register", json={
        "email": "citizen@gmail.com",
        "password": "StrongPassword123!",
        "full_name": "John Doe"
    })
    
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "access_token" in response.json()["data"]

def test_register_invalid_email():
    response = client.post("/api/v1/auth/register", json={
        "email": "invalid-email-format",
        "password": "StrongPassword123!",
        "full_name": "John Doe"
    })
    
    assert response.status_code in [400, 422]
    assert response.json()["success"] is False

def test_login_user_not_found():
    mock_user_repo = MagicMock()
    mock_user_repo.get_by_email = AsyncMock(return_value=None)

    app.dependency_overrides[get_user_repo] = lambda: mock_user_repo

    response = client.post("/api/v1/auth/login/user", json={
        "email": "nonexistent@gmail.com",
        "password": "Password123!"
    })
    
    assert response.status_code == 401
    assert response.json()["success"] is False

def test_google_login_success():
    from app.models.user import User
    
    mock_user = User(
        id="11111111-2222-3333-4444-555555555555",
        email="google-user@cybershield.in",
        full_name="Google Officer User",
        hashed_password="hashed_pw",
        is_active=True
    )
    
    mock_user_repo = MagicMock()
    mock_user_repo.get_by_email = AsyncMock(return_value=mock_user)
    mock_user_repo.update = AsyncMock(return_value=mock_user)
    
    mock_refresh_repo = MagicMock()
    mock_refresh_repo.create = AsyncMock(return_value=None)
    
    mock_session_repo = MagicMock()
    mock_session_repo.create = AsyncMock(return_value=MagicMock())
    
    from app.dependencies.database import get_session_repo
    app.dependency_overrides[get_user_repo] = lambda: mock_user_repo
    app.dependency_overrides[get_refresh_repo] = lambda: mock_refresh_repo
    app.dependency_overrides[get_session_repo] = lambda: mock_session_repo
    
    response = client.post("/api/v1/auth/google", json={
        "credential": "mock-google-id-token-authcode123"
    })
    
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "access_token" in response.json()["data"]
