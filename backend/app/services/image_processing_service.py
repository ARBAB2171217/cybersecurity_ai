import os
import uuid
import asyncio
import logging
from typing import Optional
from fastapi import HTTPException, UploadFile, status
from app.ai.pipelines.preprocessing import preprocess_image
from app.config.constants import MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_EXTENSIONS

logger = logging.getLogger("app.services.image_processing_service")

# Absolute path to the media/uploads directory, relative to this file
_UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../media/uploads")
)
os.makedirs(_UPLOAD_DIR, exist_ok=True)


class ImageProcessingService:
    """
    Business service to manage secure image file uploads, validation,
    preprocessing, and guaranteed cleanup of temporary files.
    """

    def __init__(self):
        self.upload_dir = _UPLOAD_DIR

    # ─── Validation ──────────────────────────────────────────────────────────

    def validate_image_file(self, file: UploadFile) -> None:
        """
        Validates file extension, MIME type, and size.
        Raises HTTPException 400 on any violation.
        """
        filename = file.filename or ""
        ext = os.path.splitext(filename)[1].lstrip(".").lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid file extension '.{ext}'. "
                    f"Allowed: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
                ),
            )

        allowed_mime_types = {"image/jpeg", "image/jpg", "image/png"}
        if file.content_type not in allowed_mime_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid MIME type '{file.content_type}'. "
                    "Only JPEG and PNG images are accepted."
                ),
            )

        # Peek at file size without consuming the stream
        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)  # Rewind so subsequent reads work

        if size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        if size > MAX_IMAGE_SIZE_BYTES:
            max_mb = MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds the {max_mb:.0f}MB limit.",
            )

    # ─── Save to Disk ─────────────────────────────────────────────────────────

    async def save_upload(self, file: UploadFile) -> str:
        """
        Reads the uploaded file and writes it to disk with a UUID filename.
        Returns the absolute path to the saved file.
        Raises HTTPException 500 on write failure.
        """
        ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
        unique_name = f"{uuid.uuid4()}{ext}"
        dest_path = os.path.join(self.upload_dir, unique_name)

        try:
            contents = await file.read()
            with open(dest_path, "wb") as f:
                f.write(contents)
            logger.info(f"Uploaded file saved: {unique_name}")
            return dest_path
        except Exception as exc:
            logger.error(f"Failed to write uploaded file to disk: {exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server could not save the uploaded image.",
            )
        finally:
            await file.close()

    # ─── Preprocess (non-blocking) ────────────────────────────────────────────

    async def preprocess(self, image_path: str, save_path: Optional[str] = None) -> str:
        """
        Runs image preprocessing in a thread pool to avoid blocking the event loop.
        Returns the path to the preprocessed file.
        """
        return await asyncio.to_thread(preprocess_image, image_path, save_path)

    # ─── Cleanup ──────────────────────────────────────────────────────────────

    @staticmethod
    def delete_file(path: str) -> None:
        """
        Deletes a file from disk. Silently skips if the file does not exist.
        Logs a warning on any unexpected OS error.
        """
        try:
            if path and os.path.exists(path):
                os.remove(path)
                logger.info(f"Deleted temporary file: {path}")
        except OSError as exc:
            logger.warning(f"Could not delete file '{path}': {exc}")
