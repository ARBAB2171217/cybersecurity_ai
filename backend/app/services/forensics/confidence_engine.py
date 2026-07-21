from app.services.forensics.models import *

class ConfidenceEngine:
    @staticmethod
    def calculate(winning_class: str, matched_features: list, context: PreprocessingContext) -> float:
        if winning_class == "Unknown":
            return 0.0
        if winning_class == "QR Code":
            return 1.0
            
        # Total possible features estimation
        total_possible = {
            "Currency": 8,
            "Screenshot": 8,
            "Document": 4
        }.get(winning_class, 10)
        
        structural = len(matched_features) / total_possible
        ocr = context.ocr_confidence
        visual = 1.0 # default
        
        final = (structural * 0.4) + (ocr * 0.3) + (visual * 0.3)
        return min(final, 1.0)
