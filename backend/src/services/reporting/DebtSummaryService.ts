import { CostModel, CostRange } from '../financial/CostModel';

export interface AnalysisComparisonSummary {
  repositoryId: string;
  currency: string;
  baselineAnalysis: {
    analysisId: string;
    commitSha?: string;
    createdAt: Date | string;
    debtScore: number;
    hotspotsCount: number;
    annualExposure: number;
    formattedExposure: string;
  };
  targetAnalysis: {
    analysisId: string;
    commitSha?: string;
    createdAt: Date | string;
    debtScore: number;
    hotspotsCount: number;
    annualExposure: number;
    formattedExposure: string;
  };
  deltas: {
    debtScoreDelta: number; // target - baseline (negative = improvement)
    hotspotsDelta: number;
    annualExposureDelta: number;
    modeledReductionCostRange: CostRange;
    formattedModeledReduction: string;
    direction: 'IMPROVED' | 'DEGRADED' | 'UNCHANGED';
  };
  explanation: string;
  disclaimer: string;
}

export class DebtSummaryService {
  /**
   * Compares two completed analyses to quantify historical debt reduction or regression.
   */
  static compareAnalyses(
    baseline: {
      analysisId: string;
      commitSha?: string;
      createdAt: Date | string;
      debtScore: number;
      hotspotsCount: number;
      annualExposure: number;
    },
    target: {
      analysisId: string;
      commitSha?: string;
      createdAt: Date | string;
      debtScore: number;
      hotspotsCount: number;
      annualExposure: number;
    },
    currency: string = 'INR'
  ): AnalysisComparisonSummary {
    const debtScoreDelta = target.debtScore - baseline.debtScore;
    const hotspotsDelta = target.hotspotsCount - baseline.hotspotsCount;
    const annualExposureDelta = target.annualExposure - baseline.annualExposure;

    let direction: 'IMPROVED' | 'DEGRADED' | 'UNCHANGED' = 'UNCHANGED';
    if (debtScoreDelta < 0 || annualExposureDelta < 0) {
      direction = 'IMPROVED';
    } else if (debtScoreDelta > 0 || annualExposureDelta > 0) {
      direction = 'DEGRADED';
    }

    const baselineRange = CostModel.calculateRange(baseline.annualExposure);
    const targetRange = CostModel.calculateRange(target.annualExposure);

    // Reduction is positive if cost went down
    const reductionMagnitude = Math.abs(annualExposureDelta);
    const reductionRange = CostModel.calculateRange(reductionMagnitude);

    const explanation =
      direction === 'IMPROVED'
        ? `Codebase health improved: Technical Debt Score reduced by ${Math.abs(debtScoreDelta)} points and critical hotspots decreased by ${Math.abs(hotspotsDelta)}, representing a modeled annual friction reduction of ${CostModel.formatCurrencyRange(reductionRange, currency as any)}.`
        : direction === 'DEGRADED'
        ? `Codebase debt increased: Technical Debt Score rose by ${debtScoreDelta} points and ${hotspotsDelta} new hotspots were introduced, increasing modeled annual maintenance drag by ${CostModel.formatCurrencyRange(reductionRange, currency as any)}.`
        : 'Codebase maintainability and estimated financial drag remained steady across evaluated commits.';

    return {
      repositoryId: 'comparison',
      currency,
      baselineAnalysis: {
        analysisId: baseline.analysisId,
        commitSha: baseline.commitSha || 'baseline',
        createdAt: baseline.createdAt,
        debtScore: baseline.debtScore,
        hotspotsCount: baseline.hotspotsCount,
        annualExposure: baseline.annualExposure,
        formattedExposure: CostModel.formatCurrencyRange(baselineRange, currency as any),
      },
      targetAnalysis: {
        analysisId: target.analysisId,
        commitSha: target.commitSha || 'target',
        createdAt: target.createdAt,
        debtScore: target.debtScore,
        hotspotsCount: target.hotspotsCount,
        annualExposure: target.annualExposure,
        formattedExposure: CostModel.formatCurrencyRange(targetRange, currency as any),
      },
      deltas: {
        debtScoreDelta,
        hotspotsDelta,
        annualExposureDelta,
        modeledReductionCostRange: reductionRange,
        formattedModeledReduction: CostModel.formatCurrencyRange(reductionRange, currency as any),
        direction,
      },
      explanation,
      disclaimer:
        'Modeled debt reduction reflects software telemetry delta between commits. It represents estimated engineering capacity recovered rather than realized accounting cash flow.',
    };
  }
}
