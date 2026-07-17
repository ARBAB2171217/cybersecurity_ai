from fastapi import HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from app.security.rate_limit import general_rate_limiter, auth_rate_limiter
from app.schemas.response import StandardResponse

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces sliding window rate limits on all incoming requests.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)
            
        path = request.url.path
        
        # Bypass rate limit checks for system health checks and Google OAuth callbacks
        if path.endswith("/health") or "/auth/google" in path:
            return await call_next(request)
            
        try:
            # Enforce tighter window limits on authentication/OTP routes
            if "/auth" in path or "/otp" in path:
                auth_rate_limiter(request)
            else:
                general_rate_limiter(request)
        except HTTPException as e:
            # Catch rate limit HTTPException and return a StandardResponse wrapper
            response_content = StandardResponse(
                success=False,
                message=e.detail,
                data=None
            ).model_dump()
            return JSONResponse(status_code=e.status_code, content=response_content)
            
        return await call_next(request)
