import { IAnalysisSnapshot } from '../../models/AnalysisSnapshot';
import { PredictiveTrend } from '../../models/PredictiveAssessment';

export interface MetricTrendAnalysis {
  metricKey: string;
  metricLabel: string;
  dataPoints: number[];
  firstValue: number;
  latestValue: number;
  absoluteChange: number;
  percentageChange: number;
  recentSlope: number;
  longTermSlope: number;
  volatility: number;
  isAccelerating: boolean;
  trend: PredictiveTrend;
  direction: 'UP' | 'DOWN' | 'FLAT' | 'INSUFFICIENT_DATA';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';
  explanation: string;
}

export interface ComprehensiveTrendReport {
  overallTrend: PredictiveTrend;
  overallHealthDirection: 'IMPROVING' | 'WORSENING' | 'STABLE' | 'ACCELERATING' | 'INSUFFICIENT_DATA';
  isAcceleratingRisk: boolean;
  debtScoreTrend: MetricTrendAnalysis;
  financialExposureTrend: MetricTrendAnalysis;
  criticalHotspotsTrend: MetricTrendAnalysis;
  complexityTrend: MetricTrendAnalysis;
  churnTrend: MetricTrendAnalysis;
  defectActivityTrend: MetricTrendAnalysis;
  highPriorityDebtTrend: MetricTrendAnalysis;
  snapshotCount: number;
  summary: string;
}

export class TrendAnalysisService {
  /**
   * Evaluates trend for a series of sequential numeric observations.
   * lowerIsBetter: true for debt, cost, hotspots, complexity, defects (where increase = worsening).
   */
  static analyzeNumericSeries(
    series: number[],
    metricKey: string,
    metricLabel: string,
    lowerIsBetter: boolean = true
  ): MetricTrendAnalysis {
    const n = series.length;

    if (n === 0) {
      return {
        metricKey,
        metricLabel,
        dataPoints: [],
        firstValue: 0,
        latestValue: 0,
        absoluteChange: 0,
        percentageChange: 0,
        recentSlope: 0,
        longTermSlope: 0,
        volatility: 0,
        isAccelerating: false,
        trend: 'INSUFFICIENT_DATA',
        direction: 'INSUFFICIENT_DATA',
        confidence: 'INSUFFICIENT DATA',
        explanation: 'No historical telemetry data points available.',
      };
    }

    if (n === 1) {
      return {
        metricKey,
        metricLabel,
        dataPoints: series,
        firstValue: series[0],
        latestValue: series[0],
        absoluteChange: 0,
        percentageChange: 0,
        recentSlope: 0,
        longTermSlope: 0,
        volatility: 0,
        isAccelerating: false,
        trend: 'INSUFFICIENT_DATA',
        direction: 'FLAT',
        confidence: 'INSUFFICIENT DATA',
        explanation: 'Only 1 historical data point available. Need at least 2 for trend analysis.',
      };
    }

    const firstValue = series[0];
    const latestValue = series[n - 1];
    const absoluteChange = latestValue - firstValue;
    const percentageChange = firstValue !== 0 ? Math.round((absoluteChange / Math.abs(firstValue)) * 1000) / 10 : 0;

    // Linear regression slope across full history (long-term slope)
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += series[i];
      sumXY += i * series[i];
      sumX2 += i * i;
    }
    const longTermSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);

    // Recent slope (last 2 or 3 data points)
    const recentWindow = series.slice(-Math.min(n, 3));
    const recentDelta = recentWindow[recentWindow.length - 1] - recentWindow[0];
    const recentSlope = recentDelta / Math.max(1, recentWindow.length - 1);

    // Prior slope for acceleration detection (points before the recent window if n >= 4)
    let priorSlope = 0;
    if (n >= 4) {
      const priorWindow = series.slice(0, n - 2);
      priorSlope = (priorWindow[priorWindow.length - 1] - priorWindow[0]) / Math.max(1, priorWindow.length - 1);
    } else if (n >= 3) {
      priorSlope = series[1] - series[0];
    } else {
      priorSlope = recentSlope;
    }

    // Volatility: standard deviation of point-to-point step deltas
    const stepDeltas: number[] = [];
    for (let i = 1; i < n; i++) {
      stepDeltas.push(series[i] - series[i - 1]);
    }
    const meanDelta = stepDeltas.reduce((a, b) => a + b, 0) / stepDeltas.length;
    const variance = stepDeltas.reduce((acc, d) => acc + Math.pow(d - meanDelta, 2), 0) / stepDeltas.length;
    const volatility = Math.round(Math.sqrt(variance) * 10) / 10;

    // Acceleration check: is recent slope significantly steeper in the worsening direction?
    // For lowerIsBetter, worsening means positive slope (increasing debt).
    let isAccelerating = false;
    let isDecelerating = false;

    if (lowerIsBetter) {
      if (recentSlope > 0 && recentSlope > priorSlope * 1.25 && recentSlope >= 1) {
        isAccelerating = true;
      } else if (recentSlope > 0 && priorSlope > 0 && recentSlope < priorSlope * 0.75) {
        isDecelerating = true;
      }
    } else {
      // higher is better (e.g. test coverage, health score)
      if (recentSlope < 0 && recentSlope < priorSlope * 1.25) {
        isAccelerating = true;
      } else if (recentSlope < 0 && priorSlope < 0 && recentSlope > priorSlope * 0.75) {
        isDecelerating = true;
      }
    }

    // Determine direction
    let direction: 'UP' | 'DOWN' | 'FLAT' | 'INSUFFICIENT_DATA' = 'FLAT';
    if (Math.abs(recentSlope) < 0.2 && Math.abs(percentageChange) < 2) {
      direction = 'FLAT';
    } else if (recentSlope > 0) {
      direction = 'UP';
    } else {
      direction = 'DOWN';
    }

    // Determine trend classification
    let trend: PredictiveTrend = 'STABLE';

    if (direction === 'FLAT') {
      trend = 'STABLE';
    } else if (lowerIsBetter) {
      if (direction === 'UP') {
        trend = isAccelerating ? 'ACCELERATING' : 'WORSENING';
      } else {
        trend = isDecelerating ? 'DECELERATING' : 'IMPROVING';
      }
    } else {
      if (direction === 'UP') {
        trend = 'IMPROVING';
      } else {
        trend = isAccelerating ? 'ACCELERATING' : 'WORSENING';
      }
    }

    // Confidence based on series length and volatility
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA' = 'LOW';
    if (n >= 5 && volatility < Math.abs(latestValue) * 0.3) {
      confidence = 'HIGH';
    } else if (n >= 3) {
      confidence = 'MEDIUM';
    } else if (n === 2) {
      confidence = 'LOW';
    }

    // Explanatory sentence
    let explanation = '';
    if (trend === 'ACCELERATING') {
      explanation = `${metricLabel} deterioration is accelerating: recent cycle velocity (${Math.round(recentSlope * 10) / 10}/cycle) exceeds prior velocity (${Math.round(priorSlope * 10) / 10}/cycle).`;
    } else if (trend === 'WORSENING') {
      explanation = `${metricLabel} exhibits an upward worsening trajectory (${percentageChange > 0 ? '+' : ''}${percentageChange}% across ${n} snapshots).`;
    } else if (trend === 'IMPROVING') {
      explanation = `${metricLabel} demonstrates positive remediation trajectory (${percentageChange}% across ${n} snapshots).`;
    } else if (trend === 'DECELERATING') {
      explanation = `${metricLabel} rate of change is decelerating toward stabilization.`;
    } else {
      explanation = `${metricLabel} remains consistent and stable across recent analyses (${latestValue}).`;
    }

    return {
      metricKey,
      metricLabel,
      dataPoints: series,
      firstValue,
      latestValue,
      absoluteChange,
      percentageChange,
      recentSlope: Math.round(recentSlope * 100) / 100,
      longTermSlope: Math.round(longTermSlope * 100) / 100,
      volatility,
      isAccelerating,
      trend,
      direction,
      confidence,
      explanation,
    };
  }

  /**
   * Analyzes an array of historical snapshots and produces a comprehensive multi-metric trend report.
   */
  static analyzeSnapshots(snapshots: IAnalysisSnapshot[]): ComprehensiveTrendReport {
    // Sort chronologically ascending
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const count = sorted.length;

    if (count === 0) {
      const empty = this.analyzeNumericSeries([], 'empty', 'Empty');
      return {
        overallTrend: 'INSUFFICIENT_DATA',
        overallHealthDirection: 'INSUFFICIENT_DATA',
        isAcceleratingRisk: false,
        debtScoreTrend: empty,
        financialExposureTrend: empty,
        criticalHotspotsTrend: empty,
        complexityTrend: empty,
        churnTrend: empty,
        defectActivityTrend: empty,
        highPriorityDebtTrend: empty,
        snapshotCount: 0,
        summary: 'Insufficient historical analysis snapshots to compute predictive trends.',
      };
    }

    const debtScores = sorted.map((s) => s.technicalDebtScore ?? 50);
    const exposures = sorted.map((s) => s.financialExposure ?? 0);
    const criticalHotspots = sorted.map((s) => s.criticalHotspotCount ?? 0);
    const complexities = sorted.map((s) => s.complexity ?? 0);
    const churns = sorted.map((s) => s.totalChurn ?? 0);
    const defects = sorted.map((s) => (s.defectFixBurden ? Math.round(s.defectFixBurden / 2500) : 0));
    const highPriorities = sorted.map(
      (s) => (s.priorityDistribution?.critical || 0) + (s.priorityDistribution?.high || 0)
    );

    const debtScoreTrend = this.analyzeNumericSeries(debtScores, 'debtScore', 'Technical Debt Score', true);
    const financialExposureTrend = this.analyzeNumericSeries(exposures, 'financialExposure', 'Financial Exposure', true);
    const criticalHotspotsTrend = this.analyzeNumericSeries(criticalHotspots, 'criticalHotspots', 'Critical Hotspots', true);
    const complexityTrend = this.analyzeNumericSeries(complexities, 'complexity', 'AST Complexity', true);
    const churnTrend = this.analyzeNumericSeries(churns, 'churn', 'Commit Churn', true);
    const defectActivityTrend = this.analyzeNumericSeries(defects, 'defects', 'Defect Activity', true);
    const highPriorityDebtTrend = this.analyzeNumericSeries(highPriorities, 'highPriorityDebt', 'High Priority Debt', true);

    // Aggregate overall health direction
    const trends = [debtScoreTrend, financialExposureTrend, criticalHotspotsTrend, complexityTrend, churnTrend];
    let worseningVotes = 0;
    let improvingVotes = 0;
    let acceleratingVotes = 0;

    trends.forEach((t) => {
      if (t.trend === 'ACCELERATING') acceleratingVotes++;
      if (t.trend === 'WORSENING' || t.trend === 'ACCELERATING') worseningVotes++;
      if (t.trend === 'IMPROVING' || t.trend === 'DECELERATING') improvingVotes++;
    });

    const isAcceleratingRisk = acceleratingVotes >= 1 || debtScoreTrend.isAccelerating || criticalHotspotsTrend.isAccelerating;

    let overallTrend: PredictiveTrend = 'STABLE';
    let overallHealthDirection: 'IMPROVING' | 'WORSENING' | 'STABLE' | 'ACCELERATING' | 'INSUFFICIENT_DATA' = 'STABLE';

    if (count < 2) {
      overallTrend = 'INSUFFICIENT_DATA';
      overallHealthDirection = 'INSUFFICIENT_DATA';
    } else if (isAcceleratingRisk) {
      overallTrend = 'ACCELERATING';
      overallHealthDirection = 'ACCELERATING';
    } else if (worseningVotes > improvingVotes && worseningVotes >= 2) {
      overallTrend = 'WORSENING';
      overallHealthDirection = 'WORSENING';
    } else if (improvingVotes > worseningVotes && improvingVotes >= 2) {
      overallTrend = 'IMPROVING';
      overallHealthDirection = 'IMPROVING';
    }

    const summary =
      overallHealthDirection === 'ACCELERATING'
        ? `Accelerating Risk Detected: Multiple debt and complexity signals are deteriorating at an increasing rate across ${count} historical cycles.`
        : overallHealthDirection === 'WORSENING'
        ? `Worsening Trajectory: Technical debt and exposure metrics are trending upward across ${count} historical analyses.`
        : overallHealthDirection === 'IMPROVING'
        ? `Improving Trajectory: Technical debt and hotspot signals demonstrate steady verified reduction across ${count} analyses.`
        : count < 2
        ? `Insufficient Data: 0–1 historical analysis snapshots available. Minimum 2 required for trend detection.`
        : `Stable Trajectory: Technical debt telemetry is holding steady across ${count} historical snapshots.`;

    return {
      overallTrend,
      overallHealthDirection,
      isAcceleratingRisk,
      debtScoreTrend,
      financialExposureTrend,
      criticalHotspotsTrend,
      complexityTrend,
      churnTrend,
      defectActivityTrend,
      highPriorityDebtTrend,
      snapshotCount: count,
      summary,
    };
  }
}
