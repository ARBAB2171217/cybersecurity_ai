import google.generativeai as genai
import os

key = "AQ.Ab8RN6KRM-EYTT9fUtpXlm8F8qnMKUFZGwlusS5x5IAi9BwolA"
genai.configure(api_key=key)
model = genai.GenerativeModel("gemini-3.5-flash")
try:
    response = model.generate_content("Ping", generation_config={"max_output_tokens": 1})
    print("Success!", response.text)
except Exception as e:
    print("Error:", repr(e))
