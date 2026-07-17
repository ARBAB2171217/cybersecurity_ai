import os
import uuid
import logging
from fastapi import UploadFile, HTTPException, status
from app.security.file_validation import validate_image_upload

logger = logging.getLogger("app.services.upload_service")

# Absolute path to the upload directory
_UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../media/uploads")
)
os.makedirs(_UPLOAD_DIR, exist_ok=True)


class UploadService:
    """
    Handles secure file upload: validates then writes to disk.
    Returns the static relative URL stored in the Report.image_url column.
    The AI detection service is responsible for deleting the file after processing.
    """

    def __init__(self):
        self.upload_dir = _UPLOAD_DIR

    async def save_uploaded_image(self, file: UploadFile) -> str:
        """
        Validates the uploaded image and saves it to media/uploads/.
        Returns the relative URL: /media/uploads/<uuid>.<ext>
        Raises HTTPException on validation failure or write error.
        """
        # 1. Run security/integrity validation (extension, MIME type, size)
        validate_image_upload(file)

        # 2. Generate a collision-proof filename
        ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
        unique_filename = f"{uuid.uuid4()}{ext}"
        dest_path = os.path.join(self.upload_dir, unique_filename)

        try:
            contents = await file.read()
            if not contents:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file is empty.",
                )
            with open(dest_path, "wb") as f:
                f.write(contents)
            logger.info(f"Saved uploaded image: {unique_filename}")
            return f"/media/uploads/{unique_filename}"

        except HTTPException:
            raise

        except Exception as exc:
            logger.error(f"Failed to save uploaded image: {exc}", exc_info=True)
            # Attempt to clean up a partial write
            if os.path.exists(dest_path):
                try:
                    os.remove(dest_path)
                except OSError:
                    pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server could not save the uploaded image. Please try again.",
            )

        finally:
            await file.close()


upload_service = UploadService()
