import type { DetectionResult } from "@/types/detection";

/**
 * Generates realistic mock detection data for development / when the API is unavailable.
 * Replace with real API data in production.
 */
export function getMockDetectionResult(reportId: string, isCounterfeit = false): DetectionResult {
  const now = new Date().toISOString();

  return {
    reportId,
    denomination: 500,
    serialNumber: isCounterfeit ? "5AC492821Z" : "5BD891430P",
    isCounterfeit,
    confidenceScore: isCounterfeit ? 0.962 : 0.987,
    riskScore: isCounterfeit ? 87 : 8,
    securityCheck: {
      watermark:        !isCounterfeit,
      securityThread:   !isCounterfeit,
      intaglioPrinting: !isCounterfeit,
      microlettering:   !isCounterfeit,
      latentImage:      !isCounterfeit || Math.random() > 0.5,
    },
    ocrExtractedText: isCounterfeit
      ? "RESERV BANK OF INDA\nFive Hundred Rupees\n5AC492821Z\nI Promise to Pay the Hearer"
      : "RESERVE BANK OF INDIA\nFive Hundred Rupees\n5BD891430P\nI Promise to Pay the Bearer the Sum of Five Hundred Rupees",
    ocr: {
      rawText: isCounterfeit
        ? "RESERV BANK OF INDA\nFive Hundred Rupees\n5AC492821Z"
        : "RESERVE BANK OF INDIA\nFive Hundred Rupees\n5BD891430P",
      serialNumber: isCounterfeit ? "5AC492821Z" : "5BD891430P",
      denominationText: "Five Hundred Rupees",
      confidence: isCounterfeit ? 0.74 : 0.97,
    },
    reasons: isCounterfeit
      ? [
          {
            feature: "Watermark Absent",
            severity: "CRITICAL",
            description:
              "No embedded Gandhi watermark detected in the designated zone. RBI-issued ₹500 notes carry this as a primary security marker.",
            passed: false,
          },
          {
            feature: "Security Thread Anomaly",
            severity: "HIGH",
            description:
              "The security thread width and magnetic properties do not match the RBI SPMCIL specification for this denomination.",
            passed: false,
          },
          {
            feature: "OCR Spelling Error",
            severity: "MEDIUM",
            description:
              "OCR detected 'RESERV BANK OF INDA' — misspelling of Reserve Bank of India. Genuine notes always carry the correct inscription.",
            passed: false,
          },
          {
            feature: "Intaglio Printing Depth",
            severity: "HIGH",
            description:
              "Raised printing texture on denominational numeral and Governor signature is absent — indicative of offset/inkjet printing.",
            passed: false,
          },
        ]
      : [
          {
            feature: "Watermark Pattern",
            severity: "LOW",
            description: "Gandhi watermark is present and correctly positioned in the watermark window.",
            passed: true,
          },
          {
            feature: "Security Thread",
            severity: "LOW",
            description: "Embedded 'भारत' (Bharat) security thread verified with correct magnetic property.",
            passed: true,
          },
        ],
    timeline: [
      {
        stage: "Image Preprocessing",
        description: "Image resized, normalised, and deskewed for analysis pipeline.",
        durationMs: 84,
        completedAt: now,
      },
      {
        stage: "EasyOCR Extraction",
        description: "Optical character recognition executed over note surface regions.",
        durationMs: 312,
        completedAt: now,
      },
      {
        stage: "Security Feature Detection",
        description: "CNN-based feature detector scanned for watermark, thread, and intaglio markers.",
        durationMs: 445,
        completedAt: now,
      },
      {
        stage: "Gemini Vision Analysis",
        description: "Gemini Flash Lite Vision model performed holistic authenticity scoring.",
        durationMs: 623,
        completedAt: now,
      },
      {
        stage: "Risk Score Computation",
        description: "Weighted ensemble of all detector outputs combined into a final risk score.",
        durationMs: 18,
        completedAt: now,
      },
    ],
    modelVersion: "gemini-1.5-flash-lite / easyocr-v1.7 / csai-ensemble-v3",
    processingTimeMs: 1482,
    timestamp: now,
  };
}
