import { IEngineeringGoal } from '../../models/EngineeringGoal';
import { IAnalysisSnapshot } from '../../models/AnalysisSnapshot';
import { IGoalForecast } from '../../models/PredictiveAssessment';

export class GoalForecastEngine {
  /**
   * Forecasts the completion likelihood and trajectory for active engineering goals.
   */
  static forecastGoals(
    goals: IEngineeringGoal[],
    snapshots: IAnalysisSnapshot[]
  ): IGoalForecast[] {
    const sortedSnapshots = [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const snapshotCount = sortedSnapshots.length;

    return goals.map((goal) => {
      const goalId = (goal as any)._id?.toString() || (goal as any).id || goal.title;
      const currentVal = goal.currentValue;
      const targetVal = goal.targetValue;
      const startVal = goal.startingValue;
      const progress = goal.progressPercentage;

      if (goal.status === 'ACHIEVED') {
        return {
          goalId,
          title: goal.title,
          metric: goal.metric,
          currentProgress: 100,
          requiredProgress: 100,
          historicalVelocity: 0,
          forecastedValue: targetVal,
          status: 'ACHIEVED',
          rationale: 'Goal has successfully reached target threshold.',
        };
      }

      if (snapshotCount < 2) {
        return {
          goalId,
          title: goal.title,
          metric: goal.metric,
          currentProgress: progress,
          requiredProgress: 100,
          historicalVelocity: 0,
          forecastedValue: currentVal,
          status: 'INSUFFICIENT DATA',
          rationale: 'Insufficient snapshot history to compute reduction velocity.',
        };
      }

      // Compute historical trajectory of this specific goal metric across snapshots
      const getSnapshotMetricValue = (snap: IAnalysisSnapshot): number => {
        switch (goal.metric) {
          case 'CRITICAL_HOTSPOTS':
            return snap.criticalHotspotCount ?? 0;
          case 'TECHNICAL_DEBT_SCORE':
            return snap.technicalDebtScore ?? 50;
          case 'ANNUAL_EXPOSURE':
            return snap.financialExposure ?? 0;
          case 'HIGH_PRIORITY_DEBT':
            return (snap.priorityDistribution?.critical || 0) + (snap.priorityDistribution?.high || 0);
          case 'AVERAGE_COMPLEXITY':
            return snap.complexity ?? 0;
          default:
            return snap.technicalDebtScore ?? 50;
        }
      };

      const metricHistory = sortedSnapshots.map(getSnapshotMetricValue);
      const recentWindow = metricHistory.slice(-Math.min(snapshotCount, 4));
      const velocityPerCycle = (recentWindow[recentWindow.length - 1] - recentWindow[0]) / Math.max(1, recentWindow.length - 1);

      // Time pacing: how far along is the goal duration?
      const now = Date.now();
      const startTime = new Date(goal.startDate || (goal as any).createdAt || now).getTime();
      const targetTime = new Date(goal.targetDate).getTime();
      const totalGoalTime = Math.max(1, targetTime - startTime);
      const elapsedGoalTime = Math.max(0, now - startTime);
      const timePacingRatio = Math.min(1.0, elapsedGoalTime / totalGoalTime);

      const requiredProgressAtNow = Math.round(timePacingRatio * 100);

      // Decreasing metric (e.g. debt score, critical hotspots)
      const isDecreasing = startVal > targetVal;
      let forecastedValueAtHorizon = currentVal;
      let status: 'ON TRACK' | 'AT RISK' | 'LIKELY TO MISS' | 'ACHIEVABLE' | 'ACHIEVED' | 'INSUFFICIENT DATA' = 'ON TRACK';
      let rationale = '';

      // Project 3 cycles ahead based on velocity
      const projectedDelta = velocityPerCycle * 3;
      forecastedValueAtHorizon = Math.max(0, Math.round(currentVal + projectedDelta));

      if (isDecreasing) {
        // Goal requires value to go down (velocity should be negative)
        if (velocityPerCycle < 0) {
          // Making positive reduction progress
          if (progress >= requiredProgressAtNow) {
            status = 'ON TRACK';
            rationale = `On track: Progress (${progress}%) leads target pacing (${requiredProgressAtNow}%). Reduction velocity: ${Math.abs(Math.round(velocityPerCycle * 10) / 10)} ${goal.unit}/cycle.`;
          } else {
            status = 'AT RISK';
            rationale = `At risk: Progress (${progress}%) is trailing planned timeline pace (${requiredProgressAtNow}%).`;
          }
        } else if (velocityPerCycle > 0) {
          // Regressing (metric increasing instead of decreasing)
          status = 'LIKELY TO MISS';
          rationale = `Likely to miss: Metric is currently regressing (+${Math.round(velocityPerCycle * 10) / 10} ${goal.unit}/cycle) instead of decreasing toward ${targetVal}.`;
        } else {
          // Stagnant
          if (progress >= 80) status = 'ACHIEVABLE';
          else status = 'AT RISK';
          rationale = `Stagnant velocity across recent cycles. Value remains at ${currentVal} ${goal.unit}.`;
        }
      } else {
        // Goal requires value to go up
        if (velocityPerCycle > 0) {
          if (progress >= requiredProgressAtNow) {
            status = 'ON TRACK';
            rationale = `On track: Velocity is positive (+${Math.round(velocityPerCycle * 10) / 10} ${goal.unit}/cycle).`;
          } else {
            status = 'AT RISK';
            rationale = `At risk: Trailing required schedule pacing (${requiredProgressAtNow}%).`;
          }
        } else {
          status = 'LIKELY TO MISS';
          rationale = 'Likely to miss: Velocity is flat or declining.';
        }
      }

      return {
        goalId,
        title: goal.title,
        metric: goal.metric,
        currentProgress: progress,
        requiredProgress: requiredProgressAtNow,
        historicalVelocity: Math.round(velocityPerCycle * 100) / 100,
        forecastedValue: forecastedValueAtHorizon,
        status,
        rationale,
      };
    });
  }
}
