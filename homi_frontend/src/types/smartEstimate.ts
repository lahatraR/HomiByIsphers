// ─── Smart Estimate Types ──────────────────────────────────────────
// Extracted from smartEstimate.service.ts

export interface SmartEstimateResult {
  estimatedHours: number | null;
  estimatedSeconds: number | null;
  medianHours?: number;
  minHours?: number;
  maxHours?: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  basedOn: number;
  message?: string;
}

export interface OverrunCheck {
  overrun: boolean;
  estimatedSeconds: number;
  currentSeconds: number;
  percentOver: number;
  message: string | null;
}
