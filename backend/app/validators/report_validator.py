from fastapi import HTTPException, status
from app.config.constants import VALID_DENOMINATIONS

def validate_report_payload(denomination: int = None, serial_number: str = None) -> None:
    """
    Validates report fields, checking that denominations match official Indian Rupees.
    """
    if denomination is not None and denomination not in VALID_DENOMINATIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid denomination. Allowed Indian currency notes: {', '.join(map(str, sorted(VALID_DENOMINATIONS)))}"
        )
        
    if serial_number and len(serial_number.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Serial number must be at least 3 characters long."
        )
