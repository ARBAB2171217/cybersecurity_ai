import cv2
import numpy as np
import logging
import os
from typing import Dict, List, Any

logger = logging.getLogger("app.ai.pipelines.feature_detection")

class SecurityFeatureDetector:
    """
    Deterministic Computer Vision-based security feature detection for Indian Currency.
    Uses edge detection, contour analysis, and regional heuristics instead of AI hallucination.
    Designed so that a future YOLO/CNN model can replace the OpenCV detector without changing the pipeline.
    """
    
    @staticmethod
    def detect_features(image_path: str, denomination: int) -> Dict[str, Any]:
        if not os.path.exists(image_path):
            return {"detected": [], "missing": []}
            
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {"detected": [], "missing": []}
                
            height, width = img.shape[:2]
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Precompute useful maps
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 50, 150)
            
            detected = []
            missing = []
            
            # 1. Security Thread Region (usually a vertical line near the center-left/right)
            thread_detected = SecurityFeatureDetector._detect_security_thread(edges, width, height)
            if thread_detected:
                detected.append({"feature": "Security Thread", "status": "Detected", "confidence": 85.0})
            else:
                missing.append({"feature": "Security Thread", "status": "Missing", "confidence": 90.0})

            # 2. Watermark Region (usually a blank region on the left/right depending on side)
            watermark_detected = SecurityFeatureDetector._detect_watermark_region(gray, edges, width, height)
            if watermark_detected:
                detected.append({"feature": "Watermark Region", "status": "Detected", "confidence": 75.0})
            else:
                missing.append({"feature": "Watermark Region", "status": "Missing", "confidence": 80.0})
                
            # 3. See-through Register (small geometric pattern usually near the watermark)
            # 4. RBI Seal / Ashoka Pillar / Governor Signature
            # Due to variations in orientation and sides (front/back), we use generalized texture heuristics 
            # for the remaining features in this OpenCV implementation.
            
            # Simple heuristic for dense text/texture regions indicating panels, signatures, seals
            texture_regions = SecurityFeatureDetector._analyze_texture_density(edges, width, height)
            
            features_to_check = [
                ("Ashoka Pillar", 0.7),
                ("RBI Seal", 0.6),
                ("Governor Signature", 0.5),
                ("Language Panel", 0.8),
                ("Serial Number Region", 0.9)
            ]
            
            # We map texture regions probabilistically as a fallback for CNNs
            for feature, req_density in features_to_check:
                if texture_regions > req_density:
                    detected.append({"feature": feature, "status": "Detected", "confidence": 60.0 + (texture_regions * 10)})
                else:
                    missing.append({"feature": feature, "status": "Missing", "confidence": 70.0})
                    
            return {
                "detected": detected,
                "missing": missing
            }
            
        except Exception as e:
            logger.error(f"CV Feature Detection failed: {e}", exc_info=True)
            return {"detected": [], "missing": []}

    @staticmethod
    def _detect_security_thread(edges: np.ndarray, w: int, h: int) -> bool:
        """
        Detects strong vertical lines that resemble a security thread.
        """
        # Focus on the middle 50% of the note
        roi = edges[:, int(w*0.25):int(w*0.75)]
        lines = cv2.HoughLinesP(roi, 1, np.pi/180, threshold=100, minLineLength=h*0.3, maxLineGap=20)
        
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                # Check if line is roughly vertical
                if abs(x1 - x2) < w * 0.05 and abs(y1 - y2) > h * 0.2:
                    return True
        return False

    @staticmethod
    def _detect_watermark_region(gray: np.ndarray, edges: np.ndarray, w: int, h: int) -> bool:
        """
        Looks for a relatively empty (low edge density) but non-uniform area (watermark).
        """
        # Typically left or right 25% of the note
        left_roi_edges = edges[:, :int(w*0.25)]
        right_roi_edges = edges[:, int(w*0.75):]
        
        left_density = np.sum(left_roi_edges) / (h * (w*0.25) * 255)
        right_density = np.sum(right_roi_edges) / (h * (w*0.25) * 255)
        
        # A watermark region should have low edge density compared to the rest of the note
        if left_density < 0.05 or right_density < 0.05:
            return True
        return False

    @staticmethod
    def _analyze_texture_density(edges: np.ndarray, w: int, h: int) -> float:
        """
        Returns a normalized score of texture density across the note, 
        used as a proxy for complex features (seals, panels, microtext).
        """
        density = np.sum(edges) / (w * h * 255)
        # Typical banknotes have a density between 0.1 and 0.3
        # Normalize to a 0-1 scale where 0.15 is considered "high texture" (1.0)
        normalized = min(1.0, density / 0.15)
        return float(normalized)
