"""
Application constants for the Indian Currency Counterfeit Detection System.
"""

# Security & Token Expiry
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
OTP_EXPIRE_SECONDS = 300

# File Upload Constraints
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png"}

# Indian Currency Metadata
VALID_DENOMINATIONS = {10, 20, 50, 100, 200, 500, 2000}

# Pagination Defaults
DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 100
