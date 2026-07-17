from typing import Optional

def get_counterfeit_analysis_prompt(denomination: int, serial_number: Optional[str] = None) -> str:
    """
    Returns a detailed, structured prompt for Gemini Flash Lite Vision to analyze
    Indian Currency note images for counterfeit indicators based on RBI security guidelines.
    """
    serial_info = f"Verify if the printed serial number matches or resembles: '{serial_number}'." if serial_number else "Extract and inspect the visible serial number."
    
    return f"""
You are an expert currency verification system specializing in Indian Banknotes (INR).
Analyze the provided image of the Rs. {denomination} banknote for authenticity.

Focus on the following Reserve Bank of India (RBI) security features:
1. Mahatma Gandhi Portrait & Watermark: Inspect the quality, placement, and presence of Mahatma Gandhi watermark (including multi-directional lines and denomination numeral watermark if visible).
2. Security Thread: Check if the security thread is visible, color-shifts from green to blue when tilted (where applicable), and contains readable 'भारत' (BHARAT) and 'RBI' inscriptions.
3. Intaglio Printing: Look for raised printing (intaglio) on the Mahatma Gandhi portrait, Ashoka Pillar emblem, bleed lines/identification marks (angular shapes on the left/right borders), and RBI Governor's signature.
4. Latent Image: Inspect the latent image area on the vertical band on the right/left containing the denomination numeral.
5. Color-Shifting Ink: For Rs. 200, 500, and 2000, verify the color-shifting properties of the denomination numeral (shifts green to blue).
6. Alignment & Typography: Verify the alignment of serial numbers, font sizing, and spelling in Hindi, English, and the language panel.
7. Swachh Bharat Logo: Check the logo and slogan placement on the reverse side.

Input Meta:
- Expected Denomination: Rs. {denomination}
- Expected Serial Number: {serial_number or "Not Provided"}

Instructions:
- Perform a detailed analysis of the visual elements.
- {serial_info}
- Provide a final verdict:
  - "GENUINE": The banknote exhibits all required security features and matches RBI specifications.
  - "FAKE": Clear evidence of counterfeit traits (blurry printing, incorrect alignments, missing security thread/watermark, invalid serial number format).
  - "SUSPICIOUS": Low resolution, poor lighting, or missing security features prevent confirmation, requiring manual admin verification.

You MUST respond ONLY with a valid JSON object matching this exact schema:
{{
  "status": "GENUINE | FAKE | SUSPICIOUS",
  "confidence": <float between 0.0 and 1.0>,
  "risk_score": <float between 0.0 and 100.0>,
  "ocr_data": {{
    "serial_number": "<extracted serial number>",
    "denomination": {denomination},
    "year_of_printing": "<extracted year of printing if visible>"
  }},
  "reasons": [
    "Watermark: ✓ Present (or ✗ Missing)",
    "Security Thread: ✓ Present (or ✗ Missing)",
    "Micro Lettering: ✓ Present (or ✗ Missing)",
    "Serial Number: ✓ Valid (or ✗ Suspicious)",
    "Printing Quality: ✓ Normal (or ✗ Blurry)",
    "Alignment: ✓ Perfect (or ✗ Suspicious)"
  ],
  "missing_features": [
    "<List any missing security features, e.g., 'Watermark', 'Security Thread', 'Intaglio Printing'. Empty if genuine.>"
  ],
  "feature_highlights": [
    {{
      "feature": "<Name of the feature, e.g. Watermark, Portrait, Serial Number, Suspicious Region>",
      "status": "<Present, Missing, or Suspicious>",
      "box_2d": [ymin, xmin, ymax, xmax]
    }}
  ],
  "summary": "<one sentence summarizing the overall analysis>",
  "recommendation": "<actionable recommendation, e.g., 'Accept the note', 'Reject the note', or 'Perform manual admin review'>"
}}
NOTE on feature_highlights: Provide bounding boxes for key security features (Portrait, Watermark, Security Thread, Serial Number) and any Suspicious Regions. Use normalized coordinates scaled to 1000: [ymin, xmin, ymax, xmax]. If a feature is missing, omit its bounding box or set to [0,0,0,0].

Do not include any markdown block formatting (like ```json), commentary, or leading/trailing text. Output ONLY the JSON string.
"""
