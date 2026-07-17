import re
from typing import Dict, Any

class QRTypeClassifier:
    """
    Classifies the content of a decoded QR code using pattern matching and validation rules.
    """

    @staticmethod
    def classify(decoded_value: str) -> Dict[str, Any]:
        if not decoded_value or not decoded_value.strip():
            return {
                "qr_type": "Unknown",
                "decoded_value": decoded_value,
                "confidence": 0.0,
                "classification_reason": "Empty or unreadable QR content."
            }

        val = decoded_value.strip()
        val_lower = val.lower()

        # 1. UPI Payment
        if val_lower.startswith("upi://pay"):
            return {
                "qr_type": "UPI Payment",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches standard UPI payment URI scheme (upi://pay)."
            }

        # 1.5 WhatsApp
        if "wa.me/" in val_lower or "whatsapp://send" in val_lower or "api.whatsapp.com" in val_lower:
            return {
                "qr_type": "WhatsApp",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches WhatsApp direct message URI."
            }
            
        # 1.6 Application Download
        if "play.google.com/store/apps" in val_lower or "apps.apple.com" in val_lower:
            return {
                "qr_type": "Application Download",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches App Store or Google Play URL."
            }
            
        # 1.7 Social Media
        social = ["instagram.com", "facebook.com", "twitter.com", "x.com", "linkedin.com", "t.me"]
        if any(s in val_lower for s in social):
            return {
                "qr_type": "Social Media",
                "decoded_value": val,
                "confidence": 0.95,
                "classification_reason": "Matches a known social media domain."
            }

        # 2. Website URL
        if val_lower.startswith("http://") or val_lower.startswith("https://"):
            return {
                "qr_type": "Website URL",
                "decoded_value": val,
                "confidence": 0.95,
                "classification_reason": "Matches HTTP/HTTPS URL scheme."
            }

        # 3. Email
        if val_lower.startswith("mailto:"):
            return {
                "qr_type": "Email",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches standard mailto URI scheme."
            }

        # 4. Phone Number
        if val_lower.startswith("tel:"):
            return {
                "qr_type": "Phone Number",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches standard telephone URI scheme."
            }

        # 5. SMS
        if val_lower.startswith("sms:") or val_lower.startswith("smsto:"):
            return {
                "qr_type": "SMS",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches standard SMS URI scheme."
            }

        # 6. WiFi
        if val_lower.startswith("wifi:"):
            return {
                "qr_type": "WiFi",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches standard WiFi configuration format."
            }

        # 7. Contact Card (vCard or MeCard)
        if val_lower.startswith("begin:vcard") or val_lower.startswith("mecard:"):
            return {
                "qr_type": "Contact Card",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches standard vCard or MeCard format."
            }

        # 8. Location (Geo)
        if val_lower.startswith("geo:"):
            return {
                "qr_type": "Location",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches standard geolocation URI scheme."
            }

        # 9. Cryptocurrency Address
        crypto_schemes = ["bitcoin:", "ethereum:", "litecoin:", "dogecoin:", "bitcoincash:", "monero:"]
        if any(val_lower.startswith(scheme) for scheme in crypto_schemes):
            return {
                "qr_type": "Cryptocurrency Address",
                "decoded_value": val,
                "confidence": 1.0,
                "classification_reason": "Matches a known cryptocurrency URI scheme."
            }
            
        # Optional: Regex for plain crypto addresses without schemes (basic heuristics)
        if re.match(r"^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$", val):
            return {
                "qr_type": "Cryptocurrency Address",
                "decoded_value": val,
                "confidence": 0.8,
                "classification_reason": "Matches pattern of a Bitcoin address."
            }
        if re.match(r"^0x[a-fA-F0-9]{40}$", val):
            return {
                "qr_type": "Cryptocurrency Address",
                "decoded_value": val,
                "confidence": 0.8,
                "classification_reason": "Matches pattern of an Ethereum address."
            }

        # 10. Plain Text (Catch-all for anything that is ASCII/printable text but not recognized)
        # If it contains spaces or standard punctuation and doesn't match above, it's likely plain text.
        if val.isprintable():
            return {
                "qr_type": "Plain Text",
                "decoded_value": val,
                "confidence": 0.5,
                "classification_reason": "Unrecognized format, but contains printable text."
            }

        # 11. Unknown
        return {
            "qr_type": "Unknown",
            "decoded_value": val,
            "confidence": 0.0,
            "classification_reason": "Unrecognized format and contains non-printable characters."
        }
