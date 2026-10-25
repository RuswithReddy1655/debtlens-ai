import {
  FileDebtScore,
  FinancialCostEngine,
  FinancialValuation,
} from '../analyzers/interfaces';

export class DefaultFinancialCostEngine implements FinancialCostEngine {
  private defaultHourlyRate: number;

  constructor(defaultHourlyRate: number = 95) {
    this.defaultHourlyRate = defaultHourlyRate;
  }

  async calculateValuation(
    debtScores: FileDebtScore[],
    hourlyRate?: number
  ): Promise<FinancialValuation> {
    const rate = hourlyRate && hourlyRate > 0 ? hourlyRate : this.defaultHourlyRate;

    // 1. Estimated Remediation Investment
    // Formula: Sum(debtHours for each file) * engineeringHourlyRate
    const totalRemediationHours = debtScores.reduce((acc, f) => acc + (f.debtHours || 0), 0);
    const totalRemediationCost = Math.round(totalRemediationHours * rate);

    const remediationTrace = {
      input: {
        totalRemediationHours,
        engineeringHourlyRate: rate,
        fileCountAnalyzed: debtScores.length,
      },
      formula: 'RemediationCost = totalRemediationHours * engineeringHourlyRate',
      result: totalRemediationCost,
      explanation:
        'Direct capital investment required to refactor accumulated code debt across identified files to standard maintainability thresholds.',
    };

    // 2. Historical Maintenance & Rework Burden
    // Heuristic Formula: Sum of rework burden based on churn and defect scores
    // Each high-debt file has generated recurring friction in past sprints.
    const historicalReworkHours = debtScores.reduce((acc, f) => {
      // Historical drag: proportional to churn and defect score
      const dragFactor = (f.components.churnScore * 0.5 + f.components.defectScore * 0.5) / 100;
      return acc + Math.round((f.debtHours * 1.4) * dragFactor);
    }, 0);
    const historicalReworkCost = Math.round(historicalReworkHours * rate);

    const historicalTrace = {
      input: {
        historicalReworkHours,
        engineeringHourlyRate: rate,
      },
      formula: 'HistoricalBurden = historicalReworkHours * engineeringHourlyRate',
      result: historicalReworkCost,
      explanation:
        'Estimated engineering expenditure already consumed over previous cycles by repeated bug fixes, regression triage, and high friction modifications.',
    };

    // 3. Estimated Future Avoidable Cost (12-Month Projection)
    // Formula: Projected ongoing friction if debt remains unaddressed.
    const riskyFiles = debtScores.filter(
      (f) => f.riskCategory === 'critical' || f.riskCategory === 'high' || f.riskCategory === 'medium'
    );
    const projectedAnnualHoursWasted = debtScores.reduce((acc, f) => {
      if (f.riskCategory === 'critical') return acc + 38;
      if (f.riskCategory === 'high') return acc + 18;
      if (f.riskCategory === 'medium') return acc + 6;
      return acc;
    }, 0);
    const projectedAnnualCost = Math.round(projectedAnnualHoursWasted * rate);

    const futureTrace = {
      input: {
        riskyFileCount: riskyFiles.length,
        projectedAnnualHoursWasted,
        engineeringHourlyRate: rate,
      },
      formula: 'AvoidableAnnualCost = projectedAnnualHoursWasted * engineeringHourlyRate',
      result: projectedAnnualCost,
      explanation:
        'Projected financial loss over the next 12 months in slowed feature delivery, friction overhead, and avoidable defect patches if debt is neglected.',
    };

    // 4. Potential Refactoring Benefit (Net Savings & ROI)
    // Formula: (AvoidableAnnualCost * 2-year lifespan) - RemediationCost
    const twoYearAvoidedCost = projectedAnnualCost * 2;
    const netSavings = Math.max(0, twoYearAvoidedCost - totalRemediationCost);
    const roiRatio =
      totalRemediationCost > 0
        ? Number(((twoYearAvoidedCost / totalRemediationCost)).toFixed(2))
        : 1.0;
    // Payback period (months) = (RemediationCost / (AvoidableAnnualCost / 12))
    const monthlyAvoidedSavings = projectedAnnualCost / 12;
    const paybackMonths =
      monthlyAvoidedSavings > 0
        ? Math.max(1, Math.round((totalRemediationCost / monthlyAvoidedSavings) * 10) / 10)
        : 12;

    const benefitTrace = {
      input: {
        totalRemediationCost,
        projectedAnnualAvoidableCost: projectedAnnualCost,
        evaluationWindowYears: 2,
      },
      formula:
        'NetSavings = (AvoidableAnnualCost * 2) - RemediationCost; ROI = (AvoidableAnnualCost * 2) / RemediationCost',
      result: netSavings,
      explanation:
        'Projected net return on refactoring investment over a 24-month operational lifecycle, accounting for prevented maintenance costs.',
    };

    return {
      currency: 'USD',
      hourlyRate: rate,
      estimatedRemediationInvestment: {
        totalHours: totalRemediationHours,
        totalCost: totalRemediationCost,
        trace: remediationTrace,
      },
      historicalMaintenanceReworkBurden: {
        totalHours: historicalReworkHours,
        totalCost: historicalReworkCost,
        trace: historicalTrace,
      },
      estimatedFutureAvoidableCost: {
        projectedAnnualCost,
        trace: futureTrace,
      },
      potentialRefactoringBenefit: {
        netSavings,
        roiRatio,
        paybackMonths,
        trace: benefitTrace,
      },
      disclaimer:
        'Model-based financial estimates are predictive indicators based on engineering economics heuristics and historical repository metrics, not exact balance sheet accounting losses.',
    };
  }
}
