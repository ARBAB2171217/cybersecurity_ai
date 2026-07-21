import os
import cv2
import numpy as np
from app.ai.pipelines.ocr_pipeline import run_ocr
from app.services.qr_detection_service import QRDetectionService
from app.services.forensics.models import PreprocessingContext

class PreprocessingEngine:
    @staticmethod
    def execute(image_path: str) -> PreprocessingContext:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("OpenCV failed to read image.")
            
        height, width = img.shape[:2]
        aspect_ratio = width / float(height) if height else 0.0
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Canny edges and density
        top = gray[: max(1, int(height * 0.08)), :]
        bottom = gray[int(height * 0.92):, :]
        top_edges = cv2.Canny(top, 60, 160)
        bottom_edges = cv2.Canny(bottom, 60, 160)
        top_density = float(np.mean(top_edges > 0)) if top_edges.size > 0 else 0.0
        bottom_density = float(np.mean(bottom_edges > 0)) if bottom_edges.size > 0 else 0.0
        
        # Rectangular UI
        _, threshold = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY_INV)
        components, _, stats, _ = cv2.connectedComponentsWithStats(threshold, 8)
        rect_ui = 0
        for i in range(1, components):
            x, y, w, h, area = stats[i]
            if 20 <= w <= width * 0.95 and 12 <= h <= height * 0.35 and area > 100:
                rect_ui += 1
                
        # QR
        qr_detected = False
        qr_payloads = []
        try:
            qr_res = QRDetectionService.detect_and_decode(image_path)
            if qr_res and qr_res.get("qr_detected"):
                qr_detected = True
                qr_payloads.append(qr_res)
        except Exception:
            pass
            
        # OCR
        ocr_text = ""
        ocr_blocks = []
        ocr_conf = 0.0
        if not qr_detected:
            try:
                ocr_res = run_ocr(image_path)
                ocr_text = ocr_res.get("raw_text", "")
                ocr_blocks = ocr_res.get("blocks", [])
                confs = [b["confidence"] for b in ocr_blocks if "confidence" in b]
                ocr_conf = sum(confs)/len(confs) if confs else 1.0
            except Exception:
                pass
                
        return PreprocessingContext(
            original_path=image_path,
            processed_path=image_path,
            width=width,
            height=height,
            aspect_ratio=aspect_ratio,
            format=os.path.splitext(image_path)[1].lstrip('.'),
            ocr_text=ocr_text,
            ocr_blocks=ocr_blocks,
            ocr_confidence=ocr_conf,
            gray_image=gray,
            rgb_image=img,
            edges=cv2.Canny(gray, 60, 160),
            top_edges_density=top_density,
            bottom_edges_density=bottom_density,
            rectangular_ui_count=rect_ui,
            qr_payloads=qr_payloads,
            qr_detected=qr_detected
        )
