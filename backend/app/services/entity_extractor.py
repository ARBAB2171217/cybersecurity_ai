import re
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger("app.services.entity_extractor")

KNOWN_BANKS = ["HDFC", "SBI", "ICICI", "Axis", "PNB", "BoB", "Yes Bank", "Canara", "Kotak", "Paytm Payments Bank"]
KNOWN_PLATFORMS = {
    "Google Pay": ["google pay", "gpay", "googlepay"],
    "PhonePe": ["phonepe", "phone pe"],
    "Paytm": ["paytm"],
    "BHIM": ["bhim", "upi"],
    "WhatsApp": ["whatsapp"],
    "Telegram": ["telegram"],
    "Gmail": ["gmail"],
    "Outlook": ["outlook", "hotmail"],
    "Amazon": ["amazon"],
    "Flipkart": ["flipkart"],
    "Instagram": ["instagram"],
    "Facebook": ["facebook"],
    "X (Twitter)": ["x.com", "twitter"],
}

def extract_financials(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    
    # 1. Currency Amounts
    amounts = []
    # Match symbols like ₹, Rs, Rs., INR followed by digit
    amt_matches = re.findall(r'(?:₹|rs\.?|inr)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)', text_lower)
    for amt in amt_matches:
        cleaned = amt.replace(",", "")
        try:
            amounts.append(float(cleaned))
        except ValueError:
            pass
            
    # Fallback to general numbers near transfer keywords
    if not amounts:
        transfer_near = re.findall(r'(?:paid|sent|amount|transfer|received|total)\s+(?:of\s+)?(\d{2,6}(?:\.\d{2})?)', text_lower)
        for amt in transfer_near:
            try:
                amounts.append(float(amt))
            except ValueError:
                pass

    # 2. UPI IDs
    upi_ids = list(set(re.findall(r'\b[a-zA-Z0-9.\-_]+@[a-zA-Z]{3,}\b', text)))

    # 3. Bank Names
    detected_banks = []
    for bank in KNOWN_BANKS:
        if bank.lower() in text_lower:
            detected_banks.append(bank)

    # 4. Account Numbers
    accounts = []
    # Match numbers like a/c no XXXXXX1234 or A/c 123456789012
    ac_matches = re.findall(r'(?:a/c|account|acct|ac)\s*(?:no\.?|number)?\s*([x*\d]{8,18})', text_lower)
    for match in ac_matches:
        accounts.append(match.upper())

    # 5. IFSC Codes
    ifsc_codes = list(set(re.findall(r'\b[A-Z]{4}0[A-Z0-9]{6}\b', text.upper())))

    # 6. Transaction / Ref / Order / Invoice IDs
    txn_ids = []
    ref_nos = []
    order_ids = []
    invoice_nos = []

    # Transaction ID patterns
    txn_matches = re.findall(r'(?:txn|transaction|trans|tx)\s*(?:id|no\.?|number)?\s*:\s*([a-z0-9\-]{8,24})', text_lower)
    for m in txn_matches:
        txn_ids.append(m.upper())

    # Reference Number patterns
    ref_matches = re.findall(r'(?:ref|reference|rrn|upi ref)\s*(?:no\.?|number|id)?\s*:\s*([0-9]{8,18})', text_lower)
    for m in ref_matches:
        ref_nos.append(m)

    # Order ID patterns
    order_matches = re.findall(r'(?:order)\s*(?:id|no\.?|number)?\s*:\s*([a-z0-9\-]{8,20})', text_lower)
    for m in order_matches:
        order_ids.append(m.upper())

    # Invoice Number patterns
    invoice_matches = re.findall(r'(?:invoice|bill)\s*(?:no\.?|number|id)?\s*:\s*([a-z0-9\-]{6,20})', text_lower)
    for m in invoice_matches:
        invoice_nos.append(m.upper())

    # 7. Merchant Names
    merchant = None
    # Look for paid to or to merchant
    merchant_match = re.search(r'(?:paid to|sent to|transfer to|to merchant|merchant)\s*(?:name)?\s*:\s*([a-z0-9\s]{3,24})', text_lower)
    if merchant_match:
        merchant = merchant_match.group(1).strip().title()
    elif len(upi_ids) > 0:
        # Fallback: estimate merchant from UPI prefix if it matches common names
        prefix = upi_ids[0].split("@")[0]
        if len(prefix) > 4 and not prefix.isdigit():
            merchant = prefix.replace(".", " ").replace("-", " ").title()

    return {
        "amounts": list(set(amounts)),
        "upi_ids": upi_ids,
        "merchant": merchant,
        "banks": list(set(detected_banks)),
        "account_numbers": list(set(accounts)),
        "ifsc_codes": ifsc_codes,
        "transaction_ids": list(set(txn_ids)),
        "reference_numbers": list(set(ref_nos)),
        "order_ids": list(set(order_ids)),
        "invoice_numbers": list(set(invoice_nos))
    }

def extract_contacts(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    
    # 1. Phone Numbers
    phone_numbers = list(set(re.findall(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', text)))

    # 2. Email Addresses
    emails = list(set(re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)))

    # 3. Usernames
    usernames = list(set(re.findall(r'\B@[a-zA-Z0-9_]{3,15}\b', text)))

    # 4. Display Names / Customer ID
    customer_ids = list(set(re.findall(r'(?:customer|client|user)\s*(?:id|no\.?|number)?\s*:\s*([a-z0-9\-]{6,16})', text_lower)))

    return {
        "phone_numbers": phone_numbers,
        "emails": emails,
        "usernames": usernames,
        "customer_ids": [cid.upper() for cid in customer_ids]
    }

def extract_web_info(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    
    # 1. URLs
    urls = list(set(re.findall(r'https?://[^\s]+|www\.[^\s]+', text_lower)))

    # 2. Domains
    domains = []
    for url in urls:
        clean_url = url.replace("https://", "").replace("http://", "").replace("www.", "")
        domain = clean_url.split("/")[0]
        domains.append(domain)
    domains = list(set(domains))

    # 3. IP Addresses
    ips = list(set(re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', text)))

    return {
        "urls": urls,
        "domains": domains,
        "ip_addresses": ips
    }

def extract_payment_details(text: str, financials: Dict[str, Any]) -> Dict[str, Any]:
    text_lower = text.lower()

    # 1. Status
    status = "Pending"
    if any(k in text_lower for k in ["successful", "success", "completed", "done", "paid", "received"]):
        status = "Success"
    elif any(k in text_lower for k in ["failed", "declined", "rejected", "timed out"]):
        status = "Failed"

    # 2. Method
    method = "Other"
    if "upi" in text_lower:
        method = "UPI"
    elif "card" in text_lower or "visa" in text_lower or "mastercard" in text_lower:
        method = "Card"
    elif "netbanking" in text_lower or "net banking" in text_lower:
        method = "NetBanking"
    elif "wallet" in text_lower:
        method = "Wallet"

    # 3. Date & Time
    date_match = re.search(r'\b\d{1,2}[-/\s](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})[-/\s]\d{2,4}\b', text_lower)
    time_match = re.search(r'\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b', text_lower)

    # 4. Sender / Receiver
    sender = None
    receiver = None

    sender_match = re.search(r'(?:from|sender|sent by)\s*(?:name)?\s*:\s*([a-z0-9\s]{3,20})', text_lower)
    if sender_match:
        sender = sender_match.group(1).strip().title()

    receiver_match = re.search(r'(?:to|receiver|paid to|beneficiary)\s*(?:name)?\s*:\s*([a-z0-9\s]{3,20})', text_lower)
    if receiver_match:
        receiver = receiver_match.group(1).strip().title()
    elif financials.get("merchant"):
        receiver = financials.get("merchant")

    return {
        "status": status,
        "method": method,
        "date": date_match.group(0) if date_match else None,
        "time": time_match.group(0) if time_match else None,
        "sender": sender,
        "receiver": receiver
    }

def extract_communication(text: str) -> Dict[str, Any]:
    text_lower = text.lower()

    # 1. OTP Code
    otp_code = None
    # Search for 4-6 digits near keywords
    otp_match = re.search(r'\b(otp|code|one time password|verification)\b.*?\b(\d{4,6})\b', text_lower)
    if otp_match:
        otp_code = otp_match.group(2)
    else:
        # Fallback raw 6 digit matching
        raw_six = re.findall(r'\b\d{6}\b', text)
        if raw_six:
            otp_code = raw_six[0]

    # 2. Email Subject & Headers
    subject = None
    subj_match = re.search(r'(?:subject|subj)\s*:\s*([^\n\r]+)', text_lower)
    if subj_match:
        subject = subj_match.group(1).strip()

    return {
        "otp_code": otp_code,
        "email_subject": subject
    }

def detect_platforms(text: str) -> List[Dict[str, Any]]:
    text_lower = text.lower()
    platforms = []
    
    for platform, keys in KNOWN_PLATFORMS.items():
        score = 0
        for key in keys:
            if key in text_lower:
                score += 2
        
        if score > 0:
            confidence = min(0.4 + (score * 0.15), 0.98)
            platforms.append({
                "name": platform,
                "confidence": confidence
            })
            
    # Sort by confidence
    platforms.sort(key=lambda x: x["confidence"], reverse=True)
    return platforms

def detect_fraud_indicators(text: str) -> Dict[str, bool]:
    text_lower = text.lower()
    return {
        "qr_code": any(k in text_lower for k in ["qr", "scan code", "bhim upi qr"]),
        "url": any(k in text_lower for k in ["http://", "https://", "www."]),
        "upi_id": "@" in text_lower and any(k in text_lower for k in ["upi", "pay", "ybl", "okhdfc"]),
        "otp": any(k in text_lower for k in ["otp", "one-time password", "verification code"]),
        "payment_receipt": any(k in text_lower for k in ["paid successfully", "txn status: success", "transaction successful"]),
        "transaction_success": "success" in text_lower or "successful" in text_lower,
        "login_screen": any(k in text_lower for k in ["username", "password", "sign in", "login"]),
        "kyc_request": any(k in text_lower for k in ["kyc", "verify identity", "pan card", "aadhaar verification", "kyc expired"]),
        "reward_message": any(k in text_lower for k in ["scratch card", "reward won", "cashback", "lucky winner", "congratulations"]),
        "investment_message": any(k in text_lower for k in ["investment", "double returns", "daily profit", "crypto bonus", "guaranteed return"]),
        "bank_notification": any(k in text_lower for k in ["debited by", "credited with", "account balance"]),
        "urgency": any(k in text_lower for k in ["immediate action", "verify now", "account blocked", "kyc expired", "last warning", "click here", "update now", "limited time", "urgent", "immediately"]),
        "payment_request": any(k in text_lower for k in ["registration fee", "security deposit", "processing fee", "advance payment", "booking amount", "pay fee to unlock"]),
        "credential_request": any(k in text_lower for k in ["otp request", "password", "pin", "cvv", "aadhaar number", "pan number", "card details"]),
        "scam_language": any(k in text_lower for k in ["congratulations", "lucky winner", "guaranteed return", "instant approval", "double money", "easy income", "work from home", "government approved"]),
        "social_engineering": any(k in text_lower for k in ["police", "arrest", "fir", "blocked", "suspended", "legal action", "cyber crime", "warrant"])
    }

def map_relationships(financials: Dict[str, Any], contacts: Dict[str, Any], web: Dict[str, Any], payment: Dict[str, Any]) -> List[Dict[str, Any]]:
    relationships = []

    # 1. Merchant <-> UPI ID
    if financials.get("merchant") and financials.get("upi_ids"):
        relationships.append({
            "source": financials["merchant"],
            "target": financials["upi_ids"][0],
            "type": "Merchant UPI ID Match"
        })

    # 2. Amount <-> Transaction ID
    if financials.get("amounts") and financials.get("transaction_ids"):
        relationships.append({
            "source": f"₹{financials['amounts'][0]}",
            "target": financials["transaction_ids"][0],
            "type": "Transaction Amount Link"
        })

    # 3. URL <-> Domain
    if web.get("urls") and web.get("domains"):
        relationships.append({
            "source": web["urls"][0],
            "target": web["domains"][0],
            "type": "URL Domain Map"
        })

    # 4. Bank <-> Account Number
    if financials.get("banks") and financials.get("account_numbers"):
        relationships.append({
            "source": financials["banks"][0],
            "target": financials["account_numbers"][0],
            "type": "Bank Account Association"
        })

    # 5. Sender <-> Receiver
    if payment.get("sender") and payment.get("receiver"):
        relationships.append({
            "source": payment["sender"],
            "target": payment["receiver"],
            "type": "Funds Route"
        })

    return relationships

def extract_all_entities(text: str) -> Dict[str, Any]:
    """
    Orchestrates the complete entity extraction pipeline.
    """
    financials = extract_financials(text)
    contacts = extract_contacts(text)
    web = extract_web_info(text)
    payment = extract_payment_details(text, financials)
    communication = extract_communication(text)
    platforms = detect_platforms(text)
    indicators = detect_fraud_indicators(text)
    relationships = map_relationships(financials, contacts, web, payment)

    return {
        "financials": financials,
        "contacts": contacts,
        "web": web,
        "payment": payment,
        "communication": communication,
        "platforms": platforms,
        "indicators": indicators,
        "relationships": relationships
    }
