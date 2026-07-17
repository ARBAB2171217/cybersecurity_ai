import logging
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.schemas.response import StandardResponse
from app.exceptions.custom import AppBaseException

logger = logging.getLogger("app.middleware.exception_handler")

def add_cors_headers(request: Request, response: JSONResponse) -> JSONResponse:
    origin = request.headers.get("origin")
    if origin:
        from app.config.settings import settings
        origins = settings.CORS_ORIGINS
        if isinstance(origins, str):
            origins = [o.strip() for o in origins.split(",") if o.strip()]
        if "*" in origins or origin in origins or "http://localhost:3000" in origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
    return response

async def app_base_exception_handler(request: Request, exc: AppBaseException) -> JSONResponse:
    """
    Formats custom AppBaseExceptions to follow the StandardResponse schema.
    """
    request_id = getattr(request.state, "request_id", "N/A")
    logger.warning(f"[{request_id}] Application error: {exc.message} (Status: {exc.status_code})")
    
    response_content = StandardResponse(
        success=False,
        message=exc.message,
        data=None
    ).model_dump()
    
    response = JSONResponse(
        status_code=exc.status_code,
        content=response_content
    )
    return add_cors_headers(request, response)

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Formats HTTPExceptions to follow the StandardResponse schema.
    """
    request_id = getattr(request.state, "request_id", "N/A")
    logger.warning(f"[{request_id}] HTTP error: {exc.detail} (Status: {exc.status_code})")
    
    response_content = StandardResponse(
        success=False,
        message=exc.detail,
        data=None
    ).model_dump()
    
    response = JSONResponse(
        status_code=exc.status_code,
        content=response_content,
        headers=exc.headers
    )
    return add_cors_headers(request, response)

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Formats Pydantic model validation errors.
    """
    request_id = getattr(request.state, "request_id", "N/A")
    logger.warning(f"[{request_id}] Validation error: {exc.errors()}")
    
    # Standardize the validation error messages into a readable format
    errors = exc.errors()
    error_msg = "Validation failed: " + "; ".join([f"{'.'.join(map(str, err['loc']))}: {err['msg']}" for err in errors])
    
    response_content = StandardResponse(
        success=False,
        message=error_msg,
        data={"errors": errors}
    ).model_dump()
    
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_content
    )
    return add_cors_headers(request, response)

async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all for internal unexpected system errors.
    """
    request_id = getattr(request.state, "request_id", "N/A")
    logger.error(f"[{request_id}] Unhandled crash: {str(exc)}", exc_info=True)
    
    response_content = StandardResponse(
        success=False,
        message="An unexpected system error occurred. Our engineers have been notified.",
        data=None
    ).model_dump()
    
    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response_content
    )
    return add_cors_headers(request, response)

def register_exception_handlers(app: FastAPI) -> None:
    """
    Registers custom exception wrappers to the FastAPI application instance.
    """
    app.add_exception_handler(AppBaseException, app_base_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
