import asyncio
import os
import sys

# Setup environment to reproduce the bug
os.environ["GEMINI_API_KEY"] = "AQ.Ab8RN6KRM-EYTT9fUtpXlm8F8qnMKUFZGwlusS5x5IAi9BwolA" # Invalid but passes the placeholder check

sys.path.insert(0, os.path.abspath("."))
from app.services.evidence_engine import EvidenceIntelligenceEngine

async def main():
    try:
        res = await EvidenceIntelligenceEngine.analyze_screenshot("test.png", "test.png")
        print("SUCCESS:", list(res.keys()))
    except Exception as e:
        print("EXCEPTION:", type(e), e)

asyncio.run(main())
