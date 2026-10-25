import { ExtractedFeatureSet } from './PredictiveFeatureService';
import { ComprehensiveTrendReport } from './TrendAnalysisService';
import { PredictiveRiskEvaluation } from './PredictiveRiskService';
import { ConfidenceEvaluationResult, PredictionConfidenceService } from './PredictionConfidenceService';
import {
  ForecastHorizon,
  NumericForecastRange,
  FinancialForecastRange,
  IPredictedHotspot,
  IFileRiskForecast,
  IWhatIfForecastScenario,
} from '../../models/PredictiveAssessment';
import { CostModel } from '../financial/CostModel';

export interface ForecastGenerationOptions {
  horizon: ForecastHorizon;
  currency?: string;
  hourlyRate?: number;
}

export interface HotspotInputData {
  filePath: string;
  hotspotScore: number;
  complexity: number;
  churn: number;
  defectCount?: number;
  financialExposure?: number;
  riskTier?: string;
}

export class PredictiveForecastService {
  /**
   * Translates horizon enum to multiplier and cycle step count.
   */
  public static getHorizonMultiplier(horizon: ForecastHorizon): { steps: number; spreadMultiplier: number } {
    switch (horizon) {
      case 'SHORT_TERM':
        return { steps: 3, spreadMultiplier: 1.25 };
      case 'MEDIUM_TERM':
        return { steps: 6, spreadMultiplier: 1.5 };
      case 'NEXT_ANALYSIS':
      default:
        return { steps: 1, spreadMultiplier: 1.0 };
    }
  }

  /**
   * Generates extrapolated numerical forecasts for debt score, financial exposure, and critical hotspots.
   */
  static generateForecasts(
    features: ExtractedFeatureSet,
    trendReport: ComprehensiveTrendReport,
    confidenceEval: ConfidenceEvaluationResult,
    options: ForecastGenerationOptions = { horizon: 'NEXT_ANALYSIS', currency: 'INR' }
  ): {
    predictedDebtScore: NumericForecastRange;
    predictedFinancialExposure: FinancialForecastRange;
    predictedCriticalHotspots: NumericForecastRange;
    costOfDoingNothing: {
      currentAnnualExposure: number;
      forecastedAnnualExposure: number;
      potentialIncrease: number;
      currency: string;
      formattedPotentialIncrease: string;
      rationale: string;
    };
  } {
    const { steps, spreadMultiplier } = this.getHorizonMultiplier(options.horizon);
    const currency = options.currency || 'INR';

    const currentDebtScore = features.debtFeatures.technicalDebtScore.value;
    const currentExposure = features.financialFeatures.annualExposure.value;
    const currentCriticalHotspots = features.debtFeatures.criticalHotspotCount.value;

    if (confidenceEval.confidenceLevel === 'INSUFFICIENT DATA') {
      const debtRange = { low: currentDebtScore, expected: currentDebtScore, high: currentDebtScore };
      const expRange: FinancialForecastRange = {
        low: currentExposure,
        expected: currentExposure,
        high: currentExposure,
        currency,
        formattedRange: CostModel.formatCurrencyRange(
          { low: currentExposure, expected: currentExposure, high: currentExposure },
          currency as any
        ),
      };
      const hotRange = { low: currentCriticalHotspots, expected: currentCriticalHotspots, high: currentCriticalHotspots };

      return {
        predictedDebtScore: debtRange,
        predictedFinancialExposure: expRange,
        predictedCriticalHotspots: hotRange,
        costOfDoingNothing: {
          currentAnnualExposure: currentExposure,
          forecastedAnnualExposure: currentExposure,
          potentialIncrease: 0,
          currency,
          formattedPotentialIncrease: CostModel.formatCurrencyRange(
            { low: 0, expected: 0, high: 0 },
            currency as any
          ),
          rationale: 'Insufficient historical data (minimum 2 analysis snapshots required).',
        },
      };
    }

    // 1. Debt score forecast
    // Recent slope per cycle
    const debtSlope = trendReport.debtScoreTrend.recentSlope;
    const accelerationBoost = trendReport.isAcceleratingRisk ? 1.5 : 1.0;
    const expectedDebtScore = Math.min(
      100,
      Math.max(0, Math.round(currentDebtScore + debtSlope * steps * accelerationBoost))
    );
    const predictedDebtScore = PredictionConfidenceService.buildNumericRange(
      expectedDebtScore,
      confidenceEval.confidenceLevel,
      spreadMultiplier,
      0,
      100
    );

    // 2. Financial exposure forecast
    const exposureSlope = trendReport.financialExposureTrend.recentSlope;
    let expectedExposure = Math.max(0, currentExposure + exposureSlope * steps * accelerationBoost);
    // If exposure slope is 0 or negative but debt is increasing, scale exposure with debt change ratio
    if (exposureSlope <= 0 && debtSlope > 0) {
      const debtGrowthRatio = 1 + (debtSlope * steps) / 100;
      expectedExposure = Math.round(currentExposure * debtGrowthRatio);
    }
    const predictedFinancialExposure = PredictionConfidenceService.buildFinancialRange(
      Math.round(expectedExposure),
      confidenceEval.confidenceLevel,
      spreadMultiplier,
      currency
    );

    // 3. Critical hotspots forecast
    const hotspotSlope = trendReport.criticalHotspotsTrend.recentSlope;
    const expectedHotspots = Math.max(
      0,
      Math.round(currentCriticalHotspots + hotspotSlope * steps * accelerationBoost)
    );
    const predictedCriticalHotspots = PredictionConfidenceService.buildNumericRange(
      expectedHotspots,
      confidenceEval.confidenceLevel,
      spreadMultiplier,
      0
    );

    // 4. Cost of Doing Nothing
    const potentialIncrease = Math.max(0, predictedFinancialExposure.expected - currentExposure);
    const formattedIncrease = CostModel.formatCurrencyRange(
      CostModel.calculateRange(potentialIncrease),
      currency as any
    );

    const rationale =
      potentialIncrease > 0
        ? `Modeled annual maintenance friction is forecast to increase by ${formattedIncrease} across ${steps} cycle(s) if high-risk debt hotspots remain unaddressed.`
        : 'Modeled financial exposure is projected to remain stable or improve under current development cadence.';

    return {
      predictedDebtScore,
      predictedFinancialExposure,
      predictedCriticalHotspots,
      costOfDoingNothing: {
        currentAnnualExposure: currentExposure,
        forecastedAnnualExposure: predictedFinancialExposure.expected,
        potentialIncrease,
        currency,
        formattedPotentialIncrease: formattedIncrease,
        rationale,
      },
    };
  }

  /**
   * Forecasts individual hotspot trajectory and identifies emerging critical hotspots.
   */
  static forecastHotspots(
    hotspots: HotspotInputData[],
    riskEvaluation: PredictiveRiskEvaluation,
    confidenceEval: ConfidenceEvaluationResult,
    currency: string = 'INR'
  ): IPredictedHotspot[] {
    if (hotspots.length === 0) return [];

    const isGlobalAccelerating = riskEvaluation.isAccelerating;
    const confidence = confidenceEval.confidenceLevel;

    return hotspots.map((h) => {
      const currentRisk = h.riskTier || (h.hotspotScore >= 80 ? 'CRITICAL' : h.hotspotScore >= 60 ? 'HIGH' : 'MEDIUM');
      const complexity = h.complexity || 10;
      const churn = h.churn || 100;
      const defects = h.defectCount || 0;
      const exposure = h.financialExposure || 0;

      // Predict trajectory based on high churn + complexity
      const complexityGrowthPct = isGlobalAccelerating ? 18 : 8;
      const churnGrowthPct = isGlobalAccelerating ? 25 : 12;

      let predictedRisk = currentRisk;
      let riskTrend = 'STABLE';
      const primaryDrivers: string[] = [];

      if (churn > 300 && complexity > 25) {
        primaryDrivers.push(`High churn (${churn} lines) & elevated complexity (${complexity})`);
        primaryDrivers.push(`Complexity projected +${complexityGrowthPct}%`);
        primaryDrivers.push(`Churn activity projected +${churnGrowthPct}%`);
        if (defects > 0) primaryDrivers.push(`${defects} historical defect patches`);

        if (currentRisk === 'HIGH' || currentRisk === 'MEDIUM') {
          predictedRisk = 'CRITICAL';
          riskTrend = isGlobalAccelerating ? 'ACCELERATING' : 'WORSENING';
        } else if (currentRisk === 'CRITICAL') {
          predictedRisk = 'CRITICAL';
          riskTrend = 'ACCELERATING';
        }
      } else if (churn > 150 || complexity > 15) {
        primaryDrivers.push('Moderate modification cadence');
        if (currentRisk === 'LOW') {
          predictedRisk = 'MEDIUM';
          riskTrend = 'WORSENING';
        } else if (currentRisk === 'MEDIUM') {
          predictedRisk = 'HIGH';
          riskTrend = 'WORSENING';
        }
      } else {
        primaryDrivers.push('Stable historical metrics and low churn');
        predictedRisk = currentRisk;
        riskTrend = 'STABLE';
      }

      const recommendedAction =
        predictedRisk === 'CRITICAL'
          ? 'Refactor and decouple decision branches within next sprint.'
          : predictedRisk === 'HIGH'
          ? 'Schedule targeted modularization and increase unit test coverage.'
          : 'Monitor modification frequency during routine peer reviews.';

      return {
        filePath: h.filePath,
        currentRisk,
        predictedRisk,
        riskTrend,
        confidence,
        primaryDrivers,
        complexityGrowthPct,
        churnGrowthPct,
        defectActivityCount: defects,
        financialExposure: exposure,
        recommendedAction,
      };
    });
  }

  /**
   * Generates file-level risk forecast, prioritizing files with high current risk + rapid deterioration.
   */
  static forecastFileLevelRisks(
    predictedHotspots: IPredictedHotspot[]
  ): IFileRiskForecast[] {
    const list: IFileRiskForecast[] = predictedHotspots.map((ph) => {
      const riskScoreMap: Record<string, number> = {
        CRITICAL: 90,
        HIGH: 70,
        MEDIUM: 45,
        LOW: 20,
        STABLE: 10,
        INSUFFICIENT_DATA: 0,
      };

      const curr = riskScoreMap[ph.currentRisk] || 40;
      const pred = riskScoreMap[ph.predictedRisk] || 40;
      const delta = pred - curr;
      const isDeterioratingRapidly = delta > 0 || ph.riskTrend === 'ACCELERATING';

      return {
        filePath: ph.filePath,
        currentRisk: ph.currentRisk,
        predictedRisk: ph.predictedRisk,
        riskDelta: delta,
        confidence: ph.confidence,
        isDeterioratingRapidly,
      };
    });

    // Prioritize high current risk + rapid deterioration
    return list.sort((a, b) => {
      if (a.isDeterioratingRapidly && !b.isDeterioratingRapidly) return -1;
      if (!a.isDeterioratingRapidly && b.isDeterioratingRapidly) return 1;
      return b.riskDelta - a.riskDelta;
    });
  }

  /**
   * Simulates What-If remediation scenarios against the forecast baseline.
   */
  static buildWhatIfScenarios(
    currentAnnualExposure: number,
    baselineForecastExposure: number,
    predictedHotspots: IPredictedHotspot[],
    currency: string = 'INR',
    hourlyRate: number = 2000
  ): IWhatIfForecastScenario[] {
    const topHotspots = [...predictedHotspots].sort((a, b) => b.financialExposure - a.financialExposure);

    const calculateTopSavings = (count: number) => {
      if (topHotspots.length === 0) {
        return (baselineForecastExposure || 100000) * (count <= 3 ? 0.22 : count <= 5 ? 0.35 : 0.55);
      }
      const items = topHotspots.slice(0, count);
      return items.reduce((acc, item) => acc + (item.financialExposure || hourlyRate * 20), 0) * 0.7;
    };

    const scenarios: Array<{
      name: string;
      desc: string;
      savingRatio: number;
      effortHours: number;
      riskLevel: string;
    }> = [
      {
        name: 'DO NOTHING',
        desc: 'Maintain status quo; no dedicated technical debt remediation sprints.',
        savingRatio: 0,
        effortHours: 0,
        riskLevel: 'CRITICAL',
      },
      {
        name: 'FIX TOP 3 HOTSPOTS',
        desc: 'Remediate top 3 high-churn deteriorating hotspot files.',
        savingRatio: calculateTopSavings(3) / (baselineForecastExposure || 1),
        effortHours: 48,
        riskLevel: 'HIGH',
      },
      {
        name: 'FIX TOP 5 HOTSPOTS',
        desc: 'Refactor top 5 critical and high-priority hotspots.',
        savingRatio: calculateTopSavings(5) / (baselineForecastExposure || 1),
        effortHours: 80,
        riskLevel: 'MEDIUM',
      },
      {
        name: 'FIX TOP 10 HOTSPOTS',
        desc: 'Comprehensive multi-sprint debt reduction program across top 10 hotspots.',
        savingRatio: calculateTopSavings(10) / (baselineForecastExposure || 1),
        effortHours: 160,
        riskLevel: 'LOW',
      },
      {
        name: 'REDUCE COMPLEXITY BY 30%',
        desc: 'Targeted refactoring of oversized methods and deep conditional branches.',
        savingRatio: 0.28,
        effortHours: 60,
        riskLevel: 'MEDIUM',
      },
      {
        name: 'STABILIZE VOLATILE CHURN',
        desc: 'Modularize frequently modified shared libraries to isolate feature changes.',
        savingRatio: 0.22,
        effortHours: 40,
        riskLevel: 'MEDIUM',
      },
      {
        name: 'TARGET ALL CRITICAL HOTSPOTS',
        desc: 'Eliminate 100% of currently identified and emerging critical hotspots.',
        savingRatio: 0.45,
        effortHours: 110,
        riskLevel: 'LOW',
      },
    ];

    return scenarios.map((s) => {
      const modeledReduction = Math.round(baselineForecastExposure * Math.min(0.65, s.savingRatio));
      const forecastedExposure = Math.max(0, baselineForecastExposure - modeledReduction);
      const modeledDifference = baselineForecastExposure - forecastedExposure;

      const exposureRange = {
        low: Math.round(forecastedExposure * 0.85),
        expected: forecastedExposure,
        high: Math.round(forecastedExposure * 1.15),
      };

      const formattedDiff = CostModel.formatCurrencyRange(
        CostModel.calculateRange(modeledDifference),
        currency as any
      );

      return {
        scenarioName: s.name,
        description: s.desc,
        forecastedExposure,
        exposureRange,
        modeledDifference,
        formattedDifference: formattedDiff,
        modeledRiskLevel: s.riskLevel,
        remediationEffortHours: s.effortHours,
      };
    });
  }
}
