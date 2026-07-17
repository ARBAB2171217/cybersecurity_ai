import uuid
from typing import List, Optional
from fastapi import HTTPException
from app.repositories.community_repository import CommunityRepository
from app.repositories.report_repository import ReportRepository
from app.models.community import Comment, Like, Bookmark, AbuseReport, CommunityVerification

class CommunityService:
    def __init__(self, community_repo: CommunityRepository, report_repo: ReportRepository):
        self.community_repo = community_repo
        self.report_repo = report_repo

    async def _verify_public_report(self, report_id: uuid.UUID):
        report = await self.report_repo.get_by_id(report_id)
        if not report or report.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Report not found")
        if report.visibility == "PRIVATE":
            raise HTTPException(status_code=403, detail="Cannot interact with private reports")
        return report

    async def create_comment(self, report_id: uuid.UUID, user_id: uuid.UUID, content: str, parent_id: Optional[uuid.UUID] = None) -> Comment:
        report = await self._verify_public_report(report_id)
        comment = await self.community_repo.create_comment(report_id, user_id, content, parent_id)
        # Update comment count
        report.comments_count += 1
        await self.report_repo.db.commit()
        return comment

    async def get_comments(self, report_id: uuid.UUID) -> List[Comment]:
        await self._verify_public_report(report_id)
        return await self.community_repo.get_comments(report_id)

    async def update_comment(self, comment_id: uuid.UUID, user_id: uuid.UUID, role: str, content: str) -> Comment:
        comment = await self.community_repo.get_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        if str(comment.user_id) != str(user_id) and role not in ["ADMIN", "SUPER_ADMIN"]:
            raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
        return await self.community_repo.update_comment(comment, content)

    async def delete_comment(self, comment_id: uuid.UUID, user_id: uuid.UUID, role: str) -> None:
        comment = await self.community_repo.get_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        if str(comment.user_id) != str(user_id) and role not in ["ADMIN", "SUPER_ADMIN"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
        report = await self.report_repo.get_by_id(comment.report_id)
        if report:
            report.comments_count = max(0, report.comments_count - 1)
            
        await self.community_repo.delete_comment(comment)

    async def toggle_like(self, report_id: uuid.UUID, user_id: uuid.UUID) -> dict:
        report = await self._verify_public_report(report_id)
        liked = await self.community_repo.toggle_like(report_id, user_id)
        if liked:
            report.likes_count += 1
        else:
            report.likes_count = max(0, report.likes_count - 1)
        await self.report_repo.db.commit()
        return {"liked": liked, "likes_count": report.likes_count}

    async def toggle_bookmark(self, report_id: uuid.UUID, user_id: uuid.UUID) -> dict:
        report = await self._verify_public_report(report_id)
        bookmarked = await self.community_repo.toggle_bookmark(report_id, user_id)
        if bookmarked:
            report.bookmarks_count += 1
        else:
            report.bookmarks_count = max(0, report.bookmarks_count - 1)
        await self.report_repo.db.commit()
        return {"bookmarked": bookmarked, "bookmarks_count": report.bookmarks_count}

    async def get_bookmarked_reports(self, user_id: uuid.UUID) -> list:
        return await self.community_repo.get_bookmarked_reports(user_id)

    async def create_abuse_report(self, report_id: uuid.UUID, user_id: uuid.UUID, reason: str, details: Optional[str] = None) -> AbuseReport:
        await self._verify_public_report(report_id)
        return await self.community_repo.create_abuse_report(report_id, user_id, reason, details)

    async def create_verification(self, report_id: uuid.UUID, user_id: uuid.UUID, verdict: str) -> CommunityVerification:
        report = await self._verify_public_report(report_id)
        ver = await self.community_repo.create_verification(report_id, user_id, verdict)
        # Assuming we just increment total verifications for now, though we could be more specific
        report.verification_count += 1
        await self.report_repo.db.commit()
        return ver
