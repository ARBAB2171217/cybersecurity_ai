import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from app.models.community import Comment, Like, Bookmark, AbuseReport, CommunityVerification
from app.models.report import Report

class CommunityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Comments
    async def create_comment(self, report_id: uuid.UUID, user_id: uuid.UUID, content: str, parent_id: Optional[uuid.UUID] = None) -> Comment:
        comment = Comment(report_id=report_id, user_id=user_id, content=content, parent_id=parent_id)
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def get_comments(self, report_id: uuid.UUID) -> List[Comment]:
        stmt = select(Comment).where(Comment.report_id == report_id).order_by(Comment.created_at.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_comment_by_id(self, comment_id: uuid.UUID) -> Optional[Comment]:
        stmt = select(Comment).where(Comment.id == comment_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_comment(self, comment: Comment, content: str) -> Comment:
        comment.content = content
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def delete_comment(self, comment: Comment) -> None:
        await self.db.delete(comment)
        await self.db.commit()

    # Likes
    async def toggle_like(self, report_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = select(Like).where(Like.report_id == report_id, Like.user_id == user_id)
        result = await self.db.execute(stmt)
        like = result.scalar_one_or_none()
        
        if like:
            await self.db.delete(like)
            await self.db.commit()
            return False
        else:
            new_like = Like(report_id=report_id, user_id=user_id)
            self.db.add(new_like)
            await self.db.commit()
            return True

    # Bookmarks
    async def toggle_bookmark(self, report_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = select(Bookmark).where(Bookmark.report_id == report_id, Bookmark.user_id == user_id)
        result = await self.db.execute(stmt)
        bookmark = result.scalar_one_or_none()
        
        if bookmark:
            await self.db.delete(bookmark)
            await self.db.commit()
            return False
        else:
            new_bookmark = Bookmark(report_id=report_id, user_id=user_id)
            self.db.add(new_bookmark)
            await self.db.commit()
            return True

    async def get_bookmarked_reports(self, user_id: uuid.UUID) -> List[Report]:
        stmt = select(Report).join(Bookmark).where(Bookmark.user_id == user_id).order_by(Bookmark.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # Abuse Reports
    async def create_abuse_report(self, report_id: uuid.UUID, user_id: uuid.UUID, reason: str, details: Optional[str] = None) -> AbuseReport:
        abuse = AbuseReport(report_id=report_id, user_id=user_id, reason=reason, details=details)
        self.db.add(abuse)
        await self.db.commit()
        await self.db.refresh(abuse)
        return abuse

    # Verification
    async def create_verification(self, report_id: uuid.UUID, user_id: uuid.UUID, verdict: str) -> CommunityVerification:
        stmt = select(CommunityVerification).where(CommunityVerification.report_id == report_id, CommunityVerification.user_id == user_id)
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.verdict = verdict
            self.db.add(existing)
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            ver = CommunityVerification(report_id=report_id, user_id=user_id, verdict=verdict)
            self.db.add(ver)
            await self.db.commit()
            await self.db.refresh(ver)
            return ver
