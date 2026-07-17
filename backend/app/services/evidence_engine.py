import os
import time
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional
import uuid

from app.models.report import Report, ReportStatus
from app.ai.pipelines.ocr_pipeline import run_ocr
from app.services.entity_extractor import extract_all_entities
from app.services.screenshot_risk_analyzer import ScreenshotRiskAnalyzer
from app.services.screenshot_service import classify_screenshot_text, detect_presence_elements
from app.ai.pipelines.gemini_pipeline import run_gemini_screenshot_analysis, run_gemini_url_analysis

# URL imports
from app.services.redirect_resolver import RedirectResolverService

logger = logging.getLogger("app.services.evidence_engine")

class SharedAIUtilities:
    """
    Reusable utilities for interacting with Gemini and handling prompt structure.
    """
    @staticmethod
    def is_api_configured() -> bool:
        from app.config.settings import settings
        key = settings.GEMINI_API_KEY or ""
        return bool(key.strip()) and "placeholder" not in key.lower() and "your-gemini" not in key.lower()


class ThreatSummaryGenerator:
    """
    Generates structured risk explanations, recommendations, and visual color tokens.
    """
    @staticmethod
    def get_severity_color(threat_level: str) -> str:
        mapping = {
            "Safe": "emerald",
            "Low": "green",
            "Medium": "yellow",
            "High": "orange",
            "Critical": "red"
        }
        return mapping.get(threat_level, "cyan")

    @staticmethod
    def summarize_threats(triggered_rules: List[Dict[str, Any]]) -> List[str]:
        if not triggered_rules:
            return ["No significant threat indicators triggered by security policies."]
        return [f"Rule '{rule.get('name')}' triggered (Severity: {rule.get('severity')})" for rule in triggered_rules]


class EntityMapper:
    """
    Normalizes, filters, and formats raw extracted entities into standard representations.
    """
    @staticmethod
    def normalize_extracted_entities(entities: Dict[str, Any]) -> Dict[str, Any]:
        normalized = dict(entities)
        
        # Eliminate duplicates in financials
        if "financials" in normalized:
            f = normalized["financials"]
            for key in ["amounts", "banks", "upi_ids", "account_numbers", "ifsc_codes", "transaction_ids", "reference_numbers", "order_ids", "invoice_numbers"]:
                if key in f and isinstance(f[key], list):
                    f[key] = sorted(list(set(f[key])))

        # Eliminate duplicates in contacts
        if "contacts" in normalized:
            c = normalized["contacts"]
            for key in ["phone_numbers", "emails", "usernames", "customer_ids"]:
                if key in c and isinstance(c[key], list):
                    c[key] = sorted(list(set(c[key])))

        # Eliminate duplicates in web telemetry
        if "web" in normalized:
            w = normalized["web"]
            for key in ["urls", "domains", "ip_addresses"]:
                if key in w and isinstance(w[key], list):
                    w[key] = sorted(list(set(w[key])))

        return normalized


class ReportMapper:
    """
    Maps compiled Evidence Intelligence payloads to Report database model fields.
    """
    @staticmethod
    def map_to_report(report: Report, analysis_result: Dict[str, Any]) -> Report:
        ai_resp = analysis_result.get("ai_analysis") or {}
        risk_resp = analysis_result.get("risk_analysis") or {}
        
        # Populate basic fields
        report.ocr_text = analysis_result.get("ocr_text", "")
        report.confidence_score = float(ai_resp.get("ai_confidence", 0.0))
        report.category = ai_resp.get("scam_category", report.category or "Screenshot")
        
        # Determine verdict
        threat_level = risk_resp.get("threat_level", "Medium")
        if threat_level in ["Safe", "Low"]:
            report.is_counterfeit = False
            report.status = ReportStatus.APPROVED.value
        elif threat_level == "Medium":
            report.is_counterfeit = None
            report.status = ReportStatus.PENDING.value
        else:  # High or Critical
            report.is_counterfeit = True
            report.status = ReportStatus.REJECTED.value
            
        # Store full payload in raw_ai_response
        report.raw_ai_response = analysis_result
        return report


class AnalysisFormatter:
    """
    Structures the output response payloads to ensure high type-safety and consistency.
    """
    @staticmethod
    def format_payload(
        ocr_result: Dict[str, Any],
        classification: Dict[str, Any],
        detected_elements: Dict[str, Any],
        metadata: Dict[str, Any],
        entities: Dict[str, Any],
        risk_analysis: Dict[str, Any],
        url_intelligence: Optional[Dict[str, Any]],
        ai_analysis: Dict[str, Any],
        timeline: Dict[str, float]
    ) -> Dict[str, Any]:
        return {
            "ocr_text": ocr_result.get("raw_text", ""),
            "ocr_confidence": ocr_result.get("ocr_confidence", 1.0),
            "blocks": ocr_result.get("blocks", []),
            "category": classification.get("category", "Unknown"),
            "confidence": classification.get("confidence", 0.0),
            "detected_elements": detected_elements,
            "metadata": metadata,
            "entities": entities,
            "risk_analysis": risk_analysis,
            "url_intelligence": url_intelligence,
            "ai_analysis": ai_analysis,
            "timeline": timeline
        }


class EvidenceIntelligenceEngine:
    """
    Central orchestrator coordinating OCR, Entity Extraction, Rule Engines,
    Embedded QR Code & URL checks, and cognitive Gemini AI Analysis.
    """
    @staticmethod
    async def analyze_screenshot(
        file_path: str,
        filename: str,
        classification: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        timeline = {}
        
        # 1. Image Metadata
        t_start = time.time()
        if classification and "preprocessing" in classification:
            preproc = classification["preprocessing"]
            meta = {
                "filename": filename,
                "file_size": os.path.getsize(file_path) if os.path.exists(file_path) else 0,
                "width": preproc.get("width", 0),
                "height": preproc.get("height", 0),
                "format": preproc.get("format", "PNG")
            }
        else:
            from PIL import Image
            try:
                with Image.open(file_path) as img:
                    width, height = img.size
                    format_ = img.format
                file_size = os.path.getsize(file_path)
                meta = {
                    "filename": filename,
                    "file_size": file_size,
                    "width": width,
                    "height": height,
                    "format": format_ or "PNG"
                }
            except Exception as e:
                logger.warning(f"Failed to read image metadata: {e}")
                meta = {
                    "filename": filename,
                    "file_size": 0,
                    "width": 0,
                    "height": 0,
                    "format": "Unknown"
                }
        timeline["Metadata Extraction"] = round((time.time() - t_start) * 1000, 2)
        
        # 1.5 Image Quality Assessment
        # Skip if classification is already successful
        if not classification or classification.get("detected_type") == "Unknown":
            from app.ai.pipelines.preprocessing import assess_screenshot_quality
            try:
                quality = assess_screenshot_quality(file_path)
                if quality.get("quality_status") == "REJECTED":
                    return {
                        "early_exit": True,
                        "category": "Screenshot",
                        "ocr_text": "",
                        "timeline": timeline,
                        "risk_analysis": {
                            "threat_level": "Safe",
                            "risk_score": 10
                        },
                        "ai_analysis": {
                            "threat_summary": "Image quality rejected.",
                            "scam_category": "Unknown",
                            "threat_severity": "Safe",
                            "ai_confidence": 1.0,
                            "key_findings": quality.get("detected_issues", []),
                            "risk_explanation": quality.get("recommendation", "Capture a better image."),
                            "prevention_tips": ["Ensure good lighting and avoid blur."],
                            "final_recommendation": "Safe"
                        }
                    }
            except ValueError as e:
                return {
                    "early_exit": True,
                    "category": "Screenshot",
                    "ocr_text": "",
                    "timeline": timeline,
                    "risk_analysis": {
                        "threat_level": "Safe",
                        "risk_score": 10
                    },
                    "ai_analysis": {
                        "threat_summary": "Image quality rejected.",
                        "scam_category": "Unknown",
                        "threat_severity": "Safe",
                        "ai_confidence": 1.0,
                        "key_findings": [str(e)],
                        "risk_explanation": "Image is too blurry or poor quality to analyze.",
                        "prevention_tips": ["Ensure good lighting and avoid blur."],
                        "final_recommendation": "Safe"
                    }
                }
        
        # 2. OCR Extraction
        t0 = time.time()
        try:
            if classification and "ocr_result" in classification:
                ocr_result = classification["ocr_result"]
            else:
                ocr_result = await asyncio.to_thread(run_ocr, file_path)
            raw_text = ocr_result.get("raw_text", "")
            if not raw_text.strip():
                return {
                    "early_exit": True,
                    "category": "Screenshot",
                    "ocr_text": "",
                    "timeline": timeline,
                    "risk_analysis": {
                        "threat_level": "Safe",
                        "risk_score": 10
                    },
                    "ai_analysis": {
                        "threat_summary": "Unable to detect readable text.",
                        "scam_category": "Unknown",
                        "threat_severity": "Safe",
                        "ai_confidence": 1.0,
                        "key_findings": ["No text detected."],
                        "risk_explanation": "The OCR engine could not extract any text.",
                        "prevention_tips": ["Ensure text is visible."],
                        "final_recommendation": "Safe"
                    }
                }
        except Exception:
            return {
                "early_exit": True,
                "category": "Screenshot",
                "ocr_text": "",
                "timeline": timeline,
                "risk_analysis": {
                    "threat_level": "Medium",
                    "risk_score": 50
                },
                "ai_analysis": {
                    "threat_summary": "OCR failed.",
                    "scam_category": "Unknown",
                    "threat_severity": "Medium",
                    "ai_confidence": 0.0,
                    "key_findings": ["OCR engine failure."],
                    "risk_explanation": "Failed to extract text due to system error.",
                    "prevention_tips": ["Please try again."],
                    "final_recommendation": "Use Caution"
                }
            }
        
        block_confs = [b["confidence"] for b in ocr_result.get("blocks", []) if "confidence" in b]
        ocr_conf = sum(block_confs) / len(block_confs) if block_confs else 1.0
        ocr_result["ocr_confidence"] = ocr_conf
        timeline["OCR Extraction"] = round((time.time() - t0) * 1000, 2)
        
        # 3. Categorization & Element Detection
        t0 = time.time()
        classification = classify_screenshot_text(raw_text)
        detected_elements = detect_presence_elements(raw_text)
        timeline["Categorization"] = round((time.time() - t0) * 1000, 2)
        
        # 4. Entity Extraction
        t0 = time.time()
        entities = extract_all_entities(raw_text)
        entities = EntityMapper.normalize_extracted_entities(entities)
        timeline["Entity Extraction"] = round((time.time() - t0) * 1000, 2)
        
        # 5. Rule Engine Risk Assessment
        t0 = time.time()
        risk_analysis = ScreenshotRiskAnalyzer.analyze(entities, classification["category"])
        timeline["Rule Engine"] = round((time.time() - t0) * 1000, 2)
        
        qr_intelligence = None
        
        # 7 & 8. Run URL Scam Scan and Main AI Analysis in Parallel
        t0 = time.time()
        url_intelligence = None
        extracted_urls = entities.get("web", {}).get("urls", [])

        async def _run_url_analysis(target_url):
            try:
                res_data = await RedirectResolverService.resolve_url(target_url)
                risk_score = 0
                triggered_rules = []
                final_url = res_data.get("final_url", target_url)
                
                if not res_data.get("https_enabled"):
                    risk_score += 35
                    triggered_rules.append({"name": "Insecure Protocol (HTTP)", "severity": "Medium", "description": "URL does not enforce SSL/TLS communication."})
                if res_data.get("total_redirects", 0) > 2:
                    risk_score += 25
                    triggered_rules.append({"name": "Multiple Redirect Chains", "severity": "Medium", "description": "Too many redirects detected."})
                if res_data.get("error"):
                    risk_score += 20
                    triggered_rules.append({"name": "Redirect Resolution Error", "severity": "Low", "description": res_data.get("error")})
                
                threat_level = "Low Risk"
                if risk_score > 60:
                    threat_level = "Dangerous"
                elif risk_score > 30:
                    threat_level = "Medium Risk"
                
                url_context = {
                    "originalUrl": target_url,
                    "finalUrl": final_url,
                    "category": classification.get("category", "Unknown"),
                    "ipType": "Public",
                    "riskScore": risk_score,
                    "threatLevel": threat_level,
                    "triggeredRules": triggered_rules,
                    "brandMatch": {},
                    "redirectChain": res_data.get("redirect_chain", [])
                }
                raw_url_ai = await asyncio.to_thread(run_gemini_url_analysis, url_context)
                try:
                    url_ai = json.loads(raw_url_ai)
                except Exception:
                    url_ai = {
                        "threat_summary": "AI URL analysis could not be parsed.",
                        "scam_category": "Unknown",
                        "threat_severity": threat_level,
                        "ai_confidence": 0.0,
                        "key_findings": [],
                        "risk_explanation": "JSON decoding failed.",
                        "prevention_tips": [],
                        "final_recommendation": "Use Caution"
                    }
                
                return {
                    "detected": True,
                    "target_url": target_url,
                    "resolver_data": res_data,
                    "risk": {
                        "risk_score": risk_score,
                        "threat_level": threat_level,
                        "triggered_rules": triggered_rules
                    },
                    "ai_verdict": url_ai
                }
            except Exception as e:
                logger.warning(f"Failed to scan embedded URL redirects: {e}")
                return None

        async def _run_gemini_screenshot():
            context = {
                "category": classification.get("category"),
                "extracted_text": raw_text,
                "risk_score": risk_analysis.get("risk_score", 0),
                "threat_level": risk_analysis.get("threat_level", "Medium"),
                "triggered_rules": risk_analysis.get("triggered_rules", []),
                "entities": entities,
                "detected_elements": detected_elements
            }
            raw_ai = await asyncio.to_thread(run_gemini_screenshot_analysis, context, file_path)
            try:
                return json.loads(raw_ai)
            except Exception:
                return {
                    "threat_summary": "AI Screenshot analysis could not be parsed.",
                    "scam_category": classification.get("category", "Unknown"),
                    "threat_severity": risk_analysis.get("threat_level", "Medium"),
                    "ai_confidence": 0.0,
                    "key_findings": ["Failed to decode AI response."],
                    "risk_explanation": f"Deterministic engine calculated risk score of {risk_analysis.get('risk_score')}/100.",
                    "prevention_tips": ["Treat this evidence with high caution."],
                    "final_recommendation": "Use Caution"
                }

        # Run both simultaneously to save time
        tasks = [_run_gemini_screenshot()]
        if extracted_urls:
            tasks.append(_run_url_analysis(extracted_urls[0]))

        results = await asyncio.gather(*tasks)
        ai_verdict = results[0]
        if len(results) > 1:
            url_intelligence = results[1]

        timeline["Cognitive AI Analysis"] = round((time.time() - t0) * 1000, 2)
        
        # Final formatting
        return AnalysisFormatter.format_payload(
            ocr_result=ocr_result,
            classification=classification,
            detected_elements=detected_elements,
            metadata=meta,
            entities=entities,
            risk_analysis=risk_analysis,
            url_intelligence=url_intelligence,
            ai_analysis=ai_verdict,
            timeline=timeline
        )
