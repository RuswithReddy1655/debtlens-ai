import {
  CostModel,
  CostRange,
  FinancialAssumptions,
  ConfidenceLevel,
  CurrencyCode,
} from './CostModel';
import { CostDriverEngine, CostDriverBreakdown } from './CostDriverEngine';
import { FinancialTraceService, FinancialTrace } from './FinancialTraceService';
import { SavingsEngine } from './SavingsEngine';
import { ROICalculator } from './ROICalculator';

export interface FinancialIntelligenceSummary {
  analysisId: string;
  repositoryId: string;
  currency: CurrencyCode;
  currencySymbol: string;
  hourlyRate: number;
  modelVersion: string;
  confidence: ConfidenceLevel;
  summary: {
    totalAnnualExposure: number;
    annualExposureRange: CostRange;
    formattedAnnualExposure: string;
    remediationInvestment: number;
    investmentRange: CostRange;
    formattedInvestment: string;
    historicalReworkBurden: number;
    historicalReworkRange: CostRange;
    formattedHistoricalRework: string;
    potentialAnnualSavings: number;
    savingsRange: CostRange;
    formattedSavings: string;
    twoYearNetBenefit: number;
    netBenefitRange: CostRange;
    formattedNetBenefit: string;
    roiPercentage: number;
    paybackPeriodMonths: number | null;
  };
  fourQuadrants: {
    estimatedRemediationInvestment: {
      totalHours: number;
      totalCost: number;
      costRange: CostRange;
      trace: FinancialTrace;
    };
    historicalMaintenanceReworkBurden: {
      totalHours: number;
      totalCost: number;
      costRange: CostRange;
      trace: FinancialTrace;
    };
    estimatedFutureAvoidableCost: {
      projectedAnnualHours: number;
      projectedAnnualCost: number;
      costRange: CostRange;
      trace: FinancialTrace;
    };
    potentialRefactoringBenefit: {
      netSavings: number;
      roiPercentage: number;
      paybackPeriodMonths: number | null;
      costRange: CostRange;
      trace: FinancialTrace;
    };
  };
  costDrivers: CostDriverBreakdown;
  assumptions: FinancialAssumptions;
  disclaimer: string;
  economicDisclaimer: string;
}

export class FinancialIntelligenceEngine {
  /**
   * Generates comprehensive, audit-traceable Financial Intelligence for an analysis.
   */
  static generateIntelligence(params: {
    analysisId: string;
    repositoryId: string;
    fileMetrics: any[];
    hotspots: any[];
    overallDebtScore: number;
    totalCommits?: number;
    isDemo?: boolean;
    overrides?: Partial<FinancialAssumptions>;
  }): FinancialIntelligenceSummary {
    const assumptions = CostModel.resolveAssumptions(params.overrides);
    const rate = assumptions.hourlyRate;
    const currency = assumptions.currency;

    // 1. Evaluate Confidence
    const astCount = params.fileMetrics.filter(
      (f) => f.cyclomaticComplexity !== null && f.cyclomaticComplexity !== undefined
    ).length;
    const defectSignalsFound = params.fileMetrics.some(
      (f) => (f.defectFixCommitCount ?? 0) > 0
    );
    const confidence = CostModel.evaluateConfidence({
      totalCommits: params.totalCommits ?? 10,
      totalFiles: params.fileMetrics.length,
      astSupportedCount: astCount,
      defectSignalsFound,
      isDemo: params.isDemo,
    });

    // 2. Cost Drivers Breakdown
    const costDrivers = CostDriverEngine.calculateCostDrivers(
      params.fileMetrics,
      params.hotspots,
      assumptions
    );

    // 3. Quadrant 1: Estimated Remediation Investment
    const totalRemediationHours = params.fileMetrics.reduce((acc, f) => {
      const codeLines = f.codeLines ?? f.linesOfCode ?? 80;
      const complexity = f.cyclomaticComplexity ?? 5;
      const debtScore = f.debtScore ?? 50;
      const hours = Math.round((codeLines / 80) * (complexity / 15) * (debtScore / 50));
      return acc + Math.max(2, hours);
    }, 0);
    const totalRemediationCost = Math.round(totalRemediationHours * rate);
    const remediationRange = CostModel.calculateRange(totalRemediationCost);

    const remediationTrace = FinancialTraceService.createTrace({
      metric: 'Estimated Remediation Investment',
      category: 'remediation',
      inputs: [
        { name: 'Total Remediation Hours', value: totalRemediationHours, unit: 'hours' },
        { name: 'Loaded Engineering Rate', value: rate, unit: `${currency}/hour` },
        { name: 'Files Analyzed', value: params.fileMetrics.length, unit: 'files' },
      ],
      formula: 'RemediationCost = totalRemediationHours × engineeringHourlyRate',
      estimatedValue: totalRemediationCost,
      range: remediationRange,
      currency,
      confidence,
      explanation:
        'Capital expenditure required to refactor accumulated code debt across analyzed files down to standard maintainability thresholds.',
    });

    // 4. Quadrant 2: Historical Maintenance & Rework Burden
    const historicalReworkHours = params.fileMetrics.reduce((acc, f) => {
      const churnFactor = Math.min(1.0, (f.totalChurn ?? 0) / 400);
      const defectFactor = Math.min(1.0, (f.defectFixCommitCount ?? 0) / 4);
      const combinedFriction = churnFactor * 0.5 + defectFactor * 0.5;
      const baseHours = Math.round((f.debtHours ?? 10) * 1.4);
      return acc + Math.round(baseHours * Math.max(0.2, combinedFriction));
    }, 0);
    const historicalReworkCost = Math.round(historicalReworkHours * rate);
    const historicalRange = CostModel.calculateRange(historicalReworkCost);

    const historicalTrace = FinancialTraceService.createTrace({
      metric: 'Historical Maintenance & Rework Burden',
      category: 'historical_burden',
      inputs: [
        { name: 'Historical Friction Hours', value: historicalReworkHours, unit: 'hours' },
        { name: 'Loaded Engineering Rate', value: rate, unit: `${currency}/hour` },
      ],
      formula: 'HistoricalBurden = historicalReworkHours × engineeringHourlyRate',
      estimatedValue: historicalReworkCost,
      range: historicalRange,
      currency,
      confidence,
      explanation:
        'Estimated engineering expenditure already consumed in past sprints on bug triage, regression patches, and volatile file modifications.',
    });

    // 5. Quadrant 3: Estimated Future Avoidable Cost (12-Month Drag)
    const annualHoursAvoidable = params.fileMetrics.reduce((acc, f) => {
      const isCritical = params.hotspots.some(
        (h) => h.filePath === f.filePath && (h.riskLevel === 'critical' || h.riskLevel === 'high')
      );
      if (isCritical) return acc + assumptions.averageMaintenanceHoursCritical;
      if (f.debtScore && f.debtScore >= 50) return acc + assumptions.averageMaintenanceHoursHigh;
      return acc + assumptions.averageMaintenanceHoursMedium;
    }, 0);
    const projectedAnnualCost = Math.round(annualHoursAvoidable * rate);
    const avoidableRange = CostModel.calculateRange(projectedAnnualCost);

    const futureTrace = FinancialTraceService.createTrace({
      metric: 'Estimated Future Avoidable Cost',
      category: 'avoidable_cost',
      inputs: [
        { name: 'Projected Avoidable Hours', value: annualHoursAvoidable, unit: 'hours/year' },
        { name: 'Engineering Rate', value: rate, unit: `${currency}/hour` },
        { name: 'Critical Hotspot Files', value: params.hotspots.length, unit: 'files' },
      ],
      formula: 'AvoidableAnnualCost = projectedAnnualHours × engineeringHourlyRate',
      estimatedValue: projectedAnnualCost,
      range: avoidableRange,
      currency,
      confidence,
      explanation:
        'Projected financial drag over the next 12 months in slowed feature delivery, onboarding cognitive friction, and recurring defect patches if code is neglected.',
    });

    // 6. Quadrant 4: Potential Refactoring Benefit & ROI
    const savings = SavingsEngine.calculateSavings(
      projectedAnnualCost,
      assumptions.defaultRemediationEffectiveness
    );
    const roi = ROICalculator.calculateROI({
      refactoringInvestment: totalRemediationCost,
      potentialAnnualSavings: savings.potentialAnnualSavings,
      evaluationWindowYears: assumptions.evaluationWindowYears,
    });

    const benefitTrace = FinancialTraceService.createTrace({
      metric: 'Potential Refactoring Benefit & ROI',
      category: 'refactoring_benefit',
      inputs: [
        { name: '24-Month Gross Benefit', value: roi.twoYearGrossBenefit, unit: currency },
        { name: 'Refactoring Investment', value: totalRemediationCost, unit: currency },
        { name: 'Modeled Effectiveness', value: `${Math.round(assumptions.defaultRemediationEffectiveness * 100)}%` },
      ],
      formula: 'NetSavings = (AvoidableAnnualSavings × 2) - RemediationCost; ROI = (NetSavings / RemediationCost) × 100',
      estimatedValue: roi.twoYearNetSavings,
      range: roi.netSavingsRange,
      currency,
      confidence,
      explanation: roi.explanation,
    });

    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

    return {
      analysisId: params.analysisId,
      repositoryId: params.repositoryId,
      currency,
      currencySymbol: symbol,
      hourlyRate: rate,
      modelVersion: assumptions.modelVersion,
      confidence,
      summary: {
        totalAnnualExposure: projectedAnnualCost,
        annualExposureRange: avoidableRange,
        formattedAnnualExposure: CostModel.formatCurrencyRange(avoidableRange, currency),
        remediationInvestment: totalRemediationCost,
        investmentRange: remediationRange,
        formattedInvestment: CostModel.formatCurrencyRange(remediationRange, currency),
        historicalReworkBurden: historicalReworkCost,
        historicalReworkRange: historicalRange,
        formattedHistoricalRework: CostModel.formatCurrencyRange(historicalRange, currency),
        potentialAnnualSavings: savings.potentialAnnualSavings,
        savingsRange: savings.savingsRange,
        formattedSavings: CostModel.formatCurrencyRange(savings.savingsRange, currency),
        twoYearNetBenefit: roi.twoYearNetSavings,
        netBenefitRange: roi.netSavingsRange,
        formattedNetBenefit: CostModel.formatCurrencyRange(roi.netSavingsRange, currency),
        roiPercentage: roi.roiPercentage,
        paybackPeriodMonths: roi.paybackPeriodMonths,
      },
      fourQuadrants: {
        estimatedRemediationInvestment: {
          totalHours: totalRemediationHours,
          totalCost: totalRemediationCost,
          costRange: remediationRange,
          trace: remediationTrace,
        },
        historicalMaintenanceReworkBurden: {
          totalHours: historicalReworkHours,
          totalCost: historicalReworkCost,
          costRange: historicalRange,
          trace: historicalTrace,
        },
        estimatedFutureAvoidableCost: {
          projectedAnnualHours: annualHoursAvoidable,
          projectedAnnualCost,
          costRange: avoidableRange,
          trace: futureTrace,
        },
        potentialRefactoringBenefit: {
          netSavings: roi.twoYearNetSavings,
          roiPercentage: roi.roiPercentage,
          paybackPeriodMonths: roi.paybackPeriodMonths,
          costRange: roi.netSavingsRange,
          trace: benefitTrace,
        },
      },
      costDrivers,
      assumptions,
      disclaimer:
        'Financial outputs are model-based indicators: Modeled annual exposure and modeled savings are estimates derived from software telemetry and engineering economics heuristics. Modeled outputs are estimates (MODELED ≠ REALIZED) and must never be presented as realized accounting statements.',
      economicDisclaimer:
        'Financial outputs are model-based indicators: Modeled annual exposure and modeled savings are estimates derived from software telemetry and engineering economics heuristics. Modeled outputs are estimates (MODELED ≠ REALIZED) and must never be presented as realized accounting statements.',
    };
  }
}
