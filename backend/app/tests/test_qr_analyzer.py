import pytest
from app.services.qr_risk_analyzer import QRRiskAnalyzerService

def test_upi_risk_analysis_safe():
    result = QRRiskAnalyzerService.analyze(
        qr_type="UPI Payment",
        decoded_value="upi://pay?pa=merchant@okaxis&pn=Merchant%20Name&am=100",
        extracted_info={"UPI ID": "merchant@okaxis", "Payee Name": "Merchant Name", "Transaction Amount": "100"},
        validation_status="Valid",
        validation_errors=[]
    )
    assert result["risk_level"] in ["Safe", "Low"]
    assert result["risk_score"] <= 30
    assert result["fraud_scenario"] is None
    assert len(result["prevention_tips"]) > 0
    assert "Safe" in result["final_recommendation"]

def test_upi_risk_analysis_suspicious():
    result = QRRiskAnalyzerService.analyze(
        qr_type="UPI Payment",
        decoded_value="upi://pay?pa=attacker@unknownhandle&pn=Scammer&am=50000",
        extracted_info={"UPI ID": "attacker@unknownhandle", "Payee Name": "Scammer", "Transaction Amount": "50000"},
        validation_status="INVALID",
        validation_errors=["Unknown/unsupported payment provider handle"]
    )
    # INVALID status adds 30, unknown payment app adds 15, payee_name present, etc. Total score >= 45 (Medium)
    assert result["risk_level"] in ["High", "Critical", "Medium"]
    assert result["risk_score"] >= 45
    assert len(result["prevention_tips"]) > 0

def test_website_url_risk_analysis_phishing():
    result = QRRiskAnalyzerService.analyze(
        qr_type="Website URL",
        decoded_value="http://secure-bank-login-update.freehost.com/login",
        extracted_info={
            "Complete URL": "http://secure-bank-login-update.freehost.com/login",
            "Protocol": "HTTP",
            "Domain": "secure-bank-login-update.freehost.com",
            "Top Level Domain": "com"
        },
        validation_status="INVALID",
        validation_errors=["Insecure HTTP protocol"]
    )
    # INVALID adds 30, HTTP adds 20, suspicious keywords adds 30. Total score >= 80 (High/Critical)
    assert result["risk_level"] in ["High", "Critical"]
    assert result["risk_score"] >= 70
    assert "phishing" in result["fraud_scenario"].lower()
    assert "DO NOT VISIT" in result["final_recommendation"]

def test_wifi_risk_analysis_unsafe():
    result = QRRiskAnalyzerService.analyze(
        qr_type="WiFi",
        decoded_value="WIFI:S:MyPublicWiFi;T:nopass;;",
        extracted_info={"SSID": "MyPublicWiFi", "Encryption Type": "nopass", "Hidden Network": False},
        validation_status="INVALID",
        validation_errors=["Unencrypted network (No password)"]
    )
    # INVALID adds 30, open network adds 30. Total score = 60 (Medium/High)
    assert result["risk_level"] in ["High", "Critical", "Medium"]
    assert result["risk_score"] >= 60
    assert "Man-in-the-Middle" in result["fraud_scenario"]
