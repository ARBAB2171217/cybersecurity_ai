from typing import List, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "CyberShield Currency AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "temporary_secret_key_for_development"
    API_PREFIX: str = "/api/v1"

    # CORS Configuration
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database Configuration
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cybershield"
    ASYNC_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cybershield"

    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"

    # Logging
    LOG_LEVEL: str = "INFO"

    # SMTP Configuration (Gmail fallback by default)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@cybershield.in"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Gemini AI
    GEMINI_API_KEY: str = ""

    # Threat Intelligence APIs
    GOOGLE_SAFE_BROWSING_API_KEY: str = ""
    VIRUSTOTAL_API_KEY: str = ""

    # JWT Configuration
    JWT_SECRET_KEY: str = ""
    JWT_REFRESH_SECRET_KEY: str = ""

    @model_validator(mode="after")
    def adjust_configurations(self) -> "Settings":
        # Database URL resolution
        db_url = self.DATABASE_URL
        if db_url.startswith("postgresql+asyncpg://"):
            self.ASYNC_DATABASE_URL = db_url
            self.DATABASE_URL = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)
        elif db_url.startswith("postgresql://"):
            self.ASYNC_DATABASE_URL = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # SMTP username resolution
        if self.SMTP_USERNAME and not self.SMTP_USER:
            self.SMTP_USER = self.SMTP_USERNAME
        elif self.SMTP_USER and not self.SMTP_USERNAME:
            self.SMTP_USERNAME = self.SMTP_USER

        # Verify that all required environment variables are present and non-empty
        required_vars = {
            "SECRET_KEY": self.SECRET_KEY,
            "DATABASE_URL": self.DATABASE_URL,
            "REDIS_URL": self.REDIS_URL,
            "JWT_SECRET_KEY": self.JWT_SECRET_KEY,
            "JWT_REFRESH_SECRET_KEY": self.JWT_REFRESH_SECRET_KEY,
            "GOOGLE_CLIENT_ID": self.GOOGLE_CLIENT_ID,
            "SMTP_HOST": self.SMTP_HOST,
            "SMTP_PORT": self.SMTP_PORT,
            "SMTP_USERNAME": self.SMTP_USERNAME,
            "SMTP_PASSWORD": self.SMTP_PASSWORD,
            "GEMINI_API_KEY": self.GEMINI_API_KEY,
        }

        missing = [k for k, v in required_vars.items() if not v or str(v).strip() == ""]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

        return self

settings = Settings()


