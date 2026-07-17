import os
from fastapi import HTTPException, status, UploadFile
from app.config.constants import MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_EXTENSIONS

def validate_image_upload(file: UploadFile) -> None:
    """
    Validates uploaded files for size, extension, and MIME type.
    """
    # 1. Validate extension
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lstrip('.').lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed extensions: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )
        
    # 2. Validate MIME type
    allowed_mime_types = {"image/jpeg", "image/jpg", "image/png"}
    if file.content_type not in allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG and PNG images are allowed."
        )

    # 3. Validate file size
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)  # Rewind to starting position so other dependencies can read it

    if size > MAX_IMAGE_SIZE_BYTES:
        max_mb = MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds limit of {max_mb:.1f}MB."
        )
