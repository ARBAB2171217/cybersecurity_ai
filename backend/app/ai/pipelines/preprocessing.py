import os
import cv2
import numpy as np
import logging
from typing import Optional, Dict, Any
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger("app.ai.pipelines.preprocessing")


def preprocess_universal_image(
    image_path: str,
    save_path: Optional[str] = None,
    max_dim: int = 1600,
) -> Dict[str, Any]:
    """
    Production-safe preprocessing used before universal scanner routing.
    It validates image integrity, applies EXIF orientation, converts to RGB,
    removes alpha, normalizes brightness/contrast, estimates quality metrics,
    and writes one cached normalized image for downstream deterministic checks.
    """
    if not os.path.exists(image_path):
        raise ValueError(f"Source image not found: {image_path}")

    if os.path.getsize(image_path) == 0:
        raise ValueError("Uploaded image is empty.")

    try:
        with Image.open(image_path) as probe:
            probe.verify()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValueError("Uploaded image is corrupted or is not a valid image.") from exc

    try:
        with Image.open(image_path) as pil_img:
            pil_img = ImageOps.exif_transpose(pil_img)
            original_width, original_height = pil_img.size
            original_mode = pil_img.mode

            if original_width < 80 or original_height < 80:
                raise ValueError("Image resolution is too low for analysis.")

            # Limit decoded memory pressure before converting to NumPy.
            if original_width * original_height > 25_000_000:
                raise ValueError("Image resolution is too large for safe processing.")

            if pil_img.mode in ("RGBA", "LA") or (
                pil_img.mode == "P" and "transparency" in pil_img.info
            ):
                background = Image.new("RGB", pil_img.size, (255, 255, 255))
                alpha = pil_img.convert("RGBA").split()[-1]
                background.paste(pil_img.convert("RGBA"), mask=alpha)
                pil_img = background
            else:
                pil_img = pil_img.convert("RGB")

            width, height = pil_img.size
            scale = 1.0
            if max(width, height) > max_dim:
                scale = max_dim / float(max(width, height))
                pil_img = pil_img.resize(
                    (max(1, int(width * scale)), max(1, int(height * scale))),
                    Image.Resampling.LANCZOS,
                )

            rgb = np.array(pil_img)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Image preprocessing failed during safe decode.") from exc

    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))
    noise_estimate = float(np.std(gray.astype("float32") - cv2.GaussianBlur(gray, (5, 5), 0).astype("float32")))

    # Normalize contrast first, then gently correct brightness toward a readable midtone.
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)
    normalized = cv2.cvtColor(cv2.merge((l_channel, a_channel, b_channel)), cv2.COLOR_LAB2RGB)

    normalized_gray = cv2.cvtColor(normalized, cv2.COLOR_RGB2GRAY)
    normalized_brightness = float(np.mean(normalized_gray))
    beta = int(np.clip(128.0 - normalized_brightness, -35, 35))
    normalized = cv2.convertScaleAbs(normalized, alpha=1.0, beta=beta)

    if not save_path:
        dir_name, base_name = os.path.split(image_path)
        root, _ = os.path.splitext(base_name)
        save_path = os.path.join(dir_name, f"universal_{root}.jpg")

    cv2.imwrite(save_path, cv2.cvtColor(normalized, cv2.COLOR_RGB2BGR), [int(cv2.IMWRITE_JPEG_QUALITY), 92])

    final_height, final_width = normalized.shape[:2]
    quality_warnings = []
    if blur_variance < 8.0:
        quality_warnings.append("Image appears very blurry.")
    if contrast < 12.0:
        quality_warnings.append("Image contrast is low.")
    if brightness < 25.0:
        quality_warnings.append("Image is very dark.")
    if brightness > 235.0:
        quality_warnings.append("Image is very bright.")

    return {
        "original_path": image_path,
        "processed_path": save_path,
        "width": final_width,
        "height": final_height,
        "original_width": original_width,
        "original_height": original_height,
        "original_mode": original_mode,
        "scale": round(scale, 4),
        "format": "JPEG",
        "metrics": {
            "blur_variance": round(blur_variance, 2),
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
            "noise_estimate": round(noise_estimate, 2),
        },
        "quality_warnings": quality_warnings,
    }

def assess_image_quality(image_path: str) -> dict:
    """
    Validates the image for blur, exposure, contrast, and layout issues before processing.
    Returns a dictionary with quality metrics.
    Raises ValueError with a validation message if quality is too poor to continue.
    """
    if not os.path.exists(image_path):
        raise ValueError(f"Source image not found: {image_path}")
        
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Image could not be read or is corrupted.")
        
    height, width = img.shape[:2]
    
    issues = []
    score = 100.0
    
    if width < 250 or height < 250:
        issues.append("Image resolution is too low.")
        score -= 40
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 1. Blur Detection
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 15.0:
        issues.append("Image is too blurry.")
        score -= 30
        
    # 2. Exposure & Contrast
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    v_channel = hsv[:, :, 2]
    mean_v = np.mean(v_channel)
    std_v = np.std(v_channel)
    
    if mean_v < 30:
        issues.append("Image is severely under-exposed (too dark).")
        score -= 20
    if mean_v > 225:
        issues.append("Image is severely over-exposed (too bright).")
        score -= 20
    if std_v < 15:
        issues.append("Image contrast is too low.")
        score -= 15
        
    # 3. Multiple Notes & Partial Note Detection
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    img_area = width * height
    # Large contours represent significant objects
    large_contours = [c for c in contours if cv2.contourArea(c) > 0.05 * img_area]
    
    if len(large_contours) > 1:
        issues.append("Multiple notes or prominent objects detected.")
        score -= 50
        
    if len(large_contours) == 1:
        x, y, w, h = cv2.boundingRect(large_contours[0])
        touches_left = x <= 5
        touches_right = (x + w) >= (width - 5)
        touches_top = y <= 5
        touches_bottom = (y + h) >= (height - 5)
        
        edges_touched = sum([touches_left, touches_right, touches_top, touches_bottom])
        if edges_touched >= 3:
            issues.append("Partial note visibility. Ensure the entire note is within the frame.")
            score -= 30

    score = max(0.0, score)
    status = "ACCEPTABLE"
    if score < 60.0:
        status = "REJECTED"
        
    recommendation = "Image is acceptable."
    if issues:
        recommendation = "Please improve lighting, stabilize the camera, and scan one note at a time."

    if status == "REJECTED":
        raise ValueError(f"Image quality rejected. Issues: {', '.join(issues)}. {recommendation}")
        
    return {
        "quality_score": score,
        "quality_status": status,
        "detected_issues": issues,
        "recommendation": recommendation
    }


def assess_screenshot_quality(image_path: str) -> dict:
    """
    Validates screenshot resolution, blur, and corruption.
    """
    if not os.path.exists(image_path):
        raise ValueError(f"Source screenshot not found: {image_path}")
        
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Image could not be read or is corrupted.")
        
    height, width = img.shape[:2]
    
    issues = []
    score = 100.0
    
    if width < 150 or height < 150:
        issues.append("Screenshot resolution is extremely low.")
        score -= 50
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Blur Detection
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 5.0:
        issues.append("Screenshot is heavily compressed or blurry.")
        score -= 40

    status = "ACCEPTABLE"
    if score < 60.0:
        status = "REJECTED"
        
    recommendation = "Screenshot is acceptable."
    if status == "REJECTED":
        recommendation = "Please capture a clear, uncropped screenshot."
        raise ValueError(f"Image quality rejected. Issues: {', '.join(issues)}. {recommendation}")
        
    return {
        "quality_score": score,
        "quality_status": status,
        "detected_issues": issues,
        "recommendation": recommendation
    }

def auto_crop_and_correct_perspective(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)
    
    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return img
        
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    largest_contour = contours[0]
    
    if cv2.contourArea(largest_contour) < 0.1 * (img.shape[0] * img.shape[1]):
        return img
        
    peri = cv2.arcLength(largest_contour, True)
    approx = cv2.approxPolyDP(largest_contour, 0.02 * peri, True)
    
    if len(approx) == 4:
        pts = approx.reshape(4, 2)
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        (tl, tr, br, bl) = rect
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]], dtype="float32")
            
        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(img, M, (maxWidth, maxHeight))
        
        if maxWidth < maxHeight:
            warped = cv2.rotate(warped, cv2.ROTATE_90_CLOCKWISE)
            
        return warped
    return img

def preprocess_image(image_path: str, save_path: Optional[str] = None) -> str:
    """
    Applies image enhancement techniques to optimize the file for OCR and AI analysis:
    - Standardizes scale (max 1200px)
    - Bilateral filter for noise reduction (preserves security print edges)
    - CLAHE (Contrast Limited Adaptive Histogram Equalization) on LAB color space.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Source image not found: {image_path}")

    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Unable to read image file at {image_path}")

        # 1. Resize if size exceeds maximum boundary
        height, width = img.shape[:2]
        max_dim = 1200
        if max(height, width) > max_dim:
            scale = max_dim / max(height, width)
            new_w, new_h = int(width * scale), int(height * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
            logger.info(f"Resized image from {width}x{height} to {new_w}x{new_h}")

        # 1.5 Auto Crop & Perspective Correction
        img = auto_crop_and_correct_perspective(img)

        # 2. Denoise with Bilateral Filter (maintains sharp text contrast)
        denoised = cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75)

        # 3. Enhance Contrast & Lighting using CLAHE on L-channel
        lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)
        
        merged_lab = cv2.merge((cl, a_channel, b_channel))
        enhanced = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

        # Define destination path
        if not save_path:
            dir_name, base_name = os.path.split(image_path)
            save_path = os.path.join(dir_name, f"proc_{base_name}")

        cv2.imwrite(save_path, enhanced)
        logger.info(f"Image preprocessed and saved: {save_path}")
        return save_path

    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}. Returning original path.", exc_info=True)
        # Fail-safe: return the original image path if CV fails
        return image_path

def preprocess_for_ocr(image_path: str, save_path: Optional[str] = None) -> str:
    """
    Applies adaptive thresholding specifically optimized for OCR extraction.
    """
    if not os.path.exists(image_path):
        return image_path
        
    try:
        img = cv2.imread(image_path)
        if img is None:
            return image_path
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Adaptive Thresholding for crisp text
        thresh = cv2.adaptiveThreshold(
            gray, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        if not save_path:
            dir_name, base_name = os.path.split(image_path)
            save_path = os.path.join(dir_name, f"ocr_{base_name}")
            
        cv2.imwrite(save_path, thresh)
        return save_path
    except Exception as e:
        logger.error(f"OCR preprocessing failed: {e}")
        return image_path
