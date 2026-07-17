import logging
from contextvars import ContextVar

# ContextVar holding the current Request ID throughout the async lifecycle
request_id_context: ContextVar[str] = ContextVar("request_id", default="")

class RequestIdFilter(logging.Filter):
    """
    Injects request_id context properties into log record attributes.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get()
        return True
