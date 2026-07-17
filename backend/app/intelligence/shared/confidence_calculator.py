def calculate_hybrid_confidence(
    rule_results: dict,
    ai_reasoning: dict,
    ocr_quality: float = 1.0,
    image_quality: float = 1.0,
    data_completeness: float = 1.0
) -> float:
    """
    Computes a deterministic, explainable confidence score based on multiple signals.
    
    Weights:
    - AI Confidence: 40%
    - Rule Engine Confidence: 30%
    - Data Completeness/Quality: 30% (OCR, Image, Completeness)
    """
    
    ai_conf = ai_reasoning.get("confidence", 0.5)
    
    # Analyze rule results for confidence
    rule_conf = 1.0
    failed = rule_results.get("failed_checks", [])
    warnings = rule_results.get("warning_checks", [])
    
    if len(failed) > 0:
        rule_conf = min(rule_conf, 0.9) # If it definitively failed rules, we are confident it's bad
    
    if len(warnings) > 2:
        rule_conf *= 0.8
        
    quality_score = (ocr_quality + image_quality + data_completeness) / 3.0
    
    hybrid_conf = (ai_conf * 0.4) + (rule_conf * 0.3) + (quality_score * 0.3)
    
    # Cap between 0 and 1
    return max(0.0, min(1.0, hybrid_conf))
