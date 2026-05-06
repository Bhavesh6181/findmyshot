import os
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request


class InMemoryRateLimiter:
    """Simple per-IP per-route sliding-window limiter for write APIs."""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str):
        now = time.time()
        cutoff = now - self.window_seconds
        with self._lock:
            bucket = self._requests[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.max_requests:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again soon.")
            bucket.append(now)


WRITE_RATE_LIMIT = InMemoryRateLimiter(
    max_requests=int(os.getenv("WRITE_RATE_LIMIT_COUNT", "60")),
    window_seconds=int(os.getenv("WRITE_RATE_LIMIT_WINDOW_SECONDS", "60")),
)


def enforce_write_rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    key = f"{ip}:{request.url.path}"
    WRITE_RATE_LIMIT.check(key)
