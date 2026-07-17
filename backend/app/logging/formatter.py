import json
import logging
import datetime

class StructuredJsonFormatter(logging.Formatter):
    """
    Formator to serialize Python log records into JSON lines.
    Useful for indexers like ELK, Datadog, or AWS CloudWatch.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "location": f"{record.filename}:{record.lineno}",
            "function": record.funcName
        }
        
        # Include context trace details if populated by RequestIdMiddleware
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
            
        # Append traceback details if exceptions occurred
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_data)
