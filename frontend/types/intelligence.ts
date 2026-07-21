export type IntelligenceType =
  | "URL"
  | "QR"
  | "Screenshot"
  | "Email"
  | "SMS"
  | "Website"
  | "Document";

export type ThreatLevel =
  | "Safe"
  | "Low Risk"
  | "Medium Risk"
  | "High Risk"
  | "Dangerous";

export type RuleStatus = "Pass" | "Fail" | "Warning";
export type RuleSeverity = "Low" | "Medium" | "High";

export interface SecurityRule {
  name: string;
  status: RuleStatus;
  severity: RuleSeverity;
  description: string;
  reason: string;
  suggestedAction: string;
}

export interface AIAnalysisResult {
  original_url: string;
  final_url: string;
  website_category: string;
  final_risk_score: number;
  final_threat_level: string;
  cyber_threat: string;
  privacy_risk: string;
  financial_risk: string;
  download_risk: string;
  threat_intel: Record<string, string>;
  triggered_rules: string[];
  evidence_collected: string[];
  recommendations: string[];
  processing_time: number;
  ai_available: boolean;
  ai_summary: string;
  ai_confidence: number | null;
  forensics?: any;
}

export interface IntelligenceAssessment {
  riskScore: number;
  threatLevel: ThreatLevel;
  totalRulesExecuted: number;
  passedChecks: SecurityRule[];
  failedChecks: SecurityRule[];
  warningChecks: SecurityRule[];
  triggeredRules: SecurityRule[];
  aiAnalysis?: AIAnalysisResult | null;
  timestamp: string;
}
