import asyncio
import logging
import time
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod

logger = logging.getLogger("app.intelligence.pipeline")

class IntelligencePipeline(ABC):
    """
    Abstract base class for all Intelligence Pipelines.
    Enforces the Multi-Layer Intelligence Pipeline architecture:
    1. Preprocessing
    2. OCR / Parsing
    3. Entity Extraction
    4. Rule Engine
    5. Threat Intelligence
    6. Gemini Reasoning
    7. Confidence Calculation
    8. Final Decision
    """
    
    def __init__(self):
        self.context = {
            "timeline": {},
            "errors": [],
            "warnings": [],
            "evidence": {}
        }

    async def execute(self, input_data: Any) -> Dict[str, Any]:
        """Executes the standard multi-layer pipeline."""
        try:
            t0 = time.time()
            self.context["timeline"]["start"] = t0
            
            # 1. Preprocessing
            processed_data = await self._measure_time("Preprocessing", self.preprocess, input_data)
            if processed_data is None:
                return self.fallback_response("Preprocessing failed or returned no data.")
                
            # 2. OCR / Parsing
            parsed_data = await self._measure_time("Parsing", self.parse, processed_data)
            
            # 3. Entity Extraction
            entities = await self._measure_time("EntityExtraction", self.extract_entities, parsed_data)
            self.context["evidence"]["entities"] = entities
            
            # 4. Rule Engine
            rule_results = await self._measure_time("RuleEngine", self.run_rules, parsed_data, entities)
            self.context["evidence"]["rules"] = rule_results
            
            # 5. Threat Intelligence (External lookups, history, etc)
            threat_intel = await self._measure_time("ThreatIntelligence", self.gather_threat_intel, parsed_data, entities)
            self.context["evidence"]["threat_intel"] = threat_intel
            
            # 6. Gemini 2.5 Flash Reasoning
            ai_reasoning = await self._measure_time("GeminiReasoning", self.reason_with_ai, parsed_data, entities, rule_results, threat_intel)
            self.context["evidence"]["ai_reasoning"] = ai_reasoning
            
            # 7. Confidence Calculation
            confidence = await self._measure_time("ConfidenceCalculation", self.calculate_confidence, rule_results, ai_reasoning)
            
            # 8. Final Decision & Formatting
            final_decision = await self._measure_time("FinalDecision", self.format_decision, parsed_data, confidence, ai_reasoning, rule_results)
            
            self.context["timeline"]["total_ms"] = round((time.time() - t0) * 1000, 2)
            final_decision["timeline"] = self.context["timeline"]
            
            return final_decision
            
        except Exception as e:
            logger.error(f"Pipeline execution failed: {e}", exc_info=True)
            return self.fallback_response(f"Internal pipeline error: {str(e)}")

    async def _measure_time(self, step_name: str, coro, *args):
        start = time.time()
        if asyncio.iscoroutinefunction(coro):
            result = await coro(*args)
        else:
            result = await asyncio.to_thread(coro, *args)
        self.context["timeline"][step_name] = round((time.time() - start) * 1000, 2)
        return result

    @abstractmethod
    def preprocess(self, input_data: Any) -> Any: pass
    
    @abstractmethod
    def parse(self, processed_data: Any) -> Any: pass
    
    @abstractmethod
    def extract_entities(self, parsed_data: Any) -> Dict[str, Any]: pass
    
    @abstractmethod
    def run_rules(self, parsed_data: Any, entities: Dict[str, Any]) -> Dict[str, Any]: pass
    
    @abstractmethod
    def gather_threat_intel(self, parsed_data: Any, entities: Dict[str, Any]) -> Dict[str, Any]: pass
    
    @abstractmethod
    def reason_with_ai(self, parsed_data: Any, entities: Dict[str, Any], rule_results: Dict[str, Any], threat_intel: Dict[str, Any]) -> Dict[str, Any]: pass
    
    @abstractmethod
    def calculate_confidence(self, rule_results: Dict[str, Any], ai_reasoning: Dict[str, Any]) -> float: pass
    
    @abstractmethod
    def format_decision(self, parsed_data: Any, confidence: float, ai_reasoning: Dict[str, Any], rule_results: Dict[str, Any]) -> Dict[str, Any]: pass

    def fallback_response(self, reason: str) -> Dict[str, Any]:
        return {
            "status": "NEEDS_MANUAL_VERIFICATION",
            "threat_level": "Unknown",
            "risk_score": 50,
            "confidence": 0.0,
            "summary": "Analysis could not be completed.",
            "recommendation": "Please verify manually.",
            "recommendation_list": ["AI analysis is temporarily unavailable.", "Please verify manually."],
            "technical_findings": [],
            "triggered_rules": [],
            "error": reason
        }
