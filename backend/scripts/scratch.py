import asyncio
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models.report import Report
from app.config.settings import settings
import json

engine = create_engine(settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql"))
Session = sessionmaker(bind=engine)
session = Session()

report = session.query(Report).filter_by(id="8e08b72f-a0ad-4beb-bfcb-b945e6750b69").first()
if report:
    print(json.dumps(report.raw_ai_response, indent=2))
else:
    print("Report not found")
