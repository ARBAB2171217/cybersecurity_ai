import { Denomination } from "@/lib/constants";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Core Report type — maps directly to backend ReportResponse (camelCase via alias_generator).
 * Fields: id, userId, denomination, serialNumber, imageUrl,
 *         isCounterfeit, confidenceScore, status, ocrText, rawAiResponse,
 *         createdAt, updatedAt.
 */
export interface Report {
  id: string;
  userId?: string;
  
  category: string;
  title?: string;
  description?: string;
  incidentDate?: string;
  incidentTime?: string;
  location?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  evidence?: string[];

  denomination?: Denomination;
  serialNumber?: string;
  imageUrl?: string;
  isCounterfeit?: boolean;
  confidenceScore?: number;
  status: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "APPROVED" | "RESOLVED" | "REJECTED";
  visibility?: "PUBLIC" | "PRIVATE" | "ANONYMOUS";
  ocrText?: string;
  
  // Classification fields
  evidenceType?: string;
  classificationConfidence?: number;
  selectedPipeline?: string;
  
  // Community metrics
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  trendingScore?: number;
  verificationCount?: number;
  bookmarksCount?: number;
  
  isLiked?: boolean;
  isBookmarked?: boolean;
  authorName?: string;
  rawAiResponse?: RawAiResponse | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape of the raw_ai_response JSON stored in the database.
 * Populated by the AI detection pipeline after analysis.
 */
export interface RawAiResponse {
  status: "GENUINE" | "FAKE" | "SUSPICIOUS";
  confidence: number;
  risk_score: number;
  ocr_text?: string;
  entities?: Record<string, any>;
  risk_analysis?: {
    risk_score?: number;
    threat_level?: string;
    triggered_rules?: any[];
    risk_level?: "Safe" | "Low" | "Medium" | "High" | "Critical";
    detected_risks?: string[];
    passed_checks?: string[];
    analysis_summary?: string;
    fraud_scenario?: string;
    prevention_tips?: string[];
    final_recommendation?: string;
  };
  qr_intelligence?: any;
  url_intelligence?: any;
  ai_analysis?: {
    scam_category?: string;
    threat_severity?: string;
    threat_summary?: string;
    risk_explanation?: string;
    prevention_tips?: string[];
    final_recommendation?: string;
    ai_confidence?: number;
  };
  ocr_data?: {
    easyocr_raw?: string;
    easyocr_serials?: string[];
    easyocr_denominations?: string[];
    gemini_extracted?: {
      serial_number?: string;
      denomination?: number;
      year_of_printing?: string;
    };
  };
  reasons?: string[];
  missing_features?: string[];
  feature_highlights?: {
    feature: string;
    status: string;
    box_2d: [number, number, number, number];
  }[];
  breakdown?: {
    gemini_confidence: number;
    ocr_confidence: number;
    quality_score: number;
    security_features_score: number;
  };
  timeline?: Record<string, number>;
  summary?: string;
  recommendation?: string;
  qr_details?: {
    qr_detected: boolean;
    qr_type: string;
    decoded_value: string;
    confidence: number;
    classification_reason: string;
    extracted_information?: Record<string, string | number | boolean | null | undefined>;
    validation_status?: string;
    validation_errors?: string[];
    risk_analysis?: {
      risk_score: number;
      risk_level: "Safe" | "Low" | "Medium" | "High" | "Critical";
      detected_risks: string[];
      passed_checks: string[];
      analysis_summary: string;
      fraud_scenario?: string;
      prevention_tips?: string[];
      final_recommendation?: string;
    };
  };
}
