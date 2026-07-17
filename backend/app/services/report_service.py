import uuid
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from app.repositories.report_repository import ReportRepository
from app.models.report import Report, ReportStatus


class ReportService:
    """
    Business service managing the lifecycle of currency counterfeit detection reports.
    """

    def __init__(self, report_repo: ReportRepository):
        self.report_repo = report_repo

    async def create_report(
        self,
        user_id: Optional[uuid.UUID] = None,
        denomination: Optional[int] = None,
        serial_number: Optional[str] = None,
        image_url: Optional[str] = None,
    ) -> Report:
        """Logs a new scanning entry in PENDING status."""
        report_data = {
            "user_id": user_id,
            "denomination": denomination,
            "serial_number": serial_number,
            "image_url": image_url,
            "category": "Counterfeit Currency" if denomination else "AI Scan",
            "title": f"Currency Scan: ₹{denomination}" if denomination else "AI Scanner Report",
            "is_counterfeit": None,
            "confidence_score": None,
            "status": ReportStatus.PENDING.value,
        }
        return await self.report_repo.create(report_data)

    async def create_manual_report(
        self,
        user_id: Optional[uuid.UUID],
        category: str,
        title: str,
        description: str,
        incident_date: Optional[str] = None,
        incident_time: Optional[str] = None,
        location: Optional[str] = None,
        priority: Optional[str] = None,
        evidence: Optional[list] = None,
        visibility: str = "PRIVATE",
    ) -> Report:
        """Logs a new manual cyber crime report."""
        report_data = {
            "user_id": user_id,
            "category": category,
            "title": title,
            "description": description,
            "incident_date": incident_date,
            "incident_time": incident_time,
            "location": location,
            "priority": priority,
            "evidence": evidence or [],
            "status": ReportStatus.PENDING.value,
            "visibility": visibility,
        }
        return await self.report_repo.create(report_data)

    async def get_report_by_id(self, report_id: uuid.UUID) -> Report:
        """Retrieves a report by its UUID, throwing 404 if missing or soft-deleted."""
        report = await self.report_repo.get_by_id(report_id)
        if not report or report.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan report not found.",
            )
        return report

    async def update_report_status(
        self,
        report_id: uuid.UUID,
        status_val: ReportStatus,
        is_counterfeit: Optional[bool] = None,
    ) -> Report:
        """Transitions status of scanning reports (e.g. manually verified by an Admin)."""
        report = await self.get_report_by_id(report_id)
        update_data: dict = {"status": status_val}
        if is_counterfeit is not None:
            update_data["is_counterfeit"] = is_counterfeit
        return await self.report_repo.update(report, update_data)

    async def update_report_visibility(
        self,
        report_id: uuid.UUID,
        visibility: str,
    ) -> Report:
        """Transitions visibility of the report."""
        report = await self.get_report_by_id(report_id)
        update_data: dict = {"visibility": visibility}
        return await self.report_repo.update(report, update_data)

    async def delete_report(self, report_id: uuid.UUID) -> None:
        """Soft-deletes a report by setting its deleted_at timestamp."""
        report = await self.get_report_by_id(report_id)
        await self.report_repo.soft_delete(report)

    async def list_reports(
        self,
        user_id: Optional[uuid.UUID] = None,
        status_val: Optional[str] = None,
        is_counterfeit: Optional[bool] = None,
        denomination: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        visibility: Optional[str] = None,
        qr_type: Optional[str] = None,
        threat_level: Optional[str] = None,
        risk_score: Optional[int] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "recent",
        exclude_report_id: Optional[uuid.UUID] = None,
        page: int = 1,
        size: int = 10,
    ) -> Tuple[List[Report], int]:
        """Fetches filter-matched reports with optional search by serial number."""
        return await self.report_repo.list_reports(
            user_id=user_id,
            status=status_val,
            is_counterfeit=is_counterfeit,
            denomination=denomination,
            category=category,
            priority=priority,
            visibility=visibility,
            qr_type=qr_type,
            threat_level=threat_level,
            risk_score=risk_score,
            search=search,
            sort_by=sort_by,
            exclude_report_id=exclude_report_id,
            page=page,
            size=size,
        )
