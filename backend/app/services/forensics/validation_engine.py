import os
from PIL import Image

class EvidenceValidationService:
    SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
    
    @staticmethod
    def validate(image_path: str) -> None:
        if not os.path.exists(image_path):
            raise ValueError("File does not exist.")
            
        ext = os.path.splitext(image_path)[1].lower()
        if ext not in EvidenceValidationService.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file format {ext}")
            
        size = os.path.getsize(image_path)
        if size == 0:
            raise ValueError("File is empty (0 bytes).")
            
        try:
            with Image.open(image_path) as img:
                img.verify()
        except Exception:
            raise ValueError("Failed to parse image. File corrupted.")
