from app.exceptions.custom import AppBaseException

class ValidationException(AppBaseException):
    """
    Raised when custom validation rules (disposable email domain, password strength) fail.
    """
    def __init__(self, message: str = "Request validation failed."):
        super().__init__(message, status_code=422)
