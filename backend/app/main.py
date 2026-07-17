import logging
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config.settings import settings
from app.config.logging import setup_logging
from app.lifespan import lifespan

# Import database models to register them with SQLAlchemy Base
from app.database import models

# Import Custom Middlewares
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.authentication import AuthenticationMiddleware
from app.middleware.authorization import AuthorizationMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.cors import register_cors_middleware
from app.middleware.exception_handler import register_exception_handlers

# Import Routers
from app.routers import (
    auth,
    user,
    admin,
    detection,
    reports,
    analytics,
    health,
    community,
    assistant,
    scanner,
)

# Configure logging
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade AI-powered Indian Currency Counterfeit Detection System Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    lifespan=lifespan,
    debug=settings.DEBUG,
)

# Register Custom Middlewares (Outermost first)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthorizationMiddleware)
app.add_middleware(AuthenticationMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIdMiddleware)

# Register CORS Middleware configuration
register_cors_middleware(app)

# Register Custom Global Exception Handlers
register_exception_handlers(app)

# Register Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(user.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(detection.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(community.router, prefix=settings.API_PREFIX)
app.include_router(assistant.router, prefix=settings.API_PREFIX)
app.include_router(scanner.router, prefix=settings.API_PREFIX)

# Serve uploaded banknote images as static files at /media/uploads/<filename>
_media_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../media"))
os.makedirs(os.path.join(_media_dir, "uploads"), exist_ok=True)
app.mount("/media", StaticFiles(directory=_media_dir), name="media")


@app.get("/")
async def root():
    return {
        "message": f"Welcome to the {settings.APP_NAME} API. Access documentation at /docs",
        "docs": "/docs",
        "status": "online",
    }
