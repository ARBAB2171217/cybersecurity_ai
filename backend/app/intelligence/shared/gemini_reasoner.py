import json
import logging
import asyncio
from typing import Dict, Any, Optional

logger = logging.getLogger("app.intelligence.shared.gemini_reasoner")

def build_gemini_prompt(
    context_type: str, 
    parsed_data: Any, 
    entities: Dict[str, Any], 
    rule_results: Dict[str, Any], 
    threat_intel: Dict[str, Any],
    additional_instructions: str = ""
) -> str:
    """Builds a structured prompt for Gemini 2.5 Flash."""
    
    prompt = f"""You are a senior Cyber Threat Intelligence Analyst.
Your task is to explain the following {context_type} evidence in human-readable form.
You do not decide detected type, authenticity, threat level, risk score, or final status.
Those fields are produced by deterministic rule engines before your response.

# EVIDENCE GATHERED (Deterministic Analysis)
"""
    if parsed_data:
        prompt += f"\n## Parsed Data/OCR:\n{json.dumps(parsed_data, indent=2, default=str)}\n"
        
    if entities:
        prompt += f"\n## Extracted Entities:\n{json.dumps(entities, indent=2, default=str)}\n"
        
    if rule_results:
        prompt += f"\n## Rule Engine Findings:\n{json.dumps(rule_results, indent=2, default=str)}\n"
        
    if threat_intel:
        prompt += f"\n## Threat Intelligence Context:\n{json.dumps(threat_intel, indent=2, default=str)}\n"

    prompt += f"""
# ANALYSIS REQUIREMENTS
1. Synthesize the evidence above. Do not hallucinate data that is not present in the evidence.
2. Explain the deterministic findings clearly based on the provided evidence.
3. Give practical recommendations without changing or inventing any verdict.
{additional_instructions}

# OUTPUT FORMAT
Respond ONLY with a valid JSON object. No markdown formatting, no code blocks, just raw JSON.
The JSON must strictly follow this schema:
{{
    "status": "EXPLANATION_ONLY",
    "threat_level": "EXPLANATION_ONLY",
    "risk_score": 0,
    "confidence": 0.0,
    "summary": "<short executive summary of the findings>",
    "technical_findings": ["<finding 1>", "<finding 2>"],
    "suspicious_indicators": ["<indicator 1>", "<indicator 2>"],
    "recommendation": "<actionable next steps for the user>"
}}
"""
    return prompt

async def execute_gemini_reasoning(
    prompt: str, 
    image_path: Optional[str] = None
) -> Dict[str, Any]:
    """Executes the prompt using Gemini 2.5 Flash via GeminiClient."""
    from app.services.gemini_client import GeminiClient
    from PIL import Image

    contents = [prompt]
    if image_path:
        try:
            img = Image.open(image_path)
            img.thumbnail((1024, 1024))
            contents.append(img)
        except Exception as e:
            logger.error(f"Failed to load image for Gemini: {e}")

    fallback = _fallback_error("AI service temporarily unavailable.")

    # Call the blocking generate_content using asyncio.to_thread
    raw_text = await asyncio.to_thread(
        GeminiClient.generate_content,
        contents,
        {"temperature": 0.1, "response_mime_type": "application/json"},
        fallback
    )
    
    raw_text = raw_text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:-3].strip()
    elif raw_text.startswith("```"):
        raw_text = raw_text[3:-3].strip()
        
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}. Raw text: {raw_text}")
        return _fallback_error("AI returned malformed response.")

def _fallback_error(reason: str) -> Dict[str, Any]:
    return {
        "status": "NEEDS_MANUAL_VERIFICATION",
        "threat_level": "Unknown",
        "risk_score": 50,
        "confidence": 0.0,
        "summary": reason,
        "technical_findings": [],
        "suspicious_indicators": [],
        "recommendation": "Review manually due to analysis failure."
    }
