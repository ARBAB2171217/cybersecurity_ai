import re
from fastapi import HTTPException, status

DISPOSABLE_DOMAINS = {"mailinator.com", "yopmail.com", "tempmail.com", "10minutemail.com", "guerrillamail.com"}

def validate_email_format(email: str) -> str:
    """
    Validates general email formatting and prevents disposable email addresses.
    """
    email = email.strip().lower()
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    
    if not re.match(email_regex, email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided string is not a valid email address format."
        )
        
    domain = email.split("@")[-1]
    if domain in DISPOSABLE_DOMAINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration using disposable email services is prohibited."
        )
        
    return email
