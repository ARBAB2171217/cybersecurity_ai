import asyncio
from fastapi.testclient import TestClient
import sys
sys.path.insert(0, '.')
from app.main import app

client = TestClient(app)
with open("test.png", "rb") as f:
    response = client.post("/api/v1/detection/analyze-screenshot", files={"file": ("test.png", f, "image/png")})
    print(response.status_code)
    print(response.json())
