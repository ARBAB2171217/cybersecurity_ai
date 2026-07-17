from fastapi import Query
from app.schemas.common import PaginationParams

def get_pagination_params(
    page: int = Query(default=1, ge=1, description="Page number"),
    size: int = Query(default=10, ge=1, le=100, description="Items per page")
) -> PaginationParams:
    """
    Dependency yielding standard pagination structures from URL query parameters.
    """
    return PaginationParams(page=page, size=size)
