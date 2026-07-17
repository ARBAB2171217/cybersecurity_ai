import asyncio
from fastapi.testclient import TestClient
import sys
sys.path.insert(0, '.')
from app.main import app
import os

client = TestClient(app)

# Use any existing image
img_path = None
for f in os.listdir("media/uploads"):
    if f.endswith(".png") or f.endswith(".jpg"):
        img_path = os.path.join("media/uploads", f)
        break

if not img_path:
    print("No image found to test.")
    sys.exit(0)

with open(img_path, "rb") as f:
    response = client.post("/api/v1/detection/scan", data={"denomination": 500}, files={"file": ("test.png", f, "image/png")})
    print(response.status_code)
    try:
        print(response.json())
    except:
        print(response.text)
