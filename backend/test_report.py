import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config.settings import settings
from app.repositories.report_repository import ReportRepository
from app.services.report_service import ReportService
from app.models.report import Report

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def main():
    async with AsyncSessionLocal() as db:
        repo = ReportRepository(db)
        service = ReportService(repo)
        try:
            report = await service.create_report(
                user_id=None,
                denomination=None,
                serial_number=None,
                image_url="/media/uploads/test.jpg"
            )
            print(f"Success! Report ID: {report.id}")
            report.evidence_type = "QR Code"
            await db.commit()
            print("Successfully updated and committed!")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
