class AppBaseException(Exception):
    """
    Base exception class for all custom system errors.
    """
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
