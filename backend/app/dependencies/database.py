from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_async_db
from app.repositories.user_repository import UserRepository
from app.repositories.admin_repository import AdminRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.otp_repository import OTPRepository
from app.repositories.refresh_repository import RefreshRepository
from app.repositories.audit_repository import AuditRepository
from app.repositories.session_repository import SessionRepository

async def get_user_repo(db: AsyncSession = Depends(get_async_db)) -> UserRepository:
    return UserRepository(db)

async def get_admin_repo(db: AsyncSession = Depends(get_async_db)) -> AdminRepository:
    return AdminRepository(db)

async def get_report_repo(db: AsyncSession = Depends(get_async_db)) -> ReportRepository:
    return ReportRepository(db)

async def get_otp_repo(db: AsyncSession = Depends(get_async_db)) -> OTPRepository:
    return OTPRepository(db)

async def get_refresh_repo(db: AsyncSession = Depends(get_async_db)) -> RefreshRepository:
    return RefreshRepository(db)

async def get_audit_repo(db: AsyncSession = Depends(get_async_db)) -> AuditRepository:
    return AuditRepository(db)

async def get_session_repo(db: AsyncSession = Depends(get_async_db)) -> SessionRepository:
    return SessionRepository(db)
