const report = {
  evidenceType: "QR Code",
  rawAiResponse: {
    "qr_detected": true, 
    "qr_count": 1, 
    "qr_type": "UPI Payment", 
    "decoded_value": "upi://pay?pa=9831885855@ptyes&pn=ARBAB%20ALI%20SO%20AHMAR%20ALI", 
    "extracted_information": {
      "UPI ID": "9831885855@ptyes", 
      "Payee Name": "ARBAB ALI SO AHMAR ALI", 
      "Transaction Amount": null, 
      "Transaction Note": null, 
      "Currency": null
    }, 
    "confidence": 0.6, 
    "risk_analysis": {
      "risk_score": 30, 
      "risk_level": "Low", 
      "passed_checks": ["Valid UPI ID format", "Payee name present", "Normal UPI ID length"], 
      "warning_checks": [], 
      "failed_checks": ["Suspicious/random UPI ID patterns", "Unknown payment apps"], 
      "ai_summary": "AI service temporarily unavailable.", 
      "prevention_guidance": "Review manually due to analysis failure."
    }, 
    "status": "LOW_RISK", 
    "threat_level": "Low", 
    "summary": "AI service temporarily unavailable.", 
    "recommendation": "Review manually due to analysis failure.", 
    "url_intelligence": null, 
    "timeline": {
      "start": 1784455805.6967406, 
      "Preprocessing": 0.19, 
      "Parsing": 0.02, 
      "EntityExtraction": 0.22, 
      "RuleEngine": 28.32, 
      "ThreatIntelligence": 0.05, 
      "GeminiReasoning": 1033.95, 
      "ConfidenceCalculation": 0.08, 
      "FinalDecision": 0.03, 
      "total_ms": 1063.35
    }
  }
};

function sanitizeString(str) {
  if (!str) return "";
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

const qrDetails = report.rawAiResponse?.qr_details;
const riskAnalysis = qrDetails?.risk_analysis;

const decodedContent = sanitizeString(qrDetails?.decoded_value || "");
const isLongContent = decodedContent.length > 120;
const threatLevel = sanitizeString(riskAnalysis?.risk_level || "Unknown");
const riskScore = Math.min(Math.max(riskAnalysis?.risk_score || 0, 0), 100);

if (!qrDetails || !riskAnalysis) {
  console.log("Fallback returned safely!");
} else {
  console.log("Proceeding to render...");
}
