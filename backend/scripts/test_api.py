import asyncio
import httpx
import os

async def main():
    # Make a dummy image
    with open("dummy.png", "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0bIDAT\x08\xd7c\xf8\x0f\x04\x00\x09\xfb\x03\xfd\xe3U\xf2\x9c\x00\x00\x00\x00IEND\xaeB`\x82")
    
    async with httpx.AsyncClient() as client:
        with open("dummy.png", "rb") as f:
            files = {"file": ("dummy.png", f, "image/png")}
            response = await client.post("http://localhost:8000/api/v1/scanner/scan", files=files)
            print("Status:", response.status_code)
            print("Response:", response.json())
            
asyncio.run(main())
