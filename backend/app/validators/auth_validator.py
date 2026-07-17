from fastapi import HTTPException, status
from app.schemas.auth import RegisterRequest
from app.validators.email_validator import validate_email_format
from app.validators.password_validator import validate_password_strength

def validate_registration_payload(payload: RegisterRequest) -> RegisterRequest:
    """
    Validates email format, password complexity, and name length for signup payloads.
    """
    payload.email = validate_email_format(payload.email)
    validate_password_strength(payload.password)
    
    if len(payload.full_name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be at least 2 characters long."
        )
        
    return payload
