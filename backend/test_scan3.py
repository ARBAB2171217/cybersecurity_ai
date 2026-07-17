import asyncio
from fastapi.testclient import TestClient
import sys
sys.path.insert(0, '.')
from app.main import app

client = TestClient(app)

# Login to get token
response = client.post("/api/v1/auth/login", data={"username": "admin@cybershield.gov.in", "password": "securepassword123"})
if response.status_code == 200:
    token = response.json()["data"]["access_token"]
else:
    print("Login failed", response.text)
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}"}

with open("media/uploads/test.png", "rb") as f:
    response = client.post("/api/v1/detection/scan", headers=headers, data={"denomination": 500}, files={"file": ("test.png", f, "image/png")})
    print("Status:", response.status_code)
    try:
        print(response.json())
    except:
        print(response.text)
