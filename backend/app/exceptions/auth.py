from app.exceptions.custom import AppBaseException

class AuthenticationException(AppBaseException):
    """
    Raised when authentication credentials fail validation.
    """
    def __init__(self, message: str = "Invalid credentials or authorization token."):
        super().__init__(message, status_code=401)

class TokenExpiredException(AppBaseException):
    """
    Raised when authorization token expires.
    """
    def __init__(self, message: str = "Authorization token has expired."):
        super().__init__(message, status_code=401)

class PermissionDeniedException(AppBaseException):
    """
    Raised when role authorization checks fail.
    """
    def __init__(self, message: str = "Access forbidden: insufficient permissions."):
        super().__init__(message, status_code=403)
