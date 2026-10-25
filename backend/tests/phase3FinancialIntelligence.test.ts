import { CostModel } from '../src/services/financial/CostModel';
import { CostDriverEngine } from '../src/services/financial/CostDriverEngine';
import { SavingsEngine } from '../src/services/financial/SavingsEngine';
import { ROICalculator } from '../src/services/financial/ROICalculator';
import { FinancialIntelligenceEngine } from '../src/services/financial/FinancialIntelligenceEngine';

describe('Phase 3 Financial Intelligence Engine & Cost Drivers', () => {
  const mockFileMetrics = [
    {
      filePath: 'src/services/PaymentProcessor.ts',
      language: 'TypeScript',
      linesOfCode: 350,
      codeLines: 280,
      cyclomaticComplexity: 22,
      totalChurn: 580,
      changeCount: 14,
      defectFixCommitCount: 5,
      debtScore: 88,
      debtHours: 32,
      isLegacyCandidate: false,
    },
    {
      filePath: 'src/controllers/OrderController.ts',
      language: 'TypeScript',
      linesOfCode: 240,
      codeLines: 190,
      cyclomaticComplexity: 16,
      totalChurn: 310,
      changeCount: 8,
      defectFixCommitCount: 2,
      debtScore: 72,
      debtHours: 18,
      isLegacyCandidate: false,
    },
    {
      filePath: 'src/legacy/OldAuthService.ts',
      language: 'TypeScript',
      linesOfCode: 180,
      codeLines: 150,
      cyclomaticComplexity: 14,
      totalChurn: 40,
      changeCount: 2,
      defectFixCommitCount: 0,
      debtScore: 65,
      debtHours: 14,
      daysSinceLastChange: 240,
      isLegacyCandidate: true,
    },
    {
      filePath: 'src/utils/math.ts',
      language: 'TypeScript',
      linesOfCode: 45,
      codeLines: 35,
      cyclomaticComplexity: 3,
      totalChurn: 15,
      changeCount: 1,
      defectFixCommitCount: 0,
      debtScore: 12,
      debtHours: 2,
      isLegacyCandidate: false,
    },
  ];

  const mockHotspots = [
    {
      filePath: 'src/services/PaymentProcessor.ts',
      hotspotScore: 92,
      riskLevel: 'critical',
    },
    {
      filePath: 'src/controllers/OrderController.ts',
      hotspotScore: 74,
      riskLevel: 'high',
    },
  ];

  describe('CostModel & Assumptions', () => {
    it('should resolve default INR assumptions with hourly rate of 2000', () => {
      const assumptions = CostModel.resolveAssumptions();
      expect(assumptions.currency).toBe('INR');
      expect(assumptions.hourlyRate).toBe(2000);
      expect(assumptions.modelVersion).toBe('Financial Model v1.0');
    });

    it('should correctly format currency ranges in Indian Lakhs for INR', () => {
      const range = { low: 4200000, expected: 4800000, high: 5400000 };
      const formatted = CostModel.formatCurrencyRange(range, 'INR');
      expect(formatted).toBe('₹42.0L – ₹54.0L');
    });

    it('should correctly format currency ranges in Western notation for USD', () => {
      const range = { low: 45000, expected: 50000, high: 55000 };
      const formatted = CostModel.formatCurrencyRange(range, 'USD');
      expect(formatted).toBe('$45k – $55k');
    });

    it('should evaluate confidence based on repository telemetry density', () => {
      const highConf = CostModel.evaluateConfidence({
        totalCommits: 45,
        totalFiles: 8,
        astSupportedCount: 4,
        defectSignalsFound: true,
      });
      expect(highConf).toBe('HIGH');

      const zeroData = CostModel.evaluateConfidence({
        totalCommits: 0,
        totalFiles: 0,
      });
      expect(zeroData).toBe('INSUFFICIENT DATA');
    });
  });

  describe('CostDriverEngine', () => {
    it('should compute the 4 cost drivers with valid percentage contributions', () => {
      const assumptions = CostModel.resolveAssumptions({ currency: 'INR', hourlyRate: 2000 });
      const breakdown = CostDriverEngine.calculateCostDrivers(mockFileMetrics, mockHotspots, assumptions);

      expect(breakdown.totalAnnualImpact).toBeGreaterThan(0);
      expect(breakdown.currency).toBe('INR');

      const drivers = breakdown.drivers;
      expect(drivers.maintenanceFriction.estimatedCost).toBeGreaterThan(0);
      expect(drivers.defectFixBurden.estimatedCost).toBeGreaterThan(0);
      expect(drivers.changeFriction.estimatedCost).toBeGreaterThan(0);
      expect(drivers.legacyRisk.estimatedCost).toBeGreaterThan(0);

      const totalPercent =
        drivers.maintenanceFriction.percentageContribution +
        drivers.defectFixBurden.percentageContribution +
        drivers.changeFriction.percentageContribution +
        drivers.legacyRisk.percentageContribution;

      expect(totalPercent).toBeCloseTo(100, 0);
    });

    it('should identify PaymentProcessor as the top annual cost driver file', () => {
      const assumptions = CostModel.resolveAssumptions();
      const breakdown = CostDriverEngine.calculateCostDrivers(mockFileMetrics, mockHotspots, assumptions);

      expect(breakdown.topCostDriverFiles.length).toBeGreaterThanOrEqual(1);
      expect(breakdown.topCostDriverFiles[0].filePath).toBe('src/services/PaymentProcessor.ts');
      expect(breakdown.topCostDriverFiles[0].totalAnnualImpact).toBeGreaterThan(
        breakdown.topCostDriverFiles[1].totalAnnualImpact
      );
    });
  });

  describe('SavingsEngine & ROICalculator', () => {
    it('should model annual savings and residual impact correctly', () => {
      const currentImpact = 1000000;
      const savings = SavingsEngine.calculateSavings(currentImpact, 0.65);

      expect(savings.currentAnnualImpact).toBe(1000000);
      expect(savings.potentialAnnualSavings).toBe(650000);
      expect(savings.residualAnnualImpact).toBe(350000);
      expect(savings.potentialAnnualSavings + savings.residualAnnualImpact).toBe(currentImpact);
    });

    it('should calculate 24-month ROI and payback period', () => {
      const roi = ROICalculator.calculateROI({
        refactoringInvestment: 200000,
        potentialAnnualSavings: 300000,
        evaluationWindowYears: 2,
      });

      // 2-year benefit = 600,000; Net savings = 400,000; ROI = (400,000 / 200,000) * 100 = 200%
      expect(roi.twoYearGrossBenefit).toBe(600000);
      expect(roi.twoYearNetSavings).toBe(400000);
      expect(roi.roiPercentage).toBe(200);
      // Monthly savings = 25,000; Payback = 200,000 / 25,000 = 8.0 months
      expect(roi.paybackPeriodMonths).toBe(8);
      expect(roi.isViable).toBe(true);
    });

    it('should handle zero refactoring investment edge case without dividing by zero', () => {
      const roi = ROICalculator.calculateROI({
        refactoringInvestment: 0,
        potentialAnnualSavings: 150000,
      });

      expect(roi.refactoringInvestment).toBe(0);
      expect(roi.twoYearNetSavings).toBe(300000);
      expect(roi.paybackPeriodMonths).toBe(0);
      expect(roi.isViable).toBe(true);
    });
  });

  describe('FinancialIntelligenceEngine', () => {
    it('should generate complete Financial Intelligence summary with 4 quadrants and traces', () => {
      const intel = FinancialIntelligenceEngine.generateIntelligence({
        analysisId: 'test-analysis-01',
        repositoryId: 'test-repo-01',
        fileMetrics: mockFileMetrics,
        hotspots: mockHotspots,
        overallDebtScore: 68,
        totalCommits: 25,
      });

      expect(intel.analysisId).toBe('test-analysis-01');
      expect(intel.confidence).toBe('HIGH');
      expect(intel.currency).toBe('INR');
      expect(intel.summary.totalAnnualExposure).toBeGreaterThan(0);
      expect(intel.summary.formattedAnnualExposure).toContain('₹');

      // Four quadrants verification
      const q = intel.fourQuadrants;
      expect(q.estimatedRemediationInvestment.totalCost).toBeGreaterThan(0);
      expect(q.historicalMaintenanceReworkBurden.totalCost).toBeGreaterThan(0);
      expect(q.estimatedFutureAvoidableCost.projectedAnnualCost).toBeGreaterThan(0);
      expect(q.potentialRefactoringBenefit.netSavings).toBeGreaterThanOrEqual(0);

      // Verify traces
      expect(q.estimatedRemediationInvestment.trace.formula).toContain('totalRemediationHours');
      expect(q.estimatedFutureAvoidableCost.trace.inputs.length).toBeGreaterThan(0);
      expect(intel.disclaimer).toContain('model-based');
    });
  });
});
