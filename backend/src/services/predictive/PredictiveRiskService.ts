import { ExtractedFeatureSet } from './PredictiveFeatureService';
import { ComprehensiveTrendReport } from './TrendAnalysisService';
import {
  PredictiveRiskTier,
  IPredictiveRiskDriver,
  PredictiveTrend,
} from '../../models/PredictiveAssessment';

export interface PredictiveRiskEvaluation {
  riskScore: number;
  riskLevel: PredictiveRiskTier;
  riskTrend: PredictiveTrend;
  isAccelerating: boolean;
  drivers: IPredictiveRiskDriver[];
  primaryDriverSummary: string;
  factorScores: {
    currentRiskBaseline: number;
    trendMultiplier: number;
    complexityGrowthScore: number;
    churnGrowthScore: number;
    defectActivityScore: number;
    hotspotGrowthScore: number;
    resolutionFailureScore: number;
    debtAgeScore: number;
    exposureGrowthScore: number;
  };
  weightsUsed: Record<string, number>;
  modelVersion: string;
}

export class PredictiveRiskService {
  public static readonly MODEL_VERSION = 'predictive-risk-v1';

  // Configurable transparent weights summing to 1.0
  public static readonly WEIGHTS = {
    currentRiskBaseline: 0.20,
    riskTrend: 0.18,
    complexityGrowth: 0.14,
    churnGrowth: 0.12,
    defectActivity: 0.10,
    hotspotGrowth: 0.10,
    resolutionFailure: 0.06,
    debtAge: 0.05,
    exposureGrowth: 0.05,
  };

  /**
   * Calculates a deterministic Predictive Risk Score (0-100) and risk tier.
   * Answers: "How likely is this codebase/module to become more severe?"
   */
  static evaluateRisk(
    features: ExtractedFeatureSet,
    trendReport: ComprehensiveTrendReport
  ): PredictiveRiskEvaluation {
    const snapshotCount = features.historySummary.snapshotCount.value;

    if (snapshotCount < 2) {
      return {
        riskScore: Math.round(features.debtFeatures.technicalDebtScore.value * 0.5),
        riskLevel: 'INSUFFICIENT_DATA',
        riskTrend: 'INSUFFICIENT_DATA',
        isAccelerating: false,
        drivers: [],
        primaryDriverSummary: 'Insufficient historical data (minimum 2 analysis cycles required).',
        factorScores: {
          currentRiskBaseline: features.debtFeatures.technicalDebtScore.value,
          trendMultiplier: 0,
          complexityGrowthScore: 0,
          churnGrowthScore: 0,
          defectActivityScore: 0,
          hotspotGrowthScore: 0,
          resolutionFailureScore: 0,
          debtAgeScore: 0,
          exposureGrowthScore: 0,
        },
        weightsUsed: this.WEIGHTS,
        modelVersion: this.MODEL_VERSION,
      };
    }

    // 1. Current Risk Baseline (0-100)
    const currentDebtScore = features.debtFeatures.technicalDebtScore.value;
    const currentRiskBaseline = Math.min(100, Math.max(0, currentDebtScore));

    // 2. Risk Trend Score (0-100)
    let trendScore = 40;
    if (trendReport.overallTrend === 'ACCELERATING') trendScore = 95;
    else if (trendReport.overallTrend === 'WORSENING') trendScore = 75;
    else if (trendReport.overallTrend === 'STABLE') trendScore = 40;
    else if (trendReport.overallTrend === 'DECELERATING') trendScore = 25;
    else if (trendReport.overallTrend === 'IMPROVING') trendScore = 15;

    // 3. Complexity Growth Score (0-100)
    const complexityChange = trendReport.complexityTrend.percentageChange;
    let complexityGrowthScore = 30;
    if (complexityChange > 25) complexityGrowthScore = 95;
    else if (complexityChange > 10) complexityGrowthScore = 80;
    else if (complexityChange > 0) complexityGrowthScore = 55;
    else if (complexityChange < -10) complexityGrowthScore = 15;
    else complexityGrowthScore = 30;

    // 4. Churn Growth Score (0-100)
    const churnChange = trendReport.churnTrend.percentageChange;
    let churnGrowthScore = 30;
    if (churnChange > 30) churnGrowthScore = 95;
    else if (churnChange > 15) churnGrowthScore = 80;
    else if (churnChange > 0) churnGrowthScore = 55;
    else if (churnChange < -15) churnGrowthScore = 15;
    else churnGrowthScore = 30;

    // 5. Defect Activity Score (0-100)
    const defectCount = features.gitFeatures.defectFixActivity.value;
    const defectTrendChange = trendReport.defectActivityTrend.percentageChange;
    let defectActivityScore = Math.min(100, defectCount * 15);
    if (defectTrendChange > 20) defectActivityScore = Math.min(100, defectActivityScore + 25);

    // 6. Hotspot Growth Score (0-100)
    const criticalHotspots = features.debtFeatures.criticalHotspotCount.value;
    const hotspotChange = trendReport.criticalHotspotsTrend.absoluteChange;
    let hotspotGrowthScore = Math.min(100, criticalHotspots * 20);
    if (hotspotChange > 0) hotspotGrowthScore = Math.min(100, hotspotGrowthScore + hotspotChange * 20);

    // 7. Resolution Failure Score (reopened items, verification failures)
    const reopened = features.debtFeatures.reopenedDebtCount.value;
    const verifSuccessRate = features.debtFeatures.verificationSuccessRate.value;
    const resolutionFailureScore = Math.min(100, reopened * 30 + Math.max(0, 100 - verifSuccessRate));

    // 8. Debt Age Score (stale debt becomes harder to remediate)
    const debtAgeDays = features.debtFeatures.debtAgeDays.value;
    const debtAgeScore = Math.min(100, Math.round((debtAgeDays / 90) * 100));

    // 9. Exposure Growth Score
    const exposureChange = trendReport.financialExposureTrend.percentageChange;
    let exposureGrowthScore = 30;
    if (exposureChange > 20) exposureGrowthScore = 90;
    else if (exposureChange > 5) exposureGrowthScore = 70;
    else if (exposureChange < -5) exposureGrowthScore = 15;

    // Weighted Predictive Risk Score
    const rawScore =
      currentRiskBaseline * this.WEIGHTS.currentRiskBaseline +
      trendScore * this.WEIGHTS.riskTrend +
      complexityGrowthScore * this.WEIGHTS.complexityGrowth +
      churnGrowthScore * this.WEIGHTS.churnGrowth +
      defectActivityScore * this.WEIGHTS.defectActivity +
      hotspotGrowthScore * this.WEIGHTS.hotspotGrowth +
      resolutionFailureScore * this.WEIGHTS.resolutionFailure +
      debtAgeScore * this.WEIGHTS.debtAge +
      exposureGrowthScore * this.WEIGHTS.exposureGrowth;

    const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    // Risk Acceleration Boost
    const isAccelerating = trendReport.isAcceleratingRisk || trendReport.overallTrend === 'ACCELERATING';

    // Tier Classification
    let riskLevel: PredictiveRiskTier = 'MEDIUM';
    if (riskScore >= 80 || (riskScore >= 70 && isAccelerating)) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 65 || (riskScore >= 55 && isAccelerating)) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 40) {
      riskLevel = 'MEDIUM';
    } else if (riskScore >= 20) {
      riskLevel = 'LOW';
    } else {
      riskLevel = 'STABLE';
    }

    // Drivers & Explainability
    const drivers: IPredictiveRiskDriver[] = [
      {
        feature: 'Current Debt Baseline',
        value: currentDebtScore,
        weight: this.WEIGHTS.currentRiskBaseline,
        contribution: Math.round(currentRiskBaseline * this.WEIGHTS.currentRiskBaseline),
        direction: (currentDebtScore > 60 ? 'UP' : 'NEUTRAL') as 'UP' | 'DOWN' | 'NEUTRAL',
      },
      {
        feature: 'Multi-Cycle Trend',
        value: trendReport.overallTrend,
        weight: this.WEIGHTS.riskTrend,
        contribution: Math.round(trendScore * this.WEIGHTS.riskTrend),
        direction: (trendReport.overallTrend === 'WORSENING' || isAccelerating ? 'UP' : 'DOWN') as 'UP' | 'DOWN' | 'NEUTRAL',
      },
      {
        feature: 'Complexity Growth',
        value: `${complexityChange > 0 ? '+' : ''}${complexityChange}%`,
        weight: this.WEIGHTS.complexityGrowth,
        contribution: Math.round(complexityGrowthScore * this.WEIGHTS.complexityGrowth),
        direction: (complexityChange > 5 ? 'UP' : complexityChange < -5 ? 'DOWN' : 'NEUTRAL') as 'UP' | 'DOWN' | 'NEUTRAL',
      },
      {
        feature: 'Churn Volatility',
        value: `${churnChange > 0 ? '+' : ''}${churnChange}%`,
        weight: this.WEIGHTS.churnGrowth,
        contribution: Math.round(churnGrowthScore * this.WEIGHTS.churnGrowth),
        direction: (churnChange > 5 ? 'UP' : churnChange < -5 ? 'DOWN' : 'NEUTRAL') as 'UP' | 'DOWN' | 'NEUTRAL',
      },
      {
        feature: 'Defect Activity',
        value: `${defectCount} fix patches`,
        weight: this.WEIGHTS.defectActivity,
        contribution: Math.round(defectActivityScore * this.WEIGHTS.defectActivity),
        direction: (defectCount > 2 ? 'UP' : 'NEUTRAL') as 'UP' | 'DOWN' | 'NEUTRAL',
      },
      {
        feature: 'Critical Hotspots',
        value: `${criticalHotspots} critical (${hotspotChange > 0 ? '+' : ''}${hotspotChange})`,
        weight: this.WEIGHTS.hotspotGrowth,
        contribution: Math.round(hotspotGrowthScore * this.WEIGHTS.hotspotGrowth),
        direction: (hotspotChange > 0 || criticalHotspots >= 2 ? 'UP' : 'DOWN') as 'UP' | 'DOWN' | 'NEUTRAL',
      },
      {
        feature: 'Debt Longevity',
        value: `${debtAgeDays} days avg`,
        weight: this.WEIGHTS.debtAge,
        contribution: Math.round(debtAgeScore * this.WEIGHTS.debtAge),
        direction: (debtAgeDays > 60 ? 'UP' : 'NEUTRAL') as 'UP' | 'DOWN' | 'NEUTRAL',
      },
    ].sort((a, b) => b.contribution - a.contribution);

    const primaryDriverSummary = isAccelerating
      ? `Accelerating risk driven by rapid complexity growth (${complexityChange}%) and increasing churn velocity.`
      : drivers[0]
      ? `Primary risk driver is ${drivers[0].feature} contributing ${drivers[0].contribution} pts to predictive risk.`
      : 'Predictive risk factors remain within balanced thresholds.';

    return {
      riskScore,
      riskLevel,
      riskTrend: trendReport.overallTrend,
      isAccelerating,
      drivers,
      primaryDriverSummary,
      factorScores: {
        currentRiskBaseline,
        trendMultiplier: trendScore,
        complexityGrowthScore,
        churnGrowthScore,
        defectActivityScore,
        hotspotGrowthScore,
        resolutionFailureScore,
        debtAgeScore,
        exposureGrowthScore,
      },
      weightsUsed: this.WEIGHTS,
      modelVersion: this.MODEL_VERSION,
    };
  }
}
