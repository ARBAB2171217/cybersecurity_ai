import uuid
from typing import List, Tuple
from fastapi import HTTPException, status
from app.repositories.admin_repository import AdminRepository
from app.security.password import hash_password
from app.schemas.admin import AdminCreateRequest, AdminUpdateRequest
from app.models.admin import Admin

class AdminService:
    """
    Business service managing administrative user creation, updates, and soft-deletes.
    """
    def __init__(self, admin_repo: AdminRepository):
        self.admin_repo = admin_repo

    async def get_admin_by_id(self, admin_id: uuid.UUID) -> Admin:
        """
        Retrieves an admin by ID, raising a 404 error if not found or soft-deleted.
        """
        admin = await self.admin_repo.get_by_id(admin_id)
        if not admin or admin.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found."
            )
        return admin

    async def create_admin(self, request: AdminCreateRequest) -> Admin:
        """
        Registers a new admin profile with standard password hashing.
        """
        existing = await self.admin_repo.get_by_email(request.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already registered as admin."
            )
            
        hashed = hash_password(request.password)
        admin_data = {
            "email": request.email,
            "hashed_password": hashed,
            "full_name": request.full_name,
            "role": request.role,
            "is_active": True
        }
        return await self.admin_repo.create(admin_data)

    async def update_admin(self, admin_id: uuid.UUID, request: AdminUpdateRequest) -> Admin:
        """
        Modifies profile variables or active states of an admin account.
        """
        admin = await self.get_admin_by_id(admin_id)
        update_data = request.model_dump(exclude_unset=True)
        return await self.admin_repo.update(admin, update_data)

    async def delete_admin(self, admin_id: uuid.UUID) -> bool:
        """
        Soft-deletes an admin account from database queries.
        """
        return await self.admin_repo.delete(admin_id, soft=True)

    async def list_admins(self, page: int = 1, size: int = 10) -> Tuple[List[Admin], int]:
        """
        Returns a paginated collection of admins.
        """
        return await self.admin_repo.list_paginated(page=page, size=size)
