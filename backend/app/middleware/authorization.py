from fastapi import status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from app.schemas.response import StandardResponse

class AuthorizationMiddleware(BaseHTTPMiddleware):
    """
    Middleware acting as a global security guard, blocking requests to admin
    or analytics endpoints if the token role claim does not contain admin privileges.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)
            
        path = request.url.path
        
        # Lock down admin and analytics path prefixes
        if path.startswith("/api/v1/admin") or path.startswith("/api/v1/analytics"):
            payload = getattr(request.state, "user_payload", None)
            if not payload or payload.get("role") not in ["ADMIN", "SUPER_ADMIN"]:
                response_content = StandardResponse(
                    success=False,
                    message="Access forbidden: administrative credentials required.",
                    data=None
                ).model_dump()
                return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content=response_content)
                
        return await call_next(request)
