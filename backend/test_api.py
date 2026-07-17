import requests
import json
import logging
logging.basicConfig(level=logging.DEBUG)

try:
    print("Logging in...")
    res = requests.post("http://localhost:8000/api/v1/auth/login/user", json={"email": "citizen@cybershield.in", "password": "SecurePassword123!"})
    print(res.status_code, res.text)
    token = res.json()["data"]["access_token"]
    
    print("\nCreating a valid image...")
    from PIL import Image
    img = Image.new('RGB', (60, 30), color = 'red')
    img.save('test_valid.png')
    
    print("\nScanning Generic Evidence (Screenshot/QR)...")
    with open("test_valid.png", "rb") as f:
        res = requests.post("http://localhost:8000/api/v1/detection/scan", headers={"Authorization": f"Bearer {token}"}, files={"file": ("test_valid.png", f, "image/png")})
        print("Status:", res.status_code)
        try:
            print(json.dumps(res.json(), indent=2)[:500])
        except:
            print(res.text)
            
    print("\nScanning Currency...")
    with open("test_valid.png", "rb") as f:
        res = requests.post("http://localhost:8000/api/v1/detection/scan", headers={"Authorization": f"Bearer {token}"}, data={"denomination": 500}, files={"file": ("test_valid.png", f, "image/png")})
        print("Status:", res.status_code)
        
except Exception as e:
    print("Error:", e)
