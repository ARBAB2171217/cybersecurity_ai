import requests

try:
    res = requests.post("http://localhost:8000/api/v1/auth/login", json={"username": "admin@cybershield.gov.in", "password": "securepassword123"})
    print("Login status:", res.status_code)
    token = res.json()["data"]["access_token"]
    
    with open("media/uploads/test.png", "rb") as f:
        res = requests.post("http://localhost:8000/api/v1/detection/scan", headers={"Authorization": f"Bearer {token}"}, data={"denomination": 500}, files={"file": ("test.png", f, "image/png")})
        print("Scan status:", res.status_code)
        try:
            print(res.json())
        except:
            print(res.text)
except Exception as e:
    print("Error:", e)
