from fastapi import UploadFile
from app.security.file_validation import validate_image_upload

async def get_validated_upload_file(file: UploadFile) -> UploadFile:
    """
    FastAPI Router dependency that runs security, type, and size checks on uploaded files.
    """
    validate_image_upload(file)
    return file
