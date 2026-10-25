import { AlertEngine } from '../alerts/AlertEngine';
import {
  IPredictiveAssessment,
  IPredictedHotspot,
  IGoalForecast,
} from '../../models/PredictiveAssessment';
import { IEngineeringAlert } from '../../models/EngineeringAlert';

export class PredictiveAlertEngine {
  /**
   * Evaluates predictive assessment and generates high-value predictive alerts with duplicate suppression.
   */
  static async evaluateAndCreateAlerts(
    assessment: IPredictiveAssessment
  ): Promise<IEngineeringAlert[]> {
    const alertsCreated: IEngineeringAlert[] = [];
    const repositoryId = assessment.repositoryId;

    // 1. Accelerating debt alert
    if (assessment.riskTrend === 'ACCELERATING') {
      const alert = await AlertEngine.createAlert({
        repositoryId,
        type: 'ACCELERATING_DEBT',
        severity: 'CRITICAL',
        title: 'Accelerating Technical Debt Growth',
        message: `Technical debt deterioration is accelerating across recent analysis cycles. Current Risk Score: ${assessment.riskScore} (${assessment.riskLevel}).`,
        metric: 'technicalDebtScore',
        currentValue: assessment.riskScore,
        previousValue: assessment.currentDebtScore,
      });
      if (alert) alertsCreated.push(alert);
    }

    // 2. Risk Escalation
    if (assessment.riskLevel === 'CRITICAL' && assessment.riskTrend !== 'IMPROVING') {
      const alert = await AlertEngine.createAlert({
        repositoryId,
        type: 'RISK_ESCALATION',
        severity: 'CRITICAL',
        title: 'Predictive Engineering Risk Escalated to CRITICAL',
        message: `Repository overall predictive risk score reached ${assessment.riskScore} (CRITICAL tier). Immediate remediation recommended.`,
        metric: 'riskScore',
        currentValue: assessment.riskScore,
      });
      if (alert) alertsCreated.push(alert);
    }

    // 3. Predicted Critical Hotspot alert
    const emergingCritical = assessment.predictedHotspots?.filter(
      (h: IPredictedHotspot) => h.predictedRisk === 'CRITICAL' && (h.currentRisk === 'HIGH' || h.currentRisk === 'MEDIUM')
    );
    if (emergingCritical && emergingCritical.length > 0) {
      const target = emergingCritical[0];
      const alert = await AlertEngine.createAlert({
        repositoryId,
        type: 'PREDICTED_CRITICAL_HOTSPOT',
        severity: 'HIGH',
        title: `Predicted Critical Hotspot: ${target.filePath.split('/').pop()}`,
        message: `${target.filePath} is trending toward CRITICAL risk. Drivers: ${target.primaryDrivers.slice(0, 2).join(', ')}. Action: ${target.recommendedAction}`,
        metric: target.filePath,
      });
      if (alert) alertsCreated.push(alert);
    }

    // 4. Forecasted Exposure Increase alert
    if (assessment.costOfDoingNothing?.potentialIncrease > 0) {
      const increase = assessment.costOfDoingNothing.potentialIncrease;
      const currentExp = assessment.currentFinancialExposure || 1;
      const pctIncrease = Math.round((increase / currentExp) * 100);

      if (pctIncrease >= 15) {
        const alert = await AlertEngine.createAlert({
          repositoryId,
          type: 'FORECASTED_EXPOSURE_INCREASE',
          severity: 'HIGH',
          title: 'Projected Financial Exposure Increase',
          message: `Modeled annual maintenance drag is projected to increase by ${assessment.costOfDoingNothing.formattedPotentialIncrease} (+${pctIncrease}%) if high-risk debt remains unaddressed.`,
          metric: 'annualExposure',
          previousValue: currentExp,
          currentValue: assessment.costOfDoingNothing.forecastedAnnualExposure,
        });
        if (alert) alertsCreated.push(alert);
      }
    }

    // 5. Goal Forecast Alerts
    const missedGoals = assessment.goalForecasts?.filter(
      (g: IGoalForecast) => g.status === 'LIKELY TO MISS'
    );
    if (missedGoals && missedGoals.length > 0) {
      const g = missedGoals[0];
      const alert = await AlertEngine.createAlert({
        repositoryId,
        type: 'PREDICTED_GOAL_MISS',
        severity: 'HIGH',
        title: `Goal Projected to Miss: ${g.title}`,
        message: `Engineering goal "${g.title}" is projected to miss target due to trailing reduction velocity (${g.rationale}).`,
        metric: g.goalId,
        currentValue: g.currentProgress,
        threshold: g.requiredProgress,
      });
      if (alert) alertsCreated.push(alert);
    }

    return alertsCreated;
  }
}
