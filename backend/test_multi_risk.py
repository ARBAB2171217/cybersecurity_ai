import asyncio
from app.intelligence.url.url_pipeline import URLIntelligencePipeline

async def main():
    pipeline = URLIntelligencePipeline("http://example.com/login")
    result = await pipeline.execute(None)
    for k, v in result.items():
        if k in ["Website Category", "cyber_threat_risk", "privacy_risk", "financial_risk", "download_risk", "evidence_collected", "risk_score"]:
            print(f"{k}: {v}")
            
asyncio.run(main())
