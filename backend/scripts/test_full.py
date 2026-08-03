import asyncio
import json
import uuid
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Just print the exact value of report.id in a mocked context to see if anything weird happens
class MockReport:
    def __init__(self):
        self.id = uuid.uuid4()

report = MockReport()
unified_response = {}
if report and hasattr(report, "id"):
    unified_response["report_id"] = str(report.id)
print(json.dumps(unified_response))
