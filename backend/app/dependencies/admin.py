from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.dependencies.database import get_admin_repo
from app.repositories.admin_repository import AdminRepository
from app.services.jwt_service import jwt_service
from app.models.admin import Admin

security = HTTPBearer()

async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    admin_repo: AdminRepository = Depends(get_admin_repo)
) -> Admin:
    """
    Decodes the Bearer token, validates it, and fetches the matching administrator.
    """
    token = credentials.credentials
    payload = jwt_service.verify_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    admin_id = payload.get("sub")
    role = payload.get("role")
    
    # Enforce admin credentials claim
    if role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative credentials required.",
        )
        
    admin = await admin_repo.get_by_id(admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrator profile not found.",
        )
        
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative profile is deactivated.",
        )
        
    return admin
