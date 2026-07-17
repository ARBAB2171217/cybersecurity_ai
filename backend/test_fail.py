import asyncio
import os
import sys

# Setup environment
os.environ["GEMINI_API_KEY"] = "fake-key-for-test" # If not set, it uses mock

sys.path.insert(0, os.path.abspath("."))
from app.services.evidence_engine import EvidenceIntelligenceEngine

async def main():
    try:
        res = await EvidenceIntelligenceEngine.analyze_screenshot("test.png", "test.png")
        print("SUCCESS:", res)
    except Exception as e:
        print("EXCEPTION:", e)

asyncio.run(main())
