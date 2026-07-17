from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings

def register_cors_middleware(app: FastAPI) -> None:
    """
    Registers CORS middleware with the FastAPI application using configuration settings.
    """
    origins = settings.CORS_ORIGINS
    if isinstance(origins, str):
         # Safeguard parsing comma separated string configurations
         origins = [o.strip() for o in origins.split(",") if o.strip()]
         
    if "*" in origins:
        origins.remove("*")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept", "Origin"],
    )
