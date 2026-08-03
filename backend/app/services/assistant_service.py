import os
from typing import Optional, Dict, Any, List
import google.generativeai as genai
from app.config.settings import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel(model_name="gemini-3.5-flash")

class CyberIntelligenceAssistant:
    """
    Unified AI Cyber Intelligence Assistant covering all intelligent workflows:
    - Feature 1: Currency Detection Explanation
    - Feature 2: Cyber Scam Analysis
    - Feature 3: Cyber Crime Reporting Assistant
    - Feature 5: Community Intelligence
    - Feature 6: Cyber Safety Education
    - Feature 7: Report Summarization
    - Feature 8: Evidence Explanation
    """

    @staticmethod
    def _build_prompt(context_type: str, context_data: dict, user_prompt: str) -> str:
        base_prompt = "You are CyberShield AI, a Principal Cyber Intelligence Assistant.\n"
        
        if context_type == "CURRENCY_REPORT":
            base_prompt += f"""
Context: The user is reviewing a Currency Detection Report.
Report Data: {context_data}
Task: Explain the findings concisely based ONLY on the report data. Do not rerun analysis. Explain missing features or confidence scores if asked.
"""
        elif context_type == "CYBER_SCAM_ANALYSIS":
            base_prompt += """
Context: The user uploaded evidence (text/image) of a potential cyber scam.
Task: Analyze the scam probability, threat level, fraud indicators, recommended actions, and educational explanation.
"""
        elif context_type == "REPORT_ASSISTANT":
            base_prompt += f"""
Context: The user is creating a cyber crime report. Current Draft: {context_data}
Task: Suggest an improved title, description, category, and priority. Detect missing information.
"""
        elif context_type == "COMMUNITY_INTELLIGENCE":
            base_prompt += f"""
Context: The user is viewing a community report. Report Data: {context_data}
Task: Recommend preventive measures, relate this to known scams, and summarize community discussions.
"""
        elif context_type == "EDUCATION":
            base_prompt += """
Context: The user is asking a general cyber safety or education question.
Task: Provide a concise, educational response about safe practices, scams, or government reporting. Do not provide legal advice.
"""
        elif context_type == "SUMMARIZATION":
            base_prompt += f"""
Context: The user wants a summary of a long report or discussion. Data: {context_data}
Task: Generate a concise summary of the provided text.
"""
        elif context_type == "EVIDENCE_EXPLANATION":
            base_prompt += """
Context: The user wants an explanation of the provided evidence (images/screenshots).
Task: Explain visible fraud indicators, suspicious content, and potential risks without modifying evidence.
"""
        else:
            base_prompt += f"Context Data: {context_data}\n"

        base_prompt += f"\nUser Query: {user_prompt}\nResponse Guidelines: Be concise, professional, and clear. Do not hallucinate data."
        return base_prompt

    async def handle_query(
        self,
        context_type: str,
        user_prompt: str,
        context_data: Optional[dict] = None,
        image_paths: Optional[List[str]] = None
    ) -> str:
        prompt = self._build_prompt(context_type, context_data or {}, user_prompt)
        contents = [prompt]

        if image_paths:
            import PIL.Image
            for path in image_paths:
                if os.path.exists(path):
                    contents.append(PIL.Image.open(path))

        response = await model.generate_content_async(
            contents=contents,
            generation_config={"temperature": 0.3}
        )
        return response.text

assistant_service = CyberIntelligenceAssistant()
