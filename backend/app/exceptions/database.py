from app.exceptions.custom import AppBaseException

class DatabaseConnectionException(AppBaseException):
    """
    Raised when connecting to PostgreSQL or Redis fails.
    """
    def __init__(self, message: str = "Failed to establish a connection to the database services."):
        super().__init__(message, status_code=500)

class RecordNotFoundException(AppBaseException):
    """
    Raised when a requested DB record is missing.
    """
    def __init__(self, message: str = "Requested database record was not found."):
        super().__init__(message, status_code=404)

class DuplicateRecordException(AppBaseException):
    """
    Raised when constraint violations occur (unique emails, etc.).
    """
    def __init__(self, message: str = "A record with the specified unique values already exists."):
        super().__init__(message, status_code=409)
