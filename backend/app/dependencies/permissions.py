from fastapi import Depends
from app.dependencies.admin import get_current_admin
from app.dependencies.auth import get_current_user
from app.security.permissions import allow_admin_only, allow_admin_or_super, allow_super_only, allow_citizen_only
from app.models.admin import Admin
from app.models.user import User

def require_admin(admin: Admin = Depends(get_current_admin)) -> Admin:
    """
    FastAPI dependency enforcing that the requester is a standard Admin.
    """
    allow_admin_only(admin.role.value)
    return admin

def require_admin_or_super(admin: Admin = Depends(get_current_admin)) -> Admin:
    """
    FastAPI dependency enforcing that the requester is an Admin or Super Admin.
    """
    allow_admin_or_super(admin.role.value)
    return admin

def require_super_admin(admin: Admin = Depends(get_current_admin)) -> Admin:
    """
    FastAPI dependency enforcing that the requester is a Super Admin.
    """
    allow_super_only(admin.role.value)
    return admin

def require_citizen(user: User = Depends(get_current_user)) -> User:
    """
    FastAPI dependency enforcing that the requester has standard Citizen role.
    """
    allow_citizen_only("USER")
    return user

from app.dependencies.auth import get_current_user_unverified

def require_unverified_citizen(user: User = Depends(get_current_user_unverified)) -> User:
    """
    FastAPI dependency for citizens whose email might not be verified yet.
    """
    allow_citizen_only("USER")
    return user
