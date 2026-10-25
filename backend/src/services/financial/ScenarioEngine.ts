import { CostModel, CostRange, FinancialAssumptions } from './CostModel';
import { SavingsEngine } from './SavingsEngine';
import { ROICalculator } from './ROICalculator';

export interface ScenarioDefinition {
  scenarioName: string;
  selectedFilePaths: string[];
  hourlyRate?: number;
  remediationEffectiveness?: number; // 0.1 to 1.0
  effortMultiplier?: number; // 0.5 to 2.0
}

export interface ScenarioResult {
  scenarioName: string;
  selectedFilesCount: number;
  selectedFilePaths: string[];
  currency: string;
  hourlyRate: number;
  remediationEffectiveness: number;
  estimatedRefactoringHours: number;
  refactoringInvestment: number;
  investmentRange: CostRange;
  currentAnnualImpact: number;
  currentCostRange: CostRange;
  potentialAnnualSavings: number;
  savingsRange: CostRange;
  residualAnnualImpact: number;
  residualCostRange: CostRange;
  twoYearNetSavings: number;
  netSavingsRange: CostRange;
  roiPercentage: number;
  paybackPeriodMonths: number | null;
  projectedDebtScoreReduction: number;
  projectedResidualDebtScore: number;
  isViable: boolean;
  explanation: string;
}

export interface ScenarioComparison {
  analysisId: string;
  baselineAnnualImpact: number;
  baselineDebtScore: number;
  currency: string;
  scenarios: ScenarioResult[];
}

export class ScenarioEngine {
  /**
   * Evaluates a custom what-if scenario against repository file metrics and hotspots.
   */
  static evaluateScenario(
    fileMetrics: any[],
    hotspots: any[],
    overallDebtScore: number,
    scenario: ScenarioDefinition,
    assumptions: FinancialAssumptions
  ): ScenarioResult {
    const rate = scenario.hourlyRate && scenario.hourlyRate > 0 ? scenario.hourlyRate : assumptions.hourlyRate;
    const effectiveness = scenario.remediationEffectiveness ?? assumptions.defaultRemediationEffectiveness;
    const effortMult = scenario.effortMultiplier ?? 1.0;

    // Filter file metrics to selected paths
    const selectedFiles = fileMetrics.filter((f) =>
      scenario.selectedFilePaths.includes(f.filePath)
    );

    // If none matched, default to top hotspots
    const targetFiles = selectedFiles.length > 0 ? selectedFiles : fileMetrics.slice(0, 5);
    const selectedPaths = targetFiles.map((f) => f.filePath);

    // Calculate remediation hours and investment for selected files
    let totalRefactorHours = 0;
    let targetAnnualImpact = 0;
    let targetDebtScoreSum = 0;

    for (const f of targetFiles) {
      const codeLines = f.codeLines ?? f.linesOfCode ?? 100;
      const complexity = f.cyclomaticComplexity ?? 5;
      const debtScore = f.debtScore ?? 50;

      // Estimated refactoring hours per file: (LoC / 80) * (Complexity / 15) * (DebtScore / 50)
      const fileHours = Math.max(
        4,
        Math.round((codeLines / 80) * (complexity / 15) * (debtScore / 50) * effortMult)
      );
      totalRefactorHours += fileHours;

      // Annual maintenance impact contribution from this file
      const isHotspot = hotspots.some((h) => h.filePath === f.filePath);
      const maintHours = isHotspot ? assumptions.averageMaintenanceHoursCritical : assumptions.averageMaintenanceHoursMedium;
      const defectHours = (f.defectFixCommitCount ?? 0) * assumptions.defectFixHoursHeuristic;
      const changeHours = Math.round(((f.totalChurn ?? 0) / 40) * assumptions.changeFrictionMultiplier);
      const fileAnnualCost = Math.round((maintHours + defectHours + changeHours) * rate);

      targetAnnualImpact += fileAnnualCost;
      targetDebtScoreSum += debtScore;
    }

    const refactoringInvestment = Math.round(totalRefactorHours * rate);

    // Modeled annual savings
    const savings = SavingsEngine.calculateSavings(targetAnnualImpact, effectiveness);

    // ROI & Payback
    const roi = ROICalculator.calculateROI({
      refactoringInvestment,
      potentialAnnualSavings: savings.potentialAnnualSavings,
      evaluationWindowYears: assumptions.evaluationWindowYears,
    });

    // Projected debt score reduction
    const avgTargetDebt = targetFiles.length > 0 ? targetDebtScoreSum / targetFiles.length : 0;
    const debtWeightRatio = Math.min(0.6, targetFiles.length / Math.max(1, fileMetrics.length));
    const debtReduction = Math.round(avgTargetDebt * effectiveness * debtWeightRatio);
    const residualDebt = Math.max(10, Math.round(overallDebtScore - debtReduction));

    return {
      scenarioName: scenario.scenarioName,
      selectedFilesCount: targetFiles.length,
      selectedFilePaths: selectedPaths,
      currency: assumptions.currency,
      hourlyRate: rate,
      remediationEffectiveness: effectiveness,
      estimatedRefactoringHours: totalRefactorHours,
      refactoringInvestment,
      investmentRange: CostModel.calculateRange(refactoringInvestment),
      currentAnnualImpact: targetAnnualImpact,
      currentCostRange: savings.currentCostRange,
      potentialAnnualSavings: savings.potentialAnnualSavings,
      savingsRange: savings.savingsRange,
      residualAnnualImpact: savings.residualAnnualImpact,
      residualCostRange: savings.residualCostRange,
      twoYearNetSavings: roi.twoYearNetSavings,
      netSavingsRange: roi.netSavingsRange,
      roiPercentage: roi.roiPercentage,
      paybackPeriodMonths: roi.paybackPeriodMonths,
      projectedDebtScoreReduction: debtReduction,
      projectedResidualDebtScore: residualDebt,
      isViable: roi.isViable,
      explanation: `Remediating ${targetFiles.length} file(s) with ${Math.round(effectiveness * 100)}% effectiveness yields ${roi.twoYearNetSavings} net savings in 24 months.`,
    };
  }

  /**
   * Generates a 3-way comparative scenario matrix (Top 5 Quick Wins vs Top 10 Strategic vs All Hotspots).
   */
  static comparePresets(
    analysisId: string,
    fileMetrics: any[],
    hotspots: any[],
    overallDebtScore: number,
    assumptions: FinancialAssumptions,
    customRate?: number
  ): ScenarioComparison {
    const rate = customRate && customRate > 0 ? customRate : assumptions.hourlyRate;
    const sortedHotspotPaths = hotspots.map((h) => h.filePath);

    // Fallback to top debt score files if hotspots array is small
    const sortedMetricPaths = [...fileMetrics]
      .sort((a, b) => (b.debtScore || 0) - (a.debtScore || 0))
      .map((f) => f.filePath);

    const candidatePaths = Array.from(new Set([...sortedHotspotPaths, ...sortedMetricPaths]));

    const presetA: ScenarioDefinition = {
      scenarioName: 'Scenario A: Top 5 Quick Wins',
      selectedFilePaths: candidatePaths.slice(0, 5),
      hourlyRate: rate,
      remediationEffectiveness: 0.65,
      effortMultiplier: 0.9,
    };

    const presetB: ScenarioDefinition = {
      scenarioName: 'Scenario B: Top 10 High-Impact Hotspots',
      selectedFilePaths: candidatePaths.slice(0, 10),
      hourlyRate: rate,
      remediationEffectiveness: 0.75,
      effortMultiplier: 1.0,
    };

    const presetC: ScenarioDefinition = {
      scenarioName: 'Scenario C: Comprehensive Hotspot Remediation',
      selectedFilePaths: candidatePaths.slice(0, 20),
      hourlyRate: rate,
      remediationEffectiveness: 0.85,
      effortMultiplier: 1.15,
    };

    const resultA = this.evaluateScenario(fileMetrics, hotspots, overallDebtScore, presetA, assumptions);
    const resultB = this.evaluateScenario(fileMetrics, hotspots, overallDebtScore, presetB, assumptions);
    const resultC = this.evaluateScenario(fileMetrics, hotspots, overallDebtScore, presetC, assumptions);

    // Baseline annual impact across all files
    const totalBaselineImpact = fileMetrics.reduce((acc, f) => {
      const isH = hotspots.some((h) => h.filePath === f.filePath);
      const mHours = isH ? assumptions.averageMaintenanceHoursCritical : assumptions.averageMaintenanceHoursMedium;
      return acc + Math.round(mHours * rate);
    }, 0);

    return {
      analysisId,
      baselineAnnualImpact: totalBaselineImpact,
      baselineDebtScore: overallDebtScore,
      currency: assumptions.currency,
      scenarios: [resultA, resultB, resultC],
    };
  }
}
