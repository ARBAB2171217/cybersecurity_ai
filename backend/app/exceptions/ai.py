from app.exceptions.custom import AppBaseException

class AIDetectionException(AppBaseException):
    """
    Raised when the core counterfeiting analysis pipeline breaks.
    """
    def __init__(self, message: str = "Counterfeit notes analysis failed."):
        super().__init__(message, status_code=500)

class OCRProcessingException(AppBaseException):
    """
    Raised when EasyOCR fails to initialize or parse text structures.
    """
    def __init__(self, message: str = "Optical Character Recognition processing failed."):
        super().__init__(message, status_code=500)

class GeminiTimeoutException(AppBaseException):
    """
    Raised when Gemini Vision API requests fail due to timeouts.
    """
    def __init__(self, message: str = "Gemini Vision API request timed out."):
        super().__init__(message, status_code=504)
