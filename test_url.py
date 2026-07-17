import requests
import json

res = requests.post("http://localhost:8000/api/v1/auth/login", json={
    "email": "admin@cybershield.in",
    "password": "admin"
})
token = res.json()["data"]["access_token"]

res2 = requests.post("http://localhost:8000/api/v1/detection/resolve-url", json={
    "url": "http://example.com"
}, headers={"Authorization": f"Bearer {token}"})

print(res2.status_code)
print(res2.text)

res3 = requests.post("http://localhost:8000/api/v1/detection/analyze-url", json={
    "originalUrl": "http://example.com",
    "finalUrl": "http://example.com",
    "category": "Unknown",
    "ipType": "IPv4",
    "riskScore": 10,
    "threatLevel": "Low",
    "triggeredRules": [],
    "brandMatch": {}
}, headers={"Authorization": f"Bearer {token}"})

print(res3.status_code)
print(res3.text)
