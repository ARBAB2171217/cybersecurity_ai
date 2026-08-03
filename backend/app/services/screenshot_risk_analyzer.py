from typing import Dict, Any, List
import logging

logger = logging.getLogger("app.services.screenshot_risk_analyzer")

class ScreenshotRiskAnalyzer:
    @staticmethod
    def analyze(entities: Dict[str, Any], category: str) -> Dict[str, Any]:
        """
        Deterministically evaluates screenshot entities for security anomalies.
        Returns:
            - risk_score (0-100)
            - threat_level ("Safe" | "Low" | "Medium" | "High" | "Critical")
            - triggered_rules: list of Dict with name, status, severity, description
        """
        triggered_rules = []
        total_penalty = 0

        financials = entities.get("financials", {})
        contacts = entities.get("contacts", {})
        web = entities.get("web", {})
        payment = entities.get("payment", {})
        communication = entities.get("communication", {})
        indicators = entities.get("indicators", {})

        # Rule 1: OTP / Verification Code Harvesting (High Risk)
        if communication.get("otp_code") or indicators.get("otp"):
            penalty = 40
            total_penalty += penalty
            triggered_rules.append({
                "name": "OTP / Verification Code Detection",
                "status": "Fail",
                "severity": "High",
                "description": f"Extracted OTP/Verification code: '{communication.get('otp_code') or 'Yes'}'. OTP harvesting is a key indicator of credential hijacking or unauthorized transactions."
            })

        # Rule 2: Credential Exposure / Phishing Indicator (Medium Risk)
        if category == "Login Screen" or indicators.get("login_screen"):
            penalty = 20
            total_penalty += penalty
            triggered_rules.append({
                "name": "Login Interface Detected",
                "status": "Warning",
                "severity": "Medium",
                "description": "Screenshot displays a login or credential entry screen. Credential harvesting pages often mimic trusted sites to steal passwords."
            })

        # Rule 3: KYC Verification Scam Hook (High Risk)
        if indicators.get("kyc_request"):
            penalty = 30
            total_penalty += penalty
            triggered_rules.append({
                "name": "KYC Identity Verification Request",
                "status": "Fail",
                "severity": "High",
                "description": "Detected Aadhaar, PAN card, or identity verification requests. Phishing schemes often use fake KYC demands to harvest government documents."
            })

        # Rule 4: Suspicious Reward / Cashback / Lottery Hook (High Risk)
        if indicators.get("reward_message"):
            penalty = 35
            total_penalty += penalty
            triggered_rules.append({
                "name": "Cashback / Reward Scheme Hook",
                "status": "Fail",
                "severity": "High",
                "description": "Detected scratch card, lucky winner, or cashback references. Scammers use promise of financial gains to lead victims into paying processing fees or linking UPI."
            })

        # Rule 5: High-Yield Investment / Crypto Offers (High Risk)
        if indicators.get("investment_message"):
            penalty = 30
            total_penalty += penalty
            triggered_rules.append({
                "name": "High-Yield Investment / Crypto Promise",
                "status": "Fail",
                "severity": "High",
                "description": "Detected double returns, profit sharing, or investment reward offers. These are typical markers of Ponzi schemes and crypto deposit scams."
            })

        # Rule 6: Web / URL Links in screenshot (Medium Risk)
        urls = web.get("urls", [])
        if urls:
            # Check if any URL uses unencrypted protocol
            insecure_url = any(u.startswith("http://") for u in urls)
            penalty = 25 if insecure_url else 15
            total_penalty += penalty
            triggered_rules.append({
                "name": "Web Links / Domains Present",
                "status": "Fail" if insecure_url else "Warning",
                "severity": "High" if insecure_url else "Medium",
                "description": f"Detected {len(urls)} web links. Insecure links (http://) are vulnerable to interception. Verify domain authenticity before clicking."
            })

        # Rule 7: Transaction Reference / Receipt Anomaly (Medium Risk)
        if category == "Payment Receipt" or indicators.get("payment_receipt"):
            # Check for lack of transaction or reference ID
            has_txn = bool(financials.get("transaction_ids")) or bool(financials.get("reference_numbers"))
            if not has_txn:
                penalty = 20
                total_penalty += penalty
                triggered_rules.append({
                    "name": "Missing Transaction References",
                    "status": "Warning",
                    "severity": "Medium",
                    "description": "The screenshot claims to be a payment receipt but lacks standard transaction ID or reference number fields, which is common in fake receipt generators."
                })
            
            # Check for mismatch between receiver/merchant and UPI ID
            merchant = financials.get("merchant")
            upi_ids = financials.get("upi_ids", [])
            if merchant and upi_ids:
                merchant_clean = merchant.lower().replace(" ", "")
                upi_clean = upi_ids[0].split("@")[0].lower()
                # If merchant name is not related to upi prefix, flag it
                if merchant_clean not in upi_clean and upi_clean not in merchant_clean:
                    penalty = 15
                    total_penalty += penalty
                    triggered_rules.append({
                        "name": "Merchant UPI Name Mismatch",
                        "status": "Warning",
                        "severity": "Medium",
                        "description": f"Receiver name '{merchant}' does not align with UPI ID handle '{upi_ids[0]}'. Spoofed receipts often display custom titles but route funds to scammer UPI IDs."
                    })

        # Rule 8: Anomalous Financial Figures (Low Risk)
        amounts = financials.get("amounts", [])
        if amounts:
            large_amounts = [amt for amt in amounts if amt > 100000]
            if large_amounts:
                penalty = 15
                total_penalty += penalty
                triggered_rules.append({
                    "name": "High-Value Transaction Displayed",
                    "status": "Warning",
                    "severity": "Low",
                    "description": f"Screenshot displays large financial amount: ₹{max(large_amounts):,}. High-value screens are frequently fabricated to showcase fake investments or winnings."
                })

        # Rule 9: Urgency Language (High Risk)
        if indicators.get("urgency"):
            penalty = 25
            total_penalty += penalty
            triggered_rules.append({
                "name": "Urgency / Threat Language",
                "status": "Fail",
                "severity": "High",
                "description": "Detected high-pressure language (e.g. 'immediate action', 'blocked'). Scammers use artificial urgency to force victims into making quick, irrational decisions."
            })

        # Rule 10: Advance Payment Request (High Risk)
        if indicators.get("payment_request"):
            penalty = 30
            total_penalty += penalty
            triggered_rules.append({
                "name": "Advance Fee Request",
                "status": "Fail",
                "severity": "High",
                "description": "Detected requests for registration fee, processing fee, or security deposit. Advance-fee scams require upfront payment for a promised service/job that never materializes."
            })

        # Rule 11: Credential Theft (Critical Risk)
        if indicators.get("credential_request"):
            penalty = 40
            total_penalty += penalty
            triggered_rules.append({
                "name": "Credential Theft Request",
                "status": "Fail",
                "severity": "Critical",
                "description": "Detected requests for sensitive credentials (PIN, CVV, Aadhaar, PAN). Legitimate organizations never ask for these details via chat or SMS."
            })

        # Rule 12: Scam Language (High Risk)
        if indicators.get("scam_language"):
            penalty = 25
            total_penalty += penalty
            triggered_rules.append({
                "name": "Typical Scam Language",
                "status": "Warning",
                "severity": "High",
                "description": "Detected common scam phrasing ('guaranteed return', 'lucky winner'). These are highly correlated with employment and lottery fraud."
            })

        # Rule 13: Social Engineering / Impersonation (High Risk)
        if indicators.get("social_engineering"):
            penalty = 35
            total_penalty += penalty
            triggered_rules.append({
                "name": "Authority Impersonation",
                "status": "Fail",
                "severity": "High",
                "description": "Detected threats of legal action, arrest, or police impersonation. Scammers use fear and fake authority to coerce victims into compliance."
            })

        # Calculate final risk score (0-100)
        risk_score = min(max(total_penalty, 0), 100)

        # Map to threat level
        if risk_score <= 10:
            threat_level = "Safe"
        elif risk_score <= 35:
            threat_level = "Low"
        elif risk_score <= 65:
            threat_level = "Medium"
        elif risk_score <= 85:
            threat_level = "High"
        else:
            threat_level = "Critical"

        return {
            "risk_score": risk_score,
            "threat_level": threat_level,
            "triggered_rules": triggered_rules
        }
