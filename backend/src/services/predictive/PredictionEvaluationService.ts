import {
  PredictionEvaluation,
  IPredictionEvaluation,
  PredictionEvaluationMetric,
} from '../../models/PredictionEvaluation';
import { IPredictiveAssessment } from '../../models/PredictiveAssessment';
import { IAnalysisSnapshot } from '../../models/AnalysisSnapshot';
import { getDatabaseStatus } from '../../config/database';

export interface AccuracyReport {
  repositoryId: string;
  totalEvaluated: number;
  overallAccuracyPercentage: number;
  meanAbsoluteError: number;
  meanAbsolutePercentageError: number;
  rangeCoveragePercentage: number;
  directionalAccuracyPercentage: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';
  metricsBreakdown: {
    debtScore: { count: number; mae: number; withinRangeRate: number };
    financialExposure: { count: number; mae: number; withinRangeRate: number };
    criticalHotspots: { count: number; mae: number; withinRangeRate: number };
  };
  evaluations: IPredictionEvaluation[];
  summary: string;
}

// In-memory fallback
const memoryEvaluations = new Map<string, IPredictionEvaluation[]>();

export class PredictionEvaluationService {
  /**
   * Compares prior predictive assessments against the newly arrived actual snapshot.
   * Records evaluations for debt score, financial exposure, and critical hotspots.
   */
  static async evaluatePredictions(
    repositoryId: string,
    priorAssessment: IPredictiveAssessment | null,
    actualSnapshot: IAnalysisSnapshot
  ): Promise<IPredictionEvaluation[]> {
    if (!priorAssessment || priorAssessment.confidence === 'INSUFFICIENT DATA') {
      return [];
    }

    const isDbConnected = getDatabaseStatus().isConnected;
    const evaluationsToCreate: Array<{
      metricName: PredictionEvaluationMetric;
      predictedValue: number;
      predictedRange: { low: number; expected: number; high: number };
      actualValue: number;
    }> = [
      {
        metricName: 'technicalDebtScore',
        predictedValue: priorAssessment.predictedDebtScore.expected,
        predictedRange: priorAssessment.predictedDebtScore,
        actualValue: actualSnapshot.technicalDebtScore ?? 50,
      },
      {
        metricName: 'financialExposure',
        predictedValue: priorAssessment.predictedFinancialExposure.expected,
        predictedRange: priorAssessment.predictedFinancialExposure,
        actualValue: actualSnapshot.financialExposure ?? 0,
      },
      {
        metricName: 'criticalHotspots',
        predictedValue: priorAssessment.predictedCriticalHotspots.expected,
        predictedRange: priorAssessment.predictedCriticalHotspots,
        actualValue: actualSnapshot.criticalHotspotCount ?? 0,
      },
    ];

    const results: IPredictionEvaluation[] = [];

    for (const item of evaluationsToCreate) {
      const pred = item.predictedValue;
      const actual = item.actualValue;
      const predError = actual - pred;
      const absError = Math.abs(predError);
      const pctError = pred > 0 ? Math.round((absError / pred) * 1000) / 10 : 0;
      const withinRange = actual >= item.predictedRange.low && actual <= item.predictedRange.high;

      const evalData = {
        repositoryId,
        assessmentId: (priorAssessment as any)._id?.toString() || priorAssessment.analysisId,
        predictionAnalysisId: priorAssessment.analysisId,
        actualAnalysisId: actualSnapshot.analysisId,
        metricName: item.metricName,
        predictedValue: pred,
        predictedRange: item.predictedRange,
        actualValue: actual,
        predictionError: predError,
        absoluteError: absError,
        percentageError: pctError,
        withinRange,
        evaluatedAt: new Date(),
        horizon: priorAssessment.forecastHorizon,
        status: 'EVALUATED' as const,
      };

      if (isDbConnected) {
        try {
          const saved = await PredictionEvaluation.create(evalData);
          results.push(saved);
          continue;
        } catch (err) {
          console.warn('[PredictionEvaluationService] MongoDB save error, falling back to memory:', err);
        }
      }

      const memDoc = {
        ...evalData,
        _id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        id: `eval-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as IPredictionEvaluation;

      const list = memoryEvaluations.get(repositoryId) || [];
      list.unshift(memDoc);
      memoryEvaluations.set(repositoryId, list);
      results.push(memDoc);
    }

    return results;
  }

  /**
   * Retrieves all evaluations for a repository.
   */
  static async getEvaluations(repositoryId: string): Promise<IPredictionEvaluation[]> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      try {
        const docs = await PredictionEvaluation.find({ repositoryId }).sort({ evaluatedAt: -1 });
        if (docs && docs.length > 0) return docs;
      } catch (err) {
        console.warn('[PredictionEvaluationService] DB find error, checking memory:', err);
      }
    }

    return memoryEvaluations.get(repositoryId) || [];
  }

  /**
   * Calculates comprehensive statistical accuracy metrics across recorded predictions.
   */
  static async computeAccuracyReport(repositoryId: string): Promise<AccuracyReport> {
    const evals = await this.getEvaluations(repositoryId);
    const n = evals.length;

    if (n === 0) {
      return {
        repositoryId,
        totalEvaluated: 0,
        overallAccuracyPercentage: 0,
        meanAbsoluteError: 0,
        meanAbsolutePercentageError: 0,
        rangeCoveragePercentage: 0,
        directionalAccuracyPercentage: 0,
        confidence: 'INSUFFICIENT DATA',
        metricsBreakdown: {
          debtScore: { count: 0, mae: 0, withinRangeRate: 0 },
          financialExposure: { count: 0, mae: 0, withinRangeRate: 0 },
          criticalHotspots: { count: 0, mae: 0, withinRangeRate: 0 },
        },
        evaluations: [],
        summary: 'No evaluated predictions available yet. Accuracy metrics will generate as future analyses arrive.',
      };
    }

    let sumAbsError = 0;
    let sumPctError = 0;
    let withinRangeCount = 0;
    let directionalMatchCount = 0;

    const breakdown: Record<PredictionEvaluationMetric, { count: number; absErrors: number[]; withinRange: number }> = {
      technicalDebtScore: { count: 0, absErrors: [], withinRange: 0 },
      financialExposure: { count: 0, absErrors: [], withinRange: 0 },
      criticalHotspots: { count: 0, absErrors: [], withinRange: 0 },
    };

    for (const e of evals) {
      sumAbsError += e.absoluteError;
      sumPctError += e.percentageError;
      if (e.withinRange) withinRangeCount++;
      // Directional match: within range, percentage error <= 25%, or absolute delta <= 5
      if (e.withinRange || e.percentageError <= 25 || Math.abs(e.predictionError) <= 5) {
        directionalMatchCount++;
      }

      const b = breakdown[e.metricName];
      if (b) {
        b.count++;
        b.absErrors.push(e.absoluteError);
        if (e.withinRange) b.withinRange++;
      }
    }

    const mae = Math.round((sumAbsError / n) * 10) / 10;
    const mape = Math.round((sumPctError / n) * 10) / 10;
    const rangeCoverage = Math.round((withinRangeCount / n) * 100);
    const directionalAccuracy = Math.round((directionalMatchCount / n) * 100);

    // Composite accuracy score: balanced combination of range coverage, directional accuracy, and bounded error
    const errorPenalty = Math.min(100, mape);
    const accuracyScore = Math.max(
      0,
      Math.round(rangeCoverage * 0.4 + directionalAccuracy * 0.4 + (100 - errorPenalty) * 0.2)
    );

    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA' = 'LOW';
    if (n >= 15) confidence = 'HIGH';
    else if (n >= 6) confidence = 'MEDIUM';

    const getBreakdown = (m: PredictionEvaluationMetric) => {
      const b = breakdown[m];
      const count = b.count;
      const bMae = count > 0 ? Math.round((b.absErrors.reduce((a, c) => a + c, 0) / count) * 10) / 10 : 0;
      const rate = count > 0 ? Math.round((b.withinRange / count) * 100) : 0;
      return { count, mae: bMae, withinRangeRate: rate };
    };

    const summary = `Prediction Accuracy: ${accuracyScore}% across ${n} evaluated forecasts (Range Coverage: ${rangeCoverage}%, Directional Accuracy: ${directionalAccuracy}%, MAE: ${mae}).`;

    return {
      repositoryId,
      totalEvaluated: n,
      overallAccuracyPercentage: accuracyScore,
      meanAbsoluteError: mae,
      meanAbsolutePercentageError: mape,
      rangeCoveragePercentage: rangeCoverage,
      directionalAccuracyPercentage: directionalAccuracy,
      confidence,
      metricsBreakdown: {
        debtScore: getBreakdown('technicalDebtScore'),
        financialExposure: getBreakdown('financialExposure'),
        criticalHotspots: getBreakdown('criticalHotspots'),
      },
      evaluations: evals,
      summary,
    };
  }

  /**
   * Clears memory store (testing).
   */
  static clearMemory(): void {
    memoryEvaluations.clear();
  }
}
