import uuid
import datetime
from typing import Optional, List, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.report import Report, ReportStatus


class ReportRepository(BaseRepository[Report]):
    """
    Repository class handling database interactions for the Report model.
    """

    def __init__(self, db: AsyncSession):
        super().__init__(Report, db)

    async def soft_delete(self, report: Report) -> Report:
        """Sets deleted_at on the report to soft-delete it."""
        report.deleted_at = datetime.datetime.now(datetime.timezone.utc)
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report

    async def get_by_serial_number(self, serial_number: str) -> List[Report]:
        stmt = select(self.model).where(
            self.model.serial_number == serial_number,
            self.model.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_reports(
        self,
        user_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
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
        stmt = select(self.model).where(self.model.deleted_at.is_(None))

        if user_id:
            stmt = stmt.where(self.model.user_id == user_id)
        if status:
            stmt = stmt.where(self.model.status == status)
        if is_counterfeit is not None:
            stmt = stmt.where(self.model.is_counterfeit == is_counterfeit)
        if denomination is not None:
            stmt = stmt.where(self.model.denomination == denomination)
        if category:
            stmt = stmt.where(self.model.category == category)
        if priority:
            stmt = stmt.where(self.model.priority == priority)
        if visibility:
            stmt = stmt.where(self.model.visibility == visibility)
        if qr_type:
            stmt = stmt.where(self.model.raw_ai_response["qr_details"]["qr_type"].astext.ilike(f"%{qr_type}%"))
        if threat_level:
            from sqlalchemy import or_
            stmt = stmt.where(
                or_(
                    self.model.raw_ai_response["qr_details"]["risk_analysis"]["risk_level"].astext.ilike(f"%{threat_level}%"),
                    self.model.raw_ai_response["risk_analysis"]["threat_level"].astext.ilike(f"%{threat_level}%")
                )
            )
        if risk_score is not None:
            from sqlalchemy import cast, Integer, or_
            stmt = stmt.where(
                or_(
                    cast(self.model.raw_ai_response["qr_details"]["risk_analysis"]["risk_score"].astext, Integer) >= risk_score,
                    cast(self.model.raw_ai_response["risk_analysis"]["risk_score"].astext, Integer) >= risk_score
                )
            )
        if search:
            from sqlalchemy import or_
            stmt = stmt.where(
                or_(
                    self.model.serial_number.ilike(f"%{search}%"),
                    self.model.title.ilike(f"%{search}%"),
                    self.model.category.ilike(f"%{search}%")
                )
            )
        if exclude_report_id:
            stmt = stmt.where(self.model.id != exclude_report_id)

        # Handle Sorting
        if sort_by == "popular":
            stmt = stmt.order_by((self.model.likes_count + self.model.comments_count).desc(), self.model.created_at.desc())
        elif sort_by == "confirmed":
            stmt = stmt.order_by(self.model.verification_count.desc(), self.model.created_at.desc())
        elif sort_by == "trending":
            stmt = stmt.order_by(self.model.trending_score.desc(), (self.model.likes_count + self.model.comments_count + self.model.views_count).desc())
        else: # "recent" or default
            stmt = stmt.order_by(self.model.created_at.desc())

        # Count query
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # Paginate and execute
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total
