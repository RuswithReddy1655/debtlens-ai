import { CostModel, CostRange } from './CostModel';

export interface ROIMetrics {
  refactoringInvestment: number;
  investmentRange: CostRange;
  potentialAnnualSavings: number;
  savingsRange: CostRange;
  twoYearGrossBenefit: number;
  twoYearNetSavings: number;
  netSavingsRange: CostRange;
  roiPercentage: number;
  paybackPeriodMonths: number | null;
  evaluationWindowYears: number;
  isViable: boolean;
  explanation: string;
}

export class ROICalculator {
  /**
   * Calculates comprehensive ROI and payback metrics.
   * Handles edge cases (zero investment, zero savings) gracefully.
   */
  static calculateROI(params: {
    refactoringInvestment: number;
    potentialAnnualSavings: number;
    evaluationWindowYears?: number;
  }): ROIMetrics {
    const investment = Math.max(0, Math.round(params.refactoringInvestment));
    const annualSavings = Math.max(0, Math.round(params.potentialAnnualSavings));
    const windowYears = params.evaluationWindowYears ?? 2;

    const twoYearGrossBenefit = Math.round(annualSavings * windowYears);
    const twoYearNetSavings = Math.round(twoYearGrossBenefit - investment);

    // Edge case: zero investment
    if (investment === 0) {
      return {
        refactoringInvestment: 0,
        investmentRange: CostModel.calculateRange(0),
        potentialAnnualSavings: annualSavings,
        savingsRange: CostModel.calculateRange(annualSavings),
        twoYearGrossBenefit,
        twoYearNetSavings,
        netSavingsRange: CostModel.calculateRange(twoYearNetSavings),
        roiPercentage: annualSavings > 0 ? 100 : 0,
        paybackPeriodMonths: 0,
        evaluationWindowYears: windowYears,
        isViable: annualSavings > 0,
        explanation: 'Zero refactoring investment required. Any prevented drag represents direct operational efficiency.',
      };
    }

    // Edge case: zero savings
    if (annualSavings === 0) {
      return {
        refactoringInvestment: investment,
        investmentRange: CostModel.calculateRange(investment),
        potentialAnnualSavings: 0,
        savingsRange: CostModel.calculateRange(0),
        twoYearGrossBenefit: 0,
        twoYearNetSavings: -investment,
        netSavingsRange: CostModel.calculateRange(-investment),
        roiPercentage: -100,
        paybackPeriodMonths: null,
        evaluationWindowYears: windowYears,
        isViable: false,
        explanation: 'No measurable annual savings modeled; investment cannot be recouped within operational lifecycle.',
      };
    }

    // Standard ROI calculation: ((GrossBenefit - Investment) / Investment) * 100
    const roiPercentage = Number((((twoYearGrossBenefit - investment) / investment) * 100).toFixed(1));

    // Payback period (months): Investment / (AnnualSavings / 12)
    const monthlySavings = annualSavings / 12;
    const paybackPeriodMonths =
      monthlySavings > 0
        ? Number((investment / monthlySavings).toFixed(1))
        : null;

    const isViable = twoYearNetSavings > 0 && (paybackPeriodMonths !== null && paybackPeriodMonths <= (windowYears * 12));

    const explanation = isViable
      ? `Investment of ${investment} is recouped in ${paybackPeriodMonths} months, yielding a ${roiPercentage}% net return over ${windowYears} years.`
      : `Payback period (${paybackPeriodMonths} months) exceeds the ${windowYears}-year evaluation window; consider selective refactoring.`;

    return {
      refactoringInvestment: investment,
      investmentRange: CostModel.calculateRange(investment),
      potentialAnnualSavings: annualSavings,
      savingsRange: CostModel.calculateRange(annualSavings),
      twoYearGrossBenefit,
      twoYearNetSavings,
      netSavingsRange: CostModel.calculateRange(twoYearNetSavings),
      roiPercentage,
      paybackPeriodMonths,
      evaluationWindowYears: windowYears,
      isViable,
      explanation,
    };
  }
}
