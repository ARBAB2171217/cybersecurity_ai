import os
import re
import time
from typing import Dict, Any, List
from fastapi import HTTPException, status, UploadFile
from PIL import Image
import logging

from app.ai.pipelines.ocr_pipeline import run_ocr

logger = logging.getLogger("app.services.screenshot_service")

# Supported extensions and mime types
SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
SUPPORTED_MIMES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def validate_screenshot_upload(file: UploadFile) -> None:
    """
    Validates uploaded screenshots for structure, formatting, size, and corruption.
    """
    # 1. Check empty upload
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded or filename is empty."
        )

    # 2. Check extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed types: PNG, JPG, JPEG, WEBP."
        )

    # 3. Check MIME type
    if file.content_type not in SUPPORTED_MIMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported MIME type '{file.content_type}'. Must be PNG, JPEG, or WEBP."
        )

    # 4. Validate file size
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)

    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes)."
        )

    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of 10MB."
        )

    # 5. Check PIL loading (corruption / dimension checks)
    try:
        img = Image.open(file.file)
        img.verify()
        file.file.seek(0)  # Reset pointer
    except Exception as e:
        file.file.seek(0)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to parse image. The file may be corrupted or invalid."
        )


def extract_image_metadata(file_path: str, original_filename: str) -> Dict[str, Any]:
    """
    Extracts image specifications: dimensions, aspect ratio, size, format.
    """
    try:
        with Image.open(file_path) as img:
            width, height = img.size
            file_format = img.format or os.path.splitext(file_path)[1].lstrip('.').upper()
            aspect_ratio = round(width / height, 2) if height > 0 else 0.0

        file_size = os.path.getsize(file_path)
        
        return {
            "filename": original_filename,
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "file_size": file_size,
            "format": file_format,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    except Exception as e:
        logger.error(f"Failed to extract metadata: {e}")
        return {
            "filename": original_filename,
            "width": 0,
            "height": 0,
            "aspect_ratio": 0.0,
            "file_size": 0,
            "format": "Unknown",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }


def classify_screenshot_text(text: str) -> Dict[str, Any]:
    """
    Classifies screenshot category based on OCR keywords and returns category + confidence.
    """
    text_lower = text.lower()
    
    categories = {
        "UPI Payment App": {
            "keywords": ["upi id", "pay to", "paytm", "phonepe", "gpay", "bhim", "upi profile", "scan upi", "payment settings"],
            "score": 0
        },
        "Payment Receipt": {
            "keywords": ["paid successfully", "transaction successful", "reference no", "txn id", "paid to", "payment receipt", "payment status", "successful transaction"],
            "score": 0
        },
        "Transaction History": {
            "keywords": ["transaction history", "statement", "passbook", "debited", "credited", "recent activity", "history log", "payments list"],
            "score": 0
        },
        "Banking App": {
            "keywords": ["balance", "account no", "savings account", "hdfc", "sbi", "icici", "deposit", "transfer money", "netbanking", "payee"],
            "score": 0
        },
        "WhatsApp Chat": {
            "keywords": ["whatsapp", "type a message", "message", "online", "chat details", "group info", "status updates"],
            "score": 0
        },
        "SMS": {
            "keywords": ["sms", "text message", "sent as text", "short code", "sender id", "verification code", "one time password"],
            "score": 0
        },
        "Email": {
            "keywords": ["from:", "to:", "subject:", "inbox", "gmail", "outlook", "sent from my", "compose email", "unsubscribed"],
            "score": 0
        },
        "Browser / Website": {
            "keywords": ["http://", "https://", "www.", ".com", ".org", "search web", "chrome", "safari", "webpage"],
            "score": 0
        },
        "Social Media": {
            "keywords": ["instagram", "facebook", "twitter", "linkedin", "tiktok", "follow", "likes", "comments", "retweet", "post status"],
            "score": 0
        },
        "Government Portal": {
            "keywords": ["govt", "india", "official portal", "income tax", "uidai", "aadhaar", "national portal", "government services"],
            "score": 0
        },
        "Investment / Trading App": {
            "keywords": ["stock", "trade", "invest", "crypto", "wallet balance", "portfolio", "profit", "loss", "order book"],
            "score": 0
        },
        "Shopping / E-commerce": {
            "keywords": ["cart", "buy now", "order total", "checkout", "amazon", "flipkart", "product details", "add to cart"],
            "score": 0
        },
        "Login Screen": {
            "keywords": ["login", "sign in", "username", "password", "forgot password", "create account", "authenticator"],
            "score": 0
        }
    }

    best_category = "Unknown"
    highest_score = 0

    for category, meta in categories.items():
        score = 0
        for kw in meta["keywords"]:
            if kw in text_lower:
                score += 1
        
        # Weighted bonuses to ensure better distinction
        if category == "Payment Receipt" and ("successful" in text_lower or "paid" in text_lower):
            score += 2
        if category == "WhatsApp Chat" and "type a message" in text_lower:
            score += 4
        if category == "Email" and ("from:" in text_lower or "subject:" in text_lower):
            score += 3
        if category == "Login Screen" and ("password" in text_lower and "login" in text_lower):
            score += 3

        if score > highest_score:
            highest_score = score
            best_category = category

    # Calculate confidence based on matched keyword ratio
    confidence = 0.5
    if highest_score > 0:
        confidence = min(0.5 + (highest_score * 0.1), 0.98)
    else:
        best_category = "Unknown"
        confidence = 0.3

    return {
        "category": best_category,
        "confidence": confidence
    }


def detect_presence_elements(text: str) -> Dict[str, bool]:
    """
    Checks for high-level evidence text patterns in OCR.
    """
    text_lower = text.lower()
    
    # 1. Email Regex
    has_email = bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text))
    
    # 2. URL Regex
    has_url = bool(re.search(r'https?://[^\s]+|www\.[^\s]+', text_lower))
    
    # 3. Phone Regex
    has_phone = bool(re.search(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', text))
    
    # 4. UPI ID Regex
    has_upi = bool(re.search(r'\b[a-zA-Z0-9.\-_]+@[a-zA-Z]{2,}\b', text))

    # 5. Payment details
    has_payment = any(kw in text_lower for kw in ["paid", "payment", "transaction", "amount", "successful", "debited", "credited", "₹", "rs"])

    # 6. Banking details
    has_banking = any(kw in text_lower for kw in ["bank", "account", "transfer", "savings", "current", "balance", "ifsc"])

    # 7. Conversations
    has_convo = any(kw in text_lower for kw in ["type a message", "online", "typing", "yesterday", "today", "read", "unread"])

    # 8. Transaction Details
    has_transaction = any(kw in text_lower for kw in ["transaction id", "txn id", "ref no", "reference number", "ref. no"])

    # 9. Login Credentials
    has_credentials = any(kw in text_lower for kw in ["password", "username", "login", "credentials", "otp", "pin", "passcode"])

    # 10. QR code indicator strings
    has_qr = any(kw in text_lower for kw in ["qr code", "scan qr", "bhim upi qr", "scan to pay"])

    # 11. Date and Time
    has_datetime = bool(re.search(r'\b\d{1,2}:\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b\d{4}\b', text_lower))

    return {
        "payment_info": has_payment,
        "banking_info": has_banking,
        "conversation": has_convo,
        "transaction_details": has_transaction,
        "login_credentials": has_credentials,
        "qr_code": has_qr,
        "url": has_url,
        "phone_number": has_phone,
        "email_address": has_email,
        "upi_id": has_upi,
        "date_time": has_datetime
    }
