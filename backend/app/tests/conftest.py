import pytest

# Force SQLAlchemy model compilation registry load before tests are collected
from app.models.user import User
from app.models.admin import Admin
from app.models.report import Report
from app.models.otp import OTP
from app.models.refresh_token import RefreshToken
from app.models.session import Session
from app.models.audit_log import AuditLog

@pytest.fixture(scope="session", autouse=True)
def init_test_session():
    """
    Ensures that SQLAlchemy mappings compile and initialize correctly,
    and forces redis_service to use its in-memory fallback.
    """
    from app.services.redis_service import redis_service
    redis_service.use_fallback = True

