import { Denomination } from "@/lib/constants";

// ─── Security Feature Check ───────────────────────────────────────────────

export interface SecurityFeaturesCheck {
  watermark: boolean;
  securityThread: boolean;
  intaglioPrinting: boolean;
  microlettering: boolean;
  latentImage: boolean;
}

// ─── OCR Output ───────────────────────────────────────────────────────────

export interface OcrResult {
  rawText: string;
  serialNumber?: string;
  denominationText?: string;
  governorSignature?: string;
  language?: string;
  confidence: number; // 0–1
}

// ─── Detection Timeline Event ─────────────────────────────────────────────

export interface DetectionTimelineEvent {
  stage: string;
  description: string;
  durationMs: number;
  completedAt: string;
}

// ─── AI Analysis Reason ───────────────────────────────────────────────────

export interface DetectionReason {
  feature: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  passed: boolean;
}

// ─── Core Detection Result ────────────────────────────────────────────────

export interface DetectionResult {
  reportId: string;
  denomination: Denomination;
  serialNumber?: string;
  isCounterfeit: boolean;
  confidenceScore: number;   // 0–1
  riskScore: number;         // 0–100
  securityCheck: SecurityFeaturesCheck;
  ocrExtractedText?: string;
  ocr?: OcrResult;
  reasons?: DetectionReason[];
  timeline?: DetectionTimelineEvent[];
  modelVersion?: string;
  processingTimeMs?: number;
  imageUrl?: string;
  preprocessedImageUrl?: string;
  timestamp: string;
}
