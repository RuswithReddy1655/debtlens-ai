import { ExtractedFeatureSet } from './PredictiveFeatureService';
import { ComprehensiveTrendReport } from './TrendAnalysisService';
import {
  PredictionConfidenceLevel,
  NumericForecastRange,
  FinancialForecastRange,
} from '../../models/PredictiveAssessment';
import { CostModel } from '../financial/CostModel';

export interface ConfidenceEvaluationResult {
  confidenceLevel: PredictionConfidenceLevel;
  confidenceScore: number; // 0-100
  historicalSnapshotsCount: number;
  dataCompleteness: number;
  metricStability: number;
  gitHistoryQuality: 'RICH' | 'MODERATE' | 'SPARSE' | 'UNKNOWN';
  reasons: string[];
  limitations: string[];
}

export class PredictionConfidenceService {
  /**
   * Evaluates prediction confidence objectively from historical evidence.
   */
  static evaluateConfidence(
    features: ExtractedFeatureSet,
    trendReport: ComprehensiveTrendReport
  ): ConfidenceEvaluationResult {
    const snapshotCount = features.historySummary.snapshotCount.value;
    const completenessRatio = features.historySummary.dataCompletenessRatio.value; // 0-100
    const reasons: string[] = [];
    const limitations: string[] = [];

    // Check minimum threshold
    if (snapshotCount <= 1) {
      return {
        confidenceLevel: 'INSUFFICIENT DATA',
        confidenceScore: 10,
        historicalSnapshotsCount: snapshotCount,
        dataCompleteness: completenessRatio,
        metricStability: 0,
        gitHistoryQuality: 'SPARSE',
        reasons: ['Insufficient historical snapshot data points (0–1). Minimum 2 required.'],
        limitations: [
          'Historical trajectory cannot be extrapolated without at least 2 analysis snapshots.',
          'Forecasts are held in INSUFFICIENT DATA state until further commits are ingested.',
        ],
      };
    }

    // Git history quality
    const commitsAnalyzed = features.repositoryFeatures.commitFrequency.value;
    let gitHistoryQuality: 'RICH' | 'MODERATE' | 'SPARSE' | 'UNKNOWN' = 'SPARSE';
    if (commitsAnalyzed >= 50 || features.gitFeatures.totalChurn.value > 5000) {
      gitHistoryQuality = 'RICH';
      reasons.push('Rich Git history with active commit and churn telemetry.');
    } else if (commitsAnalyzed >= 10 || features.gitFeatures.totalChurn.value > 500) {
      gitHistoryQuality = 'MODERATE';
      reasons.push('Moderate commit history captured across recent cycles.');
    } else {
      gitHistoryQuality = 'SPARSE';
      limitations.push('Sparse git commit activity limits regression velocity precision.');
    }

    // Metric stability (based on volatility of debt score)
    const volatility = trendReport.debtScoreTrend.volatility;
    let metricStability = Math.max(0, 100 - volatility * 5);
    if (volatility <= 3) {
      reasons.push('High telemetry metric stability across sequential snapshots.');
    } else if (volatility > 10) {
      limitations.push('High variance in point-to-point debt deltas reduces forecast precision.');
      metricStability = Math.max(20, metricStability);
    }

    // Calculate score (0-100)
    let score = 0;
    if (snapshotCount >= 5) {
      score += 45;
      reasons.push(`Long historical trajectory (${snapshotCount} sequential analysis snapshots).`);
    } else if (snapshotCount >= 3) {
      score += 30;
      reasons.push(`Multi-cycle trajectory (${snapshotCount} sequential analysis snapshots).`);
    } else {
      score += 15;
      limitations.push(`Only ${snapshotCount} historical snapshots available; predictions are low confidence.`);
    }

    score += Math.round(completenessRatio * 0.3);
    score += Math.round(metricStability * 0.25);

    let confidenceLevel: PredictionConfidenceLevel = 'LOW';
    if (snapshotCount >= 5 && score >= 75) {
      confidenceLevel = 'HIGH';
    } else if (snapshotCount >= 3 && score >= 50) {
      confidenceLevel = 'MEDIUM';
    } else {
      confidenceLevel = 'LOW';
    }

    limitations.push('Forecasts represent modeled engineering risk, not guaranteed software defects or balance sheet liabilities.');

    return {
      confidenceLevel,
      confidenceScore: Math.min(100, Math.max(0, score)),
      historicalSnapshotsCount: snapshotCount,
      dataCompleteness: completenessRatio,
      metricStability,
      gitHistoryQuality,
      reasons,
      limitations,
    };
  }

  /**
   * Generates uncertainty-aware range bounds (LOW, EXPECTED, HIGH) for numeric forecasts.
   * Higher uncertainty / lower confidence expands the range to prevent false precision.
   */
  static buildNumericRange(
    expected: number,
    confidence: PredictionConfidenceLevel,
    horizonMultiplier: number = 1.0,
    minBound: number = 0,
    maxBound?: number
  ): NumericForecastRange {
    if (confidence === 'INSUFFICIENT DATA') {
      return { low: expected, expected, high: expected };
    }

    // Range spread percentage based on confidence level
    let spreadPct = 0.10; // HIGH confidence: ±10%
    if (confidence === 'MEDIUM') spreadPct = 0.20; // ±20%
    else if (confidence === 'LOW') spreadPct = 0.35; // ±35%

    spreadPct *= horizonMultiplier;

    const delta = Math.max(1, Math.round(expected * spreadPct));
    let low = Math.max(minBound, expected - delta);
    let high = expected + delta;

    if (maxBound !== undefined) {
      low = Math.min(maxBound, low);
      high = Math.min(maxBound, high);
    }

    return {
      low: Math.round(low),
      expected: Math.round(expected),
      high: Math.round(high),
    };
  }

  /**
   * Formats a financial forecast into an uncertainty-aware range object.
   */
  static buildFinancialRange(
    expectedExposure: number,
    confidence: PredictionConfidenceLevel,
    horizonMultiplier: number = 1.0,
    currency: string = 'INR'
  ): FinancialForecastRange {
    const numRange = this.buildNumericRange(expectedExposure, confidence, horizonMultiplier, 0);
    const costRange = {
      low: numRange.low,
      expected: numRange.expected,
      high: numRange.high,
    };

    const formatted = CostModel.formatCurrencyRange(costRange, currency as any);

    return {
      low: numRange.low,
      expected: numRange.expected,
      high: numRange.high,
      currency,
      formattedRange: formatted,
    };
  }
}
