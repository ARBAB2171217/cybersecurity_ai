import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.security.password import hash_password, verify_password
from app.security.jwt import create_access_token, decode_token

client = TestClient(app)

def test_password_hashing():
    pw = "SecretPass123!"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("wrong-pw", hashed) is False

def test_jwt_token_flow():
    token = create_access_token("user-uuid-1234", "USER")
    assert isinstance(token, str)
    
    decoded = decode_token(token)
    assert decoded["sub"] == "user-uuid-1234"
    assert decoded["role"] == "USER"

def test_cors_headers():
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
