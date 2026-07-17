import uuid
from typing import List, Tuple
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdateRequest
from app.models.user import User

class UserService:
    """
    Business service managing profile details and status states of citizens.
    """
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_by_id(self, user_id: uuid.UUID) -> User:
        """
        Retrieves a user profile, raising a 404 error if not found or soft-deleted.
        """
        user = await self.user_repo.get_by_id(user_id)
        if not user or user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        return user

    async def update_user_profile(self, user_id: uuid.UUID, request: UserUpdateRequest) -> User:
        """
        Updates profile details of an existing user.
        """
        user = await self.get_user_by_id(user_id)
        update_data = request.model_dump(exclude_unset=True)
        return await self.user_repo.update(user, update_data)

    async def deactivate_user(self, user_id: uuid.UUID) -> User:
        """
        Deactivates a user's active status.
        """
        user = await self.get_user_by_id(user_id)
        return await self.user_repo.update(user, {"is_active": False})

    async def list_users(self, page: int = 1, size: int = 10) -> Tuple[List[User], int]:
        """
        Returns a paginated list of all active/verified users.
        """
        return await self.user_repo.list_paginated(page=page, size=size)
