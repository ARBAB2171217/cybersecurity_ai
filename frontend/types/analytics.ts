export interface DailyScanData {
  date: string;
  total: number;
  counterfeit: number;
  genuine: number;
}

export interface DenominationBreakdown {
  denomination: number;
  count: number;
  counterfeitCount: number;
}

export interface VerificationAccuracyByModel {
  modelName: string;
  accuracy: number;
  latencyMs: number;
}

export interface SystemHealthStats {
  cpuUsage: number;
  ramUsage: number;
  redisConnected: boolean;
  postgresConnected: boolean;
}

export interface SystemAnalyticsSummary {
  dailyScans: DailyScanData[];
  denominations: DenominationBreakdown[];
  accuracyModels: VerificationAccuracyByModel[];
  health: SystemHealthStats;
}
