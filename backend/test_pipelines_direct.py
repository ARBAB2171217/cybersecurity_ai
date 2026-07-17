import asyncio
import os
import sys

# Setup environment
os.environ["GEMINI_API_KEY"] = "AQ.Ab8RN6KRM-EYTT9fUtpXlm8F8qnMKUFZGwlusS5x5IAi9BwolA"

sys.path.insert(0, os.path.abspath("."))
import app.models.user
import app.models.session
import app.models.admin
import app.models.report

from app.database.session import AsyncSessionLocal
from app.services.report_service import ReportService
from app.services.ai_detection_service import AIDetectionService
from app.repositories.report_repository import ReportRepository

async def test_pipeline():
    async with AsyncSessionLocal() as db:
        repo = ReportRepository(db)
        rs = ReportService(repo)
        ai_ds = AIDetectionService(repo)
        
        # Mock create a report
        report = await rs.create_report(user_id=None, denomination=500, serial_number="TEST1234", image_url="/media/uploads/test.png")
        report.category = "QR Code"
        report.evidence_type = "QR Code"
        await db.commit()
        
        try:
            print("Analyzing generic evidence...")
            updated_report = await ai_ds.analyze_generic_evidence(str(report.id))
            print("SUCCESS Generic. Status:", updated_report.status)
        except Exception as e:
            print(f"FAILED Generic: {type(e)} {e}")
            import traceback
            traceback.print_exc()
            
        report2 = await rs.create_report(user_id=None, denomination=500, serial_number="TEST1234", image_url="/media/uploads/test.png")
        report2.category = "Counterfeit Currency"
        report2.evidence_type = "Currency"
        await db.commit()
        
        try:
            print("Analyzing currency...")
            updated_report2 = await ai_ds.analyze_currency_note(str(report2.id))
            print("SUCCESS Currency. Status:", updated_report2.status)
        except Exception as e:
            print(f"FAILED Currency: {type(e)} {e}")
            import traceback
            traceback.print_exc()

asyncio.run(test_pipeline())
