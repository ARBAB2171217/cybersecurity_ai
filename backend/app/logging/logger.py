import logging
import sys
from logging.config import dictConfig
from app.config.settings import settings

def setup_app_logging() -> None:
    """
    Initializes structured dictConfig, registering the custom RequestIdFilter
    and StructuredJsonFormatter classes.
    """
    log_level = settings.LOG_LEVEL.upper()
    
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "console_dev": {
                "format": "%(asctime)s - %(levelname)s - [%(name)s] - [%(request_id)s] %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "json_prod": {
                "()": "app.logging.formatter.StructuredJsonFormatter",
            },
        },
        "filters": {
            "request_id_filter": {
                "()": "app.logging.filters.RequestIdFilter",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "console_dev" if settings.APP_ENV == "development" else "json_prod",
                "stream": sys.stdout,
                "filters": ["request_id_filter"],
            },
        },
        "root": {
            "level": log_level,
            "handlers": ["console"],
        },
        "loggers": {
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
            "sqlalchemy.engine": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False,
            },
        },
    }
    
    dictConfig(log_config)
    logging.getLogger("app.logging.logger").info("Advanced logging initialized successfully.")
