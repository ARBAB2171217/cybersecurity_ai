import os
import json
import logging
from typing import Optional
from PIL import Image
from app.config.settings import settings
from app.ai.prompts.counterfeit_prompt import get_counterfeit_analysis_prompt

logger = logging.getLogger("app.ai.pipelines.gemini_pipeline")

_PLACEHOLDER_RESPONSE = {
    "status": "SUSPICIOUS",
    "confidence": 0.5,
    "risk_score": 50.0,
    "ocr_data": {
        "serial_number": None,
        "denomination": None,
        "year_of_printing": None,
    },
    "reasons": [
        "GEMINI_API_KEY is not set — running in mock mode. "
        "Set a valid API key in backend/.env to enable real AI analysis."
    ],
    "summary": "Mock analysis: API key not configured.",
    "recommendation": "Configure GEMINI_API_KEY in backend/.env and restart the server.",
}


def _is_api_key_configured() -> bool:
    key = settings.GEMINI_API_KEY or ""
    return bool(key.strip()) and "placeholder" not in key.lower() and "your-gemini" not in key.lower()


def run_gemini_vision(context: dict, image_path: Optional[str] = None) -> str:
    from app.services.gemini_client import GeminiClient

    prompt = f"""
You are an expert AI Cybersecurity Analyst specializing in currency counterfeit detection.
Your task is to analyze the deterministic Rule Engine output and provide an explanation and recommendations.
DO NOT DETERMINE AUTHENTICITY. The Rule Engine has already made the deterministic decision.

Context provided by the Rule Engine:
- Detected Denomination: {context.get('detected_denomination')}
- Detected Currency: {context.get('detected_currency')}
- Image Quality Score: {context.get('quality_score')}
- OCR Extracted Serials: {', '.join(context.get('ocr_serials', []))}
- OCR Extracted Denominations: {', '.join(map(str, context.get('ocr_denoms', [])))}
- Detected Security Features: {', '.join([f['feature'] for f in context.get('detected_features', [])])}
- Missing Security Features: {', '.join([f['feature'] for f in context.get('missing_features', [])])}
- Rule Engine Score: {context.get('rule_score')}
- Counterfeit Risk: {context.get('counterfeit_risk')}
- Rules Triggered: {', '.join(context.get('rules_triggered', []))}

Return exactly a JSON object matching this schema, without markdown formatting or code blocks:
{{
    "summary": string (concise summary of findings based ONLY on the context),
    "explanation": string (detailed reasoning explaining why the rule engine triggered certain flags),
    "recommendation": string (final recommendation, e.g., "Do not accept", "Perform manual check")
}}
"""
    
    fallback = {
        "summary": "AI service temporarily unavailable. Rely on rule engine.",
        "explanation": "Could not connect to Gemini. Rule engine successfully completed deterministic assessment.",
        "recommendation": "Follow the deterministic risk assessment provided by the system."
    }

    contents = [prompt]
    if image_path:
        try:
            pil_img = Image.open(image_path).convert("RGB")
            contents.append(pil_img)
        except Exception as e:
            logger.warning(f"Failed to load image for Gemini Vision: {e}")

    return GeminiClient.generate_content(
        contents=contents,
        generation_config={
            "temperature": 0.2,
            "response_mime_type": "application/json",
        },
        fallback_dict=fallback
    )


def run_gemini_qr_analysis(context: dict, image_path: Optional[str] = None) -> str:
    from app.services.gemini_client import GeminiClient

    prompt = f"""
You are an expert AI Cybersecurity Analyst specializing in QR code fraud detection.
Your task is to analyze the following QR code information and determine if it represents a threat.

Context provided by the Rule-Based Engine:
- QR Type: {context.get('qr_type')}
- Decoded Value: {context.get('decoded_value')}
- Extracted Information: {json.dumps(context.get('extracted_information', {}))}
- Rule Engine Risk Score: {context.get('risk_score')} / 100
- Passed Checks: {', '.join(context.get('passed_checks', []))}
- Failed Checks (Detected Issues): {', '.join(context.get('failed_checks', []))}

Analyze for:
- Possible scam patterns
- Phishing indicators
- Social engineering attempts
- Fake payment requests
- Suspicious wording
- Impersonation attempts
- Merchant credibility (if inferable)
- Overall fraud likelihood

Return exactly a JSON object matching this schema, without markdown formatting or code blocks:
{{
    "ai_risk_score": integer (0-100),
    "ai_confidence": float (0.0-1.0),
    "threat_level": string ("Very Low", "Low", "Medium", "High", "Critical"),
    "ai_summary": string (concise summary of findings),
    "detected_threats": [string] (list of specific threats identified),
    "explanation": string (detailed reasoning),
    "prevention_tips": [string] (actionable advice for the user),
    "recommendation": string (final recommendation, e.g., "Do not scan", "Safe to proceed")
}}
"""
    contents = [prompt]
    if image_path:
        try:
            pil_img = Image.open(image_path).convert("RGB")
            contents.append(pil_img)
        except Exception as e:
            logger.warning(f"Could not load image for QR AI analysis: {e}")

    fallback = {
        "ai_risk_score": context.get("risk_score", 50),
        "ai_confidence": 0.0,
        "threat_level": context.get("risk_level", "Unknown"),
        "ai_summary": "AI service temporarily unavailable.",
        "detected_threats": [],
        "explanation": "AI service temporarily unavailable.",
        "prevention_tips": [],
        "recommendation": "Rely on rule-based analysis."
    }

    return GeminiClient.generate_content(
        contents=contents,
        generation_config={
            "temperature": 0.2,
            "response_mime_type": "application/json",
        },
        fallback_dict=fallback
    )


def run_gemini_url_analysis(context: dict) -> str:
    from app.services.gemini_client import GeminiClient

    prompt = f"""
You are an expert AI Cybersecurity Analyst specializing in URL-based threat assessment and phishing identification.
Your task is to analyze the structured URL metadata, redirect trace chain, and rule engine flags below, and produce a deterministic, explainable security analysis.

Context Data:
- Original URL: {context.get('originalUrl')}
- Final Resolved URL: {context.get('finalUrl')}
- Classification Category: {context.get('category')}
- Target IP Type: {context.get('ipType')}
- Rule Engine Risk Score: {context.get('riskScore')} / 100
- Rule Engine Threat Level: {context.get('threatLevel')}
- Triggered Rules: {json.dumps(context.get('triggeredRules', []))}
- Brand Similarity Audit: {json.dumps(context.get('brandMatch', {}))}
- Redirect Chain Steps: {json.dumps(context.get('redirectChain', {}))}

Evaluate for:
1. Social engineering tricks (brand spoofing, character replacement, typosquatting).
2. Protocol downgrades or domain mismatches along the redirect path.
3. Scam scenario prediction (e.g. credential harvesting, fake banking, lottery scam).
4. Prevention steps and warnings.

Return exactly a JSON object matching this schema, without markdown formatting or code blocks:
{{
    "threat_summary": string (overall threat description, clear and simple),
    "scam_category": string ("Phishing" | "Fake Banking" | "Fake UPI Payment" | "Investment Scam" | "Lottery Scam" | "Job Scam" | "Tech Support Scam" | "OTP Fraud" | "Crypto Scam" | "Malware Download" | "Credential Harvesting" | "Unknown"),
    "threat_severity": string ("Safe" | "Low Risk" | "Medium Risk" | "High Risk" | "Dangerous"),
    "ai_confidence": float (confidence score between 0.0 and 1.0),
    "key_findings": [string] (list of 2-4 key technical findings/indicators),
    "risk_explanation": string (explain why it is safe/risky, potential impersonations, and likelihood of credential/financial theft),
    "prevention_tips": [string] (actionable advice: e.g. "Do not input passwords"),
    "final_recommendation": string ("Safe" | "Probably Safe" | "Use Caution" | "Suspicious" | "Dangerous" | "Avoid Completely")
}}
"""
    fallback = {
        "threat_summary": "AI service temporarily unavailable.",
        "scam_category": "Unknown",
        "threat_severity": context.get("threatLevel", "Low Risk"),
        "ai_confidence": 0.0,
        "key_findings": ["Failed to communicate with AI model."],
        "risk_explanation": "An unexpected error occurred during the LLM inference step. Showing deterministic rule results.",
        "prevention_tips": ["Treat this link with caution."],
        "final_recommendation": "Use Caution"
    }

    return GeminiClient.generate_content(
        contents=[prompt],
        generation_config={
            "temperature": 0.1,
            "response_mime_type": "application/json",
        },
        fallback_dict=fallback
    )


def run_gemini_screenshot_analysis(context: dict, image_path: Optional[str] = None) -> str:
    from app.services.gemini_client import GeminiClient

    prompt = f"""
You are an expert AI Cybersecurity Analyst specializing in screenshot fraud detection and social engineering identification.
Your task is to analyze the extracted OCR text, metadata, parsed entities, layout classification, and rule-based risk score below, and produce a detailed security analysis.

Context Data:
- Layout Category: {context.get('category')}
- OCR Extracted Text: {context.get('extracted_text')}
- Rule Engine Risk Score: {context.get('risk_score')} / 100
- Rule Engine Threat Level: {context.get('threat_level')}
- Triggered Rules: {json.dumps(context.get('triggered_rules', []))}
- Extracted Entities: {json.dumps(context.get('entities', {}))}
- Detected Elements: {json.dumps(context.get('detected_elements', {}))}

Evaluate for:
1. Phishing / social engineering patterns (urgent requests, impersonation, fake receipts).
2. Credential harvesting signatures (login layouts, credentials, OTP codes).
3. Fake transaction patterns (UPI address mismatches, fake bank references, impossible amounts).
4. Concrete recommendations and prevention instructions.

Return exactly a JSON object matching this schema, without markdown formatting or code blocks:
{{
    "threat_summary": string (overall threat description, clear and simple),
    "scam_category": string ("Phishing" | "Fake Payment Receipt" | "Credential Phishing" | "OTP Harvesting" | "KYC Scam" | "Investment Fraud" | "Tech Support Scam" | "WhatsApp Chat Phishing" | "Unknown"),
    "threat_severity": string ("Safe" | "Low" | "Medium" | "High" | "Critical"),
    "ai_confidence": float (confidence score between 0.0 and 1.0),
    "key_findings": [string] (list of 2-4 key technical findings/indicators),
    "risk_explanation": string (explain why it is safe/risky, potential impersonations, and likelihood of fraud),
    "prevention_tips": [string] (actionable advice),
    "final_recommendation": string ("Safe" | "Probably Safe" | "Use Caution" | "Suspicious" | "Avoid Completely")
}}
"""

    contents = [prompt]
    if image_path:
        try:
            pil_img = Image.open(image_path).convert("RGB")
            contents.append(pil_img)
        except Exception as e:
            logger.warning(f"Could not load image for Screenshot AI analysis: {e}")

    fallback = {
        "threat_summary": "AI service temporarily unavailable.",
        "scam_category": context.get("category", "Unknown"),
        "threat_severity": context.get("threat_level", "Medium"),
        "ai_confidence": 0.0,
        "key_findings": ["AI service offline."],
        "risk_explanation": "AI service temporarily unavailable.",
        "prevention_tips": ["Treat this image with caution."],
        "final_recommendation": "Use Caution"
    }

    return GeminiClient.generate_content(
        contents=contents,
        generation_config={
            "temperature": 0.1,
            "response_mime_type": "application/json",
        },
        fallback_dict=fallback
    )


