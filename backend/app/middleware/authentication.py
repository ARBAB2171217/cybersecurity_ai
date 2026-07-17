from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from app.services.jwt_service import jwt_service

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Middleware that parses JWT Bearer tokens from the Authorization header 
    and caches the payload in request.state.user_payload.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request.state.user_payload = None
        
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = jwt_service.verify_token(token)
            if payload and payload.get("type") == "access":
                request.state.user_payload = payload
                
        return await call_next(request)
