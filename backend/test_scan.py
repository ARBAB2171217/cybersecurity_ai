import asyncio
from fastapi.testclient import TestClient
import sys
sys.path.insert(0, '.')
from app.main import app

client = TestClient(app)

with open("test.png", "wb") as f:
    f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0bIDATx\x9cc\xfa\xcf\x00\x00\x04\x00\x01^\xca\xb3\xcc\x00\x00\x00\x00IEND\xaeB`\x82")

with open("test.png", "rb") as f:
    response = client.post("/api/v1/detection/scan", data={"denomination": 500}, files={"file": ("test.png", f, "image/png")})
    print(response.status_code)
    print(response.json())
