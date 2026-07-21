from typing import Dict, Any, Tuple, List
from app.services.forensics.models import *

class FeatureVotingEngine:
    @staticmethod
    def evaluate(feature_sets: Dict[str, FeatureSet]) -> Tuple[str, List[str], List[Dict[str, str]]]:
        rejected = []
        candidates = {}
        
        # 1. Hard Reject & 2. Mandatory Rules
        for name, fset in feature_sets.items():
            if not fset.is_valid:
                continue
                
            if isinstance(fset, QRFeatureSet):
                if fset.has_payload:
                    return "QR Code", ["Decoded Payload"], rejected
                    
            elif isinstance(fset, CurrencyFeatureSet):
                mandatory = (fset.has_rbi_text or fset.has_rupee_symbol) and fset.is_currency_aspect and (fset.has_serial or fset.has_denomination)
                if mandatory:
                    candidates[name] = fset
                else:
                    rejected.append({"class": name, "reason": "Failed Currency Mandatory Rule"})
                    
            elif isinstance(fset, ScreenshotFeatureSet):
                mandatory = fset.is_phone_aspect and (fset.has_status_bar or fset.has_nav_bar or fset.has_chat_layout or fset.has_whatsapp_ui or fset.has_payment_ui)
                if mandatory:
                    candidates[name] = fset
                else:
                    rejected.append({"class": name, "reason": "Failed Screenshot Mandatory Rule"})
                    
            elif isinstance(fset, DocumentFeatureSet):
                mandatory = fset.has_dense_ocr and fset.has_document_keywords
                if mandatory:
                    candidates[name] = fset
                else:
                    rejected.append({"class": name, "reason": "Failed Document Mandatory Rule"})
        
        # 3. Feature Ranking
        if not candidates:
            return "Unknown", [], rejected
            
        best_class = "Unknown"
        best_count = -1
        matched_features = []
        
        for name, fset in candidates.items():
            count = sum(1 for k, v in fset.__dict__.items() if v is True and k != "is_valid")
            if count > best_count:
                best_count = count
                best_class = name
                matched_features = [k for k, v in fset.__dict__.items() if v is True and k != "is_valid"]
                
        # Reject others
        for name in candidates:
            if name != best_class:
                rejected.append({"class": name, "reason": "Outvoted by feature count"})
                
        return best_class, matched_features, rejected
