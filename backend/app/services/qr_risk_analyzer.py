import re
from typing import Dict, Any, List

class QRRiskAnalyzerService:
    @staticmethod
    def analyze(qr_type: str, decoded_value: str, extracted_info: Dict[str, Any], validation_status: str, validation_errors: List[str]) -> Dict[str, Any]:
        risk_score = 0
        detected_risks = []
        passed_checks = []
        failed_checks = []
        
        # Initial checks based on validation
        if validation_status == "INVALID":
            detected_risks.append("Failed initial validation checks")
            failed_checks.extend(validation_errors)
            risk_score += 30

        if qr_type == "UPI Payment":
            upi_id = extracted_info.get("UPI ID") or ""
            payee_name = extracted_info.get("Payee Name") or ""
            amount = extracted_info.get("Transaction Amount")
            currency = extracted_info.get("Currency")
            
            # Check 1: Invalid UPI ID format
            if not upi_id or not re.match(r"^[\w.-]+@[\w.-]+$", upi_id):
                failed_checks.append("Invalid UPI ID format")
                risk_score += 20
            else:
                passed_checks.append("Valid UPI ID format")
                
            # Check 2: Missing payee name
            if not payee_name:
                failed_checks.append("Missing payee name")
                risk_score += 10
            else:
                passed_checks.append("Payee name present")
                
            # Check 3: Missing merchant details
            if not payee_name:
                failed_checks.append("Missing merchant details")
            
            # Check 4: Suspicious/random UPI ID patterns
            if upi_id and (len(re.findall(r"\d", upi_id)) > 8 or "random" in upi_id.lower()):
                failed_checks.append("Suspicious/random UPI ID patterns")
                risk_score += 15
            elif upi_id:
                passed_checks.append("Normal UPI ID pattern")
                
            # Check 5: Extremely long UPI IDs
            if upi_id and len(upi_id) > 50:
                failed_checks.append("Extremely long UPI IDs")
                risk_score += 10
            elif upi_id:
                passed_checks.append("Normal UPI ID length")
                
            # Check 6: Unknown payment apps
            known_apps = ['okicici', 'okaxis', 'okhdfcbank', 'oksbi', 'paytm', 'ybl', 'ibl', 'axl', 'upi']
            app_domain = upi_id.split('@')[-1].lower() if '@' in upi_id else ""
            if app_domain and app_domain not in known_apps:
                failed_checks.append("Unknown payment apps")
                risk_score += 15
            elif app_domain:
                passed_checks.append("Known payment app domain")
                
            # Check 7: Invalid amount field
            if amount is not None:
                try:
                    float(amount)
                    passed_checks.append("Valid amount field")
                except:
                    failed_checks.append("Invalid amount field")
                    risk_score += 10
                    
            # Check 8: Invalid currency field
            if currency and currency.upper() != "INR":
                failed_checks.append("Invalid currency field")
                risk_score += 10
            elif currency:
                passed_checks.append("Valid currency field")

        elif qr_type == "Website URL":
            url = extracted_info.get("Complete URL", "")
            protocol = extracted_info.get("Protocol", "")
            domain = extracted_info.get("Domain", "")
            tld = extracted_info.get("Top Level Domain", "")
            query_params = extracted_info.get("Query Parameters", {})
            
            # 1. HTTP instead of HTTPS
            if protocol == "HTTP":
                failed_checks.append("HTTP instead of HTTPS")
                risk_score += 20
            elif protocol == "HTTPS":
                passed_checks.append("Uses secure HTTPS")
                
            # 2. IP Address instead of domain
            if re.match(r"^(\d{1,3}\.){3}\d{1,3}$", domain):
                failed_checks.append("IP Address instead of domain")
                risk_score += 30
            elif domain:
                passed_checks.append("Uses valid domain name")
                
            # 3. Suspicious TLD
            suspicious_tlds = ["xyz", "top", "buzz", "cn", "ru", "info", "online", "club", "site"]
            if tld and tld.lower() in suspicious_tlds:
                failed_checks.append("Suspicious TLD")
                risk_score += 15
            elif tld:
                passed_checks.append("Standard TLD")
                
            # 4. Very long URL
            if len(url) > 100:
                failed_checks.append("Very long URL")
                risk_score += 10
            elif url:
                passed_checks.append("Normal URL length")
                
            # 5. Too many query parameters
            if len(query_params) >= 3:
                failed_checks.append("Too many query parameters")
                risk_score += 10
            else:
                passed_checks.append("Normal query parameters count")
                
            # 6. Encoded URL
            if "%20" in url or "%3A" in url or "%2F" in url:
                failed_checks.append("Encoded URL")
                risk_score += 5
                
            # 7. Multiple redirects in URL
            if "http://" in url[7:] or "https://" in url[8:] or "url=" in url.lower() or "redirect=" in url.lower():
                failed_checks.append("Multiple redirects in URL")
                risk_score += 25
                
            # 8. Shortened URL
            shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly", "ow.ly"]
            if domain and domain.lower() in shorteners:
                failed_checks.append("Shortened URL (bit.ly, tinyurl, etc.)")
                risk_score += 20
            elif domain:
                passed_checks.append("Not a shortened URL")
                
            # 9. Suspicious keywords
            keywords = ["login", "verify", "kyc", "bank", "reward", "gift", "update", "payment", "otp"]
            found_keywords = [kw for kw in keywords if kw in url.lower()]
            if found_keywords:
                failed_checks.append(f"Suspicious keywords: {', '.join(found_keywords)}")
                risk_score += 30
            else:
                passed_checks.append("No suspicious keywords found")
                
        elif qr_type == "Email":
            email = extracted_info.get("Email Address", "")
            subject = extracted_info.get("Subject", "") or ""
            body = extracted_info.get("Body", "") or ""
            
            # 1. Invalid email format
            if not email or not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
                failed_checks.append("Invalid email format")
                risk_score += 20
            else:
                passed_checks.append("Valid email format")
                
            # 2. Disposable email domains
            disposable = ["mailinator.com", "10minutemail.com", "temp-mail.org", "guerrillamail.com"]
            domain = email.split('@')[-1].lower() if '@' in email else ""
            if domain in disposable:
                failed_checks.append("Disposable email domains")
                risk_score += 30
            elif domain:
                passed_checks.append("Non-disposable email domain")
                
            # 3. Suspicious keywords
            keywords = ["login", "verify", "kyc", "bank", "reward", "gift", "update", "payment", "otp"]
            combined_text = (subject + " " + body).lower()
            found_keywords = [kw for kw in keywords if kw in combined_text]
            if found_keywords:
                failed_checks.append(f"Suspicious keywords: {', '.join(found_keywords)}")
                risk_score += 20
            else:
                passed_checks.append("No suspicious keywords")
                
        elif qr_type == "SMS":
            phone = extracted_info.get("Phone Number", "")
            body = extracted_info.get("Message Content", "") or ""
            
            # 1. Premium numbers
            if phone and len(phone) <= 5:
                failed_checks.append("Premium numbers")
                risk_score += 20
            else:
                passed_checks.append("Standard phone number length")
                
            # 2. Suspicious keywords
            keywords = ["login", "verify", "kyc", "bank", "reward", "gift", "update"]
            found_keywords = [kw for kw in keywords if kw in body.lower()]
            if found_keywords:
                failed_checks.append(f"Suspicious keywords: {', '.join(found_keywords)}")
                risk_score += 20
            else:
                passed_checks.append("No suspicious keywords")
                
            # 3. OTP requests
            if "otp" in body.lower():
                failed_checks.append("OTP requests")
                risk_score += 25
            else:
                passed_checks.append("No OTP requests")
                
            # 4. Payment requests
            if "payment" in body.lower() or "pay" in body.lower():
                failed_checks.append("Payment requests")
                risk_score += 20
            else:
                passed_checks.append("No explicit payment requests")
                
        elif qr_type == "Phone Number":
            phone = extracted_info.get("Phone Number", "")
            country_code = extracted_info.get("Country Code", "")
            
            # 1. Invalid number format
            if not phone or not re.match(r"^\d+$", phone):
                failed_checks.append("Invalid number format")
                risk_score += 20
            else:
                passed_checks.append("Valid number format")
                
            # 2. International premium numbers
            if country_code and country_code not in ["+91", "+1"]:
                failed_checks.append("International premium numbers")
                risk_score += 15
            elif country_code:
                passed_checks.append("Standard country code")
                
        elif qr_type == "WiFi":
            encryption = extracted_info.get("Encryption Type", "")
            hidden = extracted_info.get("Hidden Network", False)
            
            # 1. Open network
            if not encryption or encryption.upper() == "NOPASS":
                failed_checks.append("Open network")
                risk_score += 30
            else:
                passed_checks.append("Secured network")
                
            # 2. Weak encryption
            if encryption and encryption.upper() == "WEP":
                failed_checks.append("Weak encryption")
                risk_score += 20
            elif encryption:
                passed_checks.append("Strong encryption")
                
            # 3. Hidden SSID
            if hidden:
                failed_checks.append("Hidden SSID")
                risk_score += 10
            else:
                passed_checks.append("Visible SSID")
                
        elif qr_type == "WhatsApp":
            is_group = extracted_info.get("Is Group Invite", False)
            phone = extracted_info.get("Phone Number", "")
            
            # 1. Public Group Risk
            if is_group:
                failed_checks.append("Public Group Invite")
                risk_score += 25
            else:
                passed_checks.append("Direct Message")
                
            # 2. International premium numbers
            if phone and not phone.startswith(("91", "+91", "1", "+1")):
                failed_checks.append("International number")
                risk_score += 15
                
        elif qr_type == "Cryptocurrency Address":
            address = extracted_info.get("Wallet Address", "")
            
            # Cryptocurrency transactions are irreversible. Inherently risky for QR scans.
            failed_checks.append("Irreversible transaction vector")
            risk_score += 30
            
            if not address:
                failed_checks.append("Malformed crypto address")
                risk_score += 20
                
        elif qr_type == "Contact Card":
            website = extracted_info.get("Website", "")
            
            if website and ("http://" in website.lower() or ".xyz" in website.lower()):
                failed_checks.append("Suspicious website in vCard")
                risk_score += 20
            else:
                passed_checks.append("No suspicious websites in contact")
                
        elif qr_type == "Unknown" or qr_type == "Plain Text":
            # 1. Unrecognized payload format
            failed_checks.append("Unrecognized payload format")
            risk_score += 30
            
            # 2. Hidden terminal execution commands
            dangerous_cmds = ["curl ", "wget ", "bash ", "sh ", "powershell", "cmd.exe", "eval("]
            if any(cmd in decoded_value.lower() for cmd in dangerous_cmds):
                failed_checks.append("Terminal execution payload detected")
                risk_score += 50
        
        detected_risks = list(set(detected_risks + failed_checks))
        
        # Cap risk score
        risk_score = min(max(risk_score, 0), 100)
        
        # Determine risk level
        if risk_score <= 10:
            risk_level = "Safe"
        elif risk_score <= 30:
            risk_level = "Low"
        elif risk_score <= 50:
            risk_level = "Medium"
        elif risk_score <= 75:
            risk_level = "High"
        else:
            risk_level = "Critical"
            
        analysis_summary = f"The QR Code poses a {risk_level} risk. "
        if detected_risks:
            analysis_summary += f"Detected issues: {', '.join(detected_risks)}."
        else:
            analysis_summary += "No significant issues detected."

        # Generate Scam Scenarios, Prevention Tips and Recommendations based on type & score
        fraud_scenario = None
        prevention_tips = []
        final_recommendation = "Safe to use."

        is_unsafe = risk_score > 30

        if qr_type == "UPI Payment":
            if is_unsafe:
                fraud_scenario = "Scammers can construct malicious QR codes with altered payee names or fake UPI handles to redirect funds to their accounts under the guise of verified merchants."
                prevention_tips = [
                    "Always confirm the recipient name matches the merchant before entering your UPI PIN.",
                    "Avoid scanning UPI QR codes sent over chat apps for receiving cash back or rewards.",
                    "Ensure you are using a trusted, verified UPI application."
                ]
                final_recommendation = "DO NOT TRANSFER. The UPI details appear highly suspicious or spoofed."
            else:
                prevention_tips = ["Always confirm payee name on your payment app screen before entering UPI PIN."]
                final_recommendation = "Safe to proceed, but always double-check the recipient name at the final screen."
        elif qr_type == "Website URL":
            if is_unsafe:
                fraud_scenario = "Attackers use lookalike domains (typosquatting), HTTP protocols, or shortened URLs to mask phishing sites, tricking users into revealing sensitive credentials or bank details."
                prevention_tips = [
                    "Do not enter passwords or OTPs on pages opened via untrusted QR scans.",
                    "Check the URL spelling in the browser address bar for subtle deviations.",
                    "Ensure the connection is secured via HTTPS before typing any info."
                ]
                final_recommendation = "DO NOT VISIT. This link matches phishing patterns or uses an unencrypted protocol."
            else:
                prevention_tips = ["Ensure the page matches the expected merchant website and has an active HTTPS lock icon."]
                final_recommendation = "Proceed with caution. The URL matches standard security checks."
        elif qr_type == "Email":
            if is_unsafe:
                fraud_scenario = "QR codes initiating pre-filled email drafts can be used to trick users into sending authorization codes or verifying fraudulent transactions to spoofed addresses."
                prevention_tips = [
                    "Verify the recipient's email address is authentic and belongs to the official organization.",
                    "Do not send sensitive personal data, passwords, or transaction IDs via pre-formatted emails."
                ]
                final_recommendation = "DO NOT SEND. The destination email belongs to a disposable domain or is unverified."
            else:
                prevention_tips = ["Review the recipient domain before sending."]
                final_recommendation = "Standard email format. Review the recipient domain before sending."
        elif qr_type == "SMS":
            if is_unsafe:
                fraud_scenario = "Malicious QR codes can pre-populate an SMS to premium numbers or execute command triggers (e.g. SIM swap verification) without the user's explicit consent."
                prevention_tips = [
                    "Be cautious if the QR code prompts you to send an SMS containing verification codes or 'Yes/No' confirmations.",
                    "Check the recipient number carefully to ensure it's not a premium or international rate line."
                ]
                final_recommendation = "DO NOT SEND. The SMS targets premium lines or asks for OTP verification keywords."
            else:
                prevention_tips = ["Review recipient and message before sending."]
                final_recommendation = "Standard SMS setup. Review recipient and message before sending."
        elif qr_type == "Phone Number":
            if is_unsafe:
                fraud_scenario = "Scanning can initiate phone calls to premium rate lines, scams, or malicious actors masquerading as support agents."
                prevention_tips = [
                    "Confirm the phone number is official before initiating a call.",
                    "Be wary of international country codes or numbers requesting immediate callbacks."
                ]
                final_recommendation = "DO NOT CALL. The phone number belongs to an international premium-rate prefix."
            else:
                prevention_tips = ["Safe to call standard numbers."]
                final_recommendation = "Standard phone number. Safe to call."
        elif qr_type == "WiFi":
            if is_unsafe:
                fraud_scenario = "Rogue or open WiFi networks can be set up to perform Man-in-the-Middle (MitM) attacks, capturing all unencrypted traffic from connected devices."
                prevention_tips = [
                    "Avoid using open (unencrypted) WiFi networks for online banking or sensitive logins.",
                    "Use a Virtual Private Network (VPN) if you must connect to public networks."
                ]
                final_recommendation = "DO NOT CONNECT. This Wi-Fi network does not use password security or utilizes weak encryption."
            else:
                prevention_tips = ["Verify the SSID belongs to the establishment before connecting."]
                final_recommendation = "Secure WPA/WPA2 Wi-Fi configuration."
        elif qr_type == "WhatsApp":
            if is_unsafe:
                fraud_scenario = "Public WhatsApp group invites can lead to social engineering, spam, and exposure of your phone number to malicious actors."
                prevention_tips = ["Do not join unknown groups.", "Verify the group's legitimacy before interacting."]
                final_recommendation = "DO NOT JOIN. The invite may expose your contact info to scammers."
            else:
                prevention_tips = ["Verify the recipient before sending messages."]
                final_recommendation = "Standard WhatsApp interaction. Proceed safely."
        elif qr_type == "Cryptocurrency Address":
            if is_unsafe:
                fraud_scenario = "Crypto transactions are irreversible. Scammers use QR codes to replace recipient addresses."
                prevention_tips = ["Always manually verify the first and last 4 characters of the wallet address.", "Do not trust QR codes for large transfers."]
                final_recommendation = "HIGH RISK. Cryptocurrency payments cannot be reversed. Verify address carefully."
            else:
                prevention_tips = ["Verify address before sending."]
                final_recommendation = "Standard Crypto Address."
        else:
            if is_unsafe:
                fraud_scenario = "QR codes containing unformatted text can hide exploit payloads, malicious terminal commands, or redirect strings."
                prevention_tips = ["Do not copy-paste or execute scripts found inside untrusted QR scans."]
                final_recommendation = "DO NOT EXECUTE or copy the payload. Content structure is unrecognized or dangerous."
            else:
                prevention_tips = ["Be cautious with unknown text."]
                final_recommendation = "Standard text detected."

        return {
            "qr_type": qr_type,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "detected_risks": detected_risks,
            "passed_checks": passed_checks,
            "failed_checks": failed_checks,
            "analysis_summary": analysis_summary,
            "fraud_scenario": fraud_scenario,
            "prevention_tips": prevention_tips,
            "final_recommendation": final_recommendation
        }
