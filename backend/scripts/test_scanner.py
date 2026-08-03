import asyncio
from app.models.report import Report
import uuid

report = Report(id=uuid.uuid4())
unified_response = {}
if report and hasattr(report, "id"):
    unified_response["report_id"] = str(report.id)
print(unified_response)
