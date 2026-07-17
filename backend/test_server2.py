import requests
import json

try:
    res = requests.post("http://localhost:8000/api/v1/auth/login/user", json={"email": "admin@cybershield.gov.in", "password": "securepassword123"})
    print("Login status:", res.status_code)
    try:
        print("Login body:", res.json())
        token = res.json()["data"]["access_token"]
    except Exception as e:
        print("Failed to get token:", res.text)
        token = None
        
    if token:
        with open("media/uploads/test.png", "rb") as f:
            res = requests.post("http://localhost:8000/api/v1/detection/scan", headers={"Authorization": f"Bearer {token}"}, data={"denomination": 500}, files={"file": ("test.png", f, "image/png")})
            print("Scan status:", res.status_code)
            try:
                print(json.dumps(res.json(), indent=2))
            except:
                print(res.text)
except Exception as e:
    print("Error:", e)
