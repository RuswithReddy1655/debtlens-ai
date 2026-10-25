import { CostModel, CostRange } from './CostModel';

export interface SavingsEstimate {
  currentAnnualImpact: number;
  currentCostRange: CostRange;
  potentialAnnualSavings: number;
  savingsRange: CostRange;
  residualAnnualImpact: number;
  residualCostRange: CostRange;
  remediationEffectiveness: number;
  explanation: string;
}

export class SavingsEngine {
  /**
   * Calculates potential annual savings given current annual impact and remediation effectiveness.
   */
  static calculateSavings(
    currentAnnualImpact: number,
    remediationEffectiveness: number = 0.65
  ): SavingsEstimate {
    const safeImpact = Math.max(0, currentAnnualImpact);
    const effectiveness = Math.min(1.0, Math.max(0.1, remediationEffectiveness));

    const potentialSavings = Math.round(safeImpact * effectiveness);
    const residualImpact = Math.max(0, safeImpact - potentialSavings);

    return {
      currentAnnualImpact: safeImpact,
      currentCostRange: CostModel.calculateRange(safeImpact),
      potentialAnnualSavings: potentialSavings,
      savingsRange: CostModel.calculateRange(potentialSavings),
      residualAnnualImpact: residualImpact,
      residualCostRange: CostModel.calculateRange(residualImpact),
      remediationEffectiveness: effectiveness,
      explanation: `Modeled ${(effectiveness * 100).toFixed(0)}% reduction in recurring maintenance friction through targeted debt remediation.`,
    };
  }
}
