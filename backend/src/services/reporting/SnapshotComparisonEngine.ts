import { IAnalysisSnapshot } from '../../models/AnalysisSnapshot';

export interface MetricDelta {
  metricName: string;
  before: number;
  after: number;
  delta: number;
  percentChange: number;
  direction: 'REDUCED' | 'INCREASED' | 'UNCHANGED' | 'INSUFFICIENT DATA';
  isImprovement: boolean;
}

export interface SnapshotComparisonResult {
  repositoryId: string;
  baselineSnapshotId: string;
  currentSnapshotId: string;
  baselineCommitSha: string;
  currentCommitSha: string;
  baselineDate: Date;
  currentDate: Date;
  overallStatus: 'IMPROVING' | 'WORSENING' | 'STABLE' | 'INSUFFICIENT DATA';
  deltas: {
    debtScore: MetricDelta;
    complexity: MetricDelta;
    churn: MetricDelta;
    hotspots: MetricDelta;
    criticalHotspots: MetricDelta;
    financialExposure: MetricDelta;
  };
  summarySentence: string;
}

export class SnapshotComparisonEngine {
  /**
   * Helper to compute a metric delta object.
   * For debt and risk metrics, a reduction is an improvement (lowerIsBetter = true).
   */
  private static computeDelta(
    metricName: string,
    before: number,
    after: number,
    lowerIsBetter: boolean = true
  ): MetricDelta {
    const delta = after - before;
    const percentChange = before > 0 ? Math.round((delta / before) * 1000) / 10 : 0;

    let direction: 'REDUCED' | 'INCREASED' | 'UNCHANGED' | 'INSUFFICIENT DATA' = 'UNCHANGED';
    if (delta < 0) direction = 'REDUCED';
    else if (delta > 0) direction = 'INCREASED';

    const isImprovement = lowerIsBetter ? delta < 0 : delta > 0;

    return {
      metricName,
      before,
      after,
      delta,
      percentChange,
      direction,
      isImprovement,
    };
  }

  /**
   * Compares two completed analysis snapshots and computes granular improvements.
   */
  static compareSnapshots(
    baseline: IAnalysisSnapshot,
    current: IAnalysisSnapshot
  ): SnapshotComparisonResult {
    const debtScore = this.computeDelta('Technical Debt Score', baseline.technicalDebtScore, current.technicalDebtScore, true);
    const complexity = this.computeDelta('AST Cyclomatic Complexity', baseline.complexity, current.complexity, true);
    const churn = this.computeDelta('Commit Churn', baseline.totalChurn, current.totalChurn, true);
    const hotspots = this.computeDelta('Hotspots Count', baseline.hotspotCount, current.hotspotCount, true);
    const criticalHotspots = this.computeDelta('Critical Hotspots', baseline.criticalHotspotCount, current.criticalHotspotCount, true);
    const financialExposure = this.computeDelta('Modeled Annual Financial Exposure', baseline.financialExposure, current.financialExposure, true);

    // Determine overall health trajectory
    let improvementVotes = 0;
    let worseningVotes = 0;

    [debtScore, complexity, hotspots, criticalHotspots, financialExposure].forEach((d) => {
      if (d.direction === 'REDUCED') improvementVotes++;
      else if (d.direction === 'INCREASED') worseningVotes++;
    });

    let overallStatus: 'IMPROVING' | 'WORSENING' | 'STABLE' | 'INSUFFICIENT DATA' = 'STABLE';
    if (improvementVotes > worseningVotes && improvementVotes >= 2) {
      overallStatus = 'IMPROVING';
    } else if (worseningVotes > improvementVotes && worseningVotes >= 2) {
      overallStatus = 'WORSENING';
    }

    const summarySentence =
      overallStatus === 'IMPROVING'
        ? `Debt reduction verified: Technical debt score reduced by ${Math.abs(debtScore.percentChange)}% (${baseline.technicalDebtScore} → ${current.technicalDebtScore}).`
        : overallStatus === 'WORSENING'
        ? `Debt regression observed: Technical debt score increased by ${debtScore.percentChange}% (${baseline.technicalDebtScore} → ${current.technicalDebtScore}).`
        : `Technical debt levels remained stable across analyzed commit window (${baseline.technicalDebtScore} → ${current.technicalDebtScore}).`;

    return {
      repositoryId: current.repositoryId,
      baselineSnapshotId: baseline.analysisId,
      currentSnapshotId: current.analysisId,
      baselineCommitSha: baseline.commitSha,
      currentCommitSha: current.commitSha,
      baselineDate: baseline.timestamp,
      currentDate: current.timestamp,
      overallStatus,
      deltas: {
        debtScore,
        complexity,
        churn,
        hotspots,
        criticalHotspots,
        financialExposure,
      },
      summarySentence,
    };
  }
}
