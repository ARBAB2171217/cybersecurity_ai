import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("app.middleware.logging")

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware logging incoming request metadata, completion execution times, and failures.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()
        method = request.method
        path = request.url.path
        
        # Capture trace identifier from RequestIdMiddleware
        request_id = getattr(request.state, "request_id", "N/A")
        logger.info(f"[{request_id}] START {method} {path}")

        try:
            response = await call_next(request)
            duration = (time.time() - start_time) * 1000
            logger.info(
                f"[{request_id}] END {method} {path} | "
                f"Status: {response.status_code} | Duration: {duration:.2f}ms"
            )
            return response
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            logger.error(
                f"[{request_id}] ERROR {method} {path} | "
                f"Exception: {str(e)} | Duration: {duration:.2f}ms",
                exc_info=True
            )
            raise e
