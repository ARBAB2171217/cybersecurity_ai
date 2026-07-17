"""
Unified import point for all SQLAlchemy models to expose them to Alembic.
"""
from app.database.base import Base
from app.models.session import Session
from app.models.user import User
from app.models.admin import Admin
from app.models.report import Report, ReportStatus
from app.models.otp import OTP, OTPPurpose
from app.models.refresh_token import RefreshToken
from app.models.audit_log import AuditLog
from app.models.community import Comment, Like, Bookmark, AbuseReport, CommunityVerification

__all__ = [
    "Base",
    "User",
    "Admin",
    "Report",
    "ReportStatus",
    "OTP",
    "OTPPurpose",
    "RefreshToken",
    "AuditLog",
    "Session",
    "Comment",
    "Like",
    "Bookmark",
    "AbuseReport",
    "CommunityVerification"
]
