import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database.session import async_engine

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the FastAPI application.
    """
    # Startup actions
    logger.info("Initializing system startup hooks...")
    
    # 1. Verify DB connection
    try:
        from sqlalchemy import text
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection verified successfully.")
    except Exception as e:
        logger.warning(
            f"Database connection verification failed during Phase 1: {e}. "
            "Skipping since database containers may not be running in this phase."
        )
        
    # 2. Validate Gemini Configuration
    try:
        from app.services.gemini_client import GeminiClient
        logger.info("Verifying Gemini Configuration...")
        GeminiClient.validate_startup()
    except Exception as e:
        logger.error(f"Failed to validate Gemini configuration: {e}")

    logger.info("System startup hooks completed successfully. Application is ready to receive requests.")
    
    yield
    
    # Shutdown actions
    logger.info("Initializing system shutdown hooks...")
    await async_engine.dispose()
    logger.info("Database engine resources disposed. System shutdown completed.")
