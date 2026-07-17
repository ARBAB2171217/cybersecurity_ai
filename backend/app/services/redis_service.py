import logging
import redis.asyncio as aioredis
from typing import Optional, Any, Dict
from app.config.settings import settings

logger = logging.getLogger(__name__)

class RedisService:
    """
    Asynchronous Redis Service client wrapper.
    Falls back to a safe in-memory dictionary if Redis connection is not available.
    """
    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
        self.in_memory_fallback: Dict[str, Any] = {}
        self.use_fallback = False

    def connect(self) -> None:
        try:
            # Short timeout to fail-fast and use in-memory fallback during local boot
            self.redis_client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=2.0
            )
            self.use_fallback = False
        except Exception as e:
            logger.warning(
                f"Failed to connect to Redis at {settings.REDIS_URL}: {e}. "
                "Falling back to in-memory dictionary storage."
            )
            self.use_fallback = True

    async def set(self, key: str, value: Any, expire_seconds: Optional[int] = None) -> None:
        if self.use_fallback:
            self.in_memory_fallback[key] = value
            return
            
        try:
            if not self.redis_client:
                self.connect()
            await self.redis_client.set(key, str(value), ex=expire_seconds)
        except Exception as e:
            logger.warning(f"Redis set operation failed: {e}. Falling back to memory.")
            self.use_fallback = True
            self.in_memory_fallback[key] = value

    async def get(self, key: str) -> Optional[str]:
        if self.use_fallback:
            return str(self.in_memory_fallback.get(key)) if key in self.in_memory_fallback else None
            
        try:
            if not self.redis_client:
                self.connect()
            return await self.redis_client.get(key)
        except Exception as e:
            logger.warning(f"Redis get operation failed: {e}. Falling back to memory.")
            self.use_fallback = True
            return str(self.in_memory_fallback.get(key)) if key in self.in_memory_fallback else None

    async def delete(self, key: str) -> None:
        if self.use_fallback:
            self.in_memory_fallback.pop(key, None)
            return
            
        try:
            if not self.redis_client:
                self.connect()
            await self.redis_client.delete(key)
        except Exception as e:
            logger.warning(f"Redis delete operation failed: {e}.")
            self.in_memory_fallback.pop(key, None)

redis_service = RedisService()
