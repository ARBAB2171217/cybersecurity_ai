from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.dependencies.database import get_user_repo
from app.repositories.user_repository import UserRepository
from app.services.jwt_service import jwt_service
from app.models.user import User

security = HTTPBearer()

async def get_current_user_unverified(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_repo: UserRepository = Depends(get_user_repo)
) -> User:
    """
    Decodes the Bearer token, validates it, and fetches the matching user
    without checking if they are verified yet.
    """
    token = credentials.credentials
    payload = jwt_service.verify_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing sub.",
        )
        
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )
        
    return user

async def get_current_user(
    user: User = Depends(get_current_user_unverified)
) -> User:
    """
    Returns the user only if their email is verified.
    """
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified. Please verify your account.",
        )
        
    return user
