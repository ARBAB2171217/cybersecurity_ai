import time
from collections import defaultdict
from fastapi import HTTPException, Request, status
from typing import Dict, List


class InMemoryRateLimiter:
    """
    Sliding window in-memory rate limiter.
    Designed to be replaceable with a Redis-backed implementation in production.
    """

    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.requests_tracker: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, client_ip: str) -> bool:
        current_time = time.time()
        # Prune timestamps outside the current sliding window
        self.requests_tracker[client_ip] = [
            t for t in self.requests_tracker[client_ip]
            if current_time - t < self.window_seconds
        ]

        if len(self.requests_tracker[client_ip]) >= self.requests_limit:
            return True

        self.requests_tracker[client_ip].append(current_time)
        return False

    def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "127.0.0.1"

        if self.is_rate_limited(client_ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please slow down and try again in a moment.",
                headers={"Retry-After": str(self.window_seconds)},
            )


# ─── Preconfigured Limiters ───────────────────────────────────────────────

# Auth / OTP endpoints: tight limit to prevent brute-force and OTP abuse.
# 10 requests per 60 seconds per IP (raised from 5 to handle OTP resend flow).
auth_rate_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)

# General API endpoints: raised from 100 → 300 per 60 seconds.
#
# Reasoning: the dashboard page legitimately fires multiple concurrent API calls
# on every mount (profile, reports, analytics). In development, React StrictMode
# intentionally double-invokes effects, effectively doubling the request count.
# At 100 req/60s a normal dashboard page load could hit the limit in seconds,
# causing 429 responses that were incorrectly triggering logout (now fixed in
# auth.store.ts). 300 req/60s comfortably supports normal usage while still
# blocking abusive automation.
general_rate_limiter = InMemoryRateLimiter(requests_limit=300, window_seconds=60)
