import requests
import json

url = "http://localhost:8000/api/v1/detection/analyze"
files = {'file': ('test.jpg', open('test.jpg', 'rb'), 'image/jpeg')}
data = {'denomination': 100}

# Need a token, but let's test without one to see if it fails auth. 
