import pytest
import asyncio
from app.intelligence.url.url_pipeline import URLIntelligencePipeline

@pytest.mark.asyncio
async def test_url_pipeline_piracy_detection():
    pipeline = URLIntelligencePipeline("https://freemovies.com/watch")
    
    # Mock parse data
    parsed_data = {
        "final_url": "https://freemovies.com/watch",
        "domain": "freemovies.com",
        "ssl_valid": True,
        "html_content": "<html><body>Watch online free movies here!</body></html>"
    }
    
    entities = await pipeline.extract_entities(parsed_data)
    assert entities["content_indicators"]["piracy_keywords"] is True
    
    rules = await pipeline.run_rules(parsed_data, entities)
    assert rules["website_category"] == "Piracy"
    assert rules["content_score"] == 0 # no hidden base64 or download in HTML
    assert rules["domain_score"] == 0
    assert rules["ssl_score"] == 0

@pytest.mark.asyncio
async def test_url_pipeline_banking_phishing():
    pipeline = URLIntelligencePipeline("http://login.secure-bank.com.scam.net")
    
    parsed_data = {
        "final_url": "http://login.secure-bank.com.scam.net",
        "domain": "login.secure-bank.com.scam.net",
        "ssl_valid": False,
        "ssl_error": "Missing SSL",
        "html_content": "<html><body><input type='password' /> Please enter cc-number</body></html>"
    }
    
    entities = await pipeline.extract_entities(parsed_data)
    assert entities["is_new_domain"] is True  # because 'scam' is in the registered domain
    assert entities["content_indicators"]["has_login_form"] is True
    assert entities["content_indicators"]["has_credit_card"] is True
    
    rules = await pipeline.run_rules(parsed_data, entities)
    assert rules["website_category"] == "Banking / Finance"
    assert rules["domain_score"] == 80  # new domain
    assert rules["ssl_score"] == 100    # ssl invalid
    assert rules["content_score"] == 40 # login form
    
@pytest.mark.asyncio
async def test_url_pipeline_scoring_engine():
    pipeline = URLIntelligencePipeline("http://scam.net")
    parsed_data = {"final_url": "http://scam.net", "ssl_valid": True}
    
    rule_results = {
        "domain_score": 80,
        "ssl_score": 0,
        "content_score": 100,
        "failed_checks": ["Failed test"]
    }
    
    # Manually inject threat intel mock to pipeline context
    pipeline.context["threat_intel"] = {
        "google_safe_browsing": "MALWARE",
        "virustotal": "MALICIOUS",
        "phishtank": "CLEAN"
    }
    
    ai_reasoning = {
        "summary": "AI detected a threat.",
        "attack_scenario": "Credential harvesting."
    }
    
    decision = await pipeline.format_decision(parsed_data, 0.95, ai_reasoning, rule_results)
    
    assert decision["Threat Category"] == "High Risk"
    assert decision["status"] == "THREAT"
    assert decision["risk_score"] >= 85  # Because of the hard blacklist override
    assert "Do not download anything" in decision["recommendation"]
