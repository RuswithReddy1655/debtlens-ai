import { DebtPrioritizationEngine } from '../src/services/prioritization/DebtPrioritizationEngine';
import { ScenarioEngine } from '../src/services/financial/ScenarioEngine';
import { PortfolioPrioritizationService } from '../src/services/prioritization/PortfolioPrioritizationService';
import { DebtSummaryService } from '../src/services/reporting/DebtSummaryService';
import { ExecutiveReportService } from '../src/services/reporting/ExecutiveReportService';
import { FinancialIntelligenceEngine } from '../src/services/financial/FinancialIntelligenceEngine';
import { CostModel } from '../src/services/financial/CostModel';

describe('Phase 3 Prioritization, Scenarios, Portfolio & Reports', () => {
  const mockFileMetrics = [
    {
      filePath: 'src/services/PaymentProcessor.ts',
      language: 'TypeScript',
      linesOfCode: 350,
      codeLines: 280,
      cyclomaticComplexity: 22,
      nestingDepth: 4,
      totalChurn: 580,
      changeCount: 14,
      defectFixCommitCount: 5,
      debtScore: 88,
      debtHours: 32,
    },
    {
      filePath: 'src/controllers/OrderController.ts',
      language: 'TypeScript',
      linesOfCode: 150,
      codeLines: 120,
      cyclomaticComplexity: 12,
      nestingDepth: 2,
      totalChurn: 280,
      changeCount: 9,
      defectFixCommitCount: 1,
      debtScore: 70,
      debtHours: 14,
    },
    {
      filePath: 'src/utils/math.ts',
      language: 'TypeScript',
      linesOfCode: 40,
      codeLines: 30,
      cyclomaticComplexity: 2,
      nestingDepth: 1,
      totalChurn: 10,
      changeCount: 1,
      defectFixCommitCount: 0,
      debtScore: 10,
      debtHours: 2,
    },
  ];

  const mockHotspots = [
    { filePath: 'src/services/PaymentProcessor.ts', hotspotScore: 92, riskLevel: 'critical' },
    { filePath: 'src/controllers/OrderController.ts', hotspotScore: 68, riskLevel: 'high' },
  ];

  describe('DebtPrioritizationEngine', () => {
    it('should rank items by priority score and assign appropriate priority tiers', () => {
      const result = DebtPrioritizationEngine.prioritize({
        analysisId: 'analysis-123',
        fileMetrics: mockFileMetrics,
        hotspots: mockHotspots,
        currency: 'INR',
        hourlyRate: 2000,
      });

      expect(result.priorities.length).toBe(3);
      expect(result.priorities[0].filePath).toBe('src/services/PaymentProcessor.ts');
      expect(result.priorities[0].priorityTier).toBe('CRITICAL');
      expect(result.priorities[0].rank).toBe(1);

      // Low risk file should be LOW or MONITOR
      expect(['LOW', 'MONITOR']).toContain(result.priorities[2].priorityTier);
    });

    it('should categorize files into Impact vs Effort quadrants', () => {
      const result = DebtPrioritizationEngine.prioritize({
        analysisId: 'analysis-123',
        fileMetrics: mockFileMetrics,
        hotspots: mockHotspots,
      });

      const quadrants = result.priorities.map((p) => p.matrixQuadrant);
      expect(quadrants.length).toBe(3);
      // Ensure valid quadrant names
      quadrants.forEach((q) => {
        expect(['QUICK WINS', 'STRATEGIC', 'OPPORTUNISTIC', 'DEFER']).toContain(q);
      });
    });

    it('should include human-readable reason explanations for each priority item', () => {
      const result = DebtPrioritizationEngine.prioritize({
        analysisId: 'analysis-123',
        fileMetrics: mockFileMetrics,
        hotspots: mockHotspots,
      });

      const topItem = result.priorities[0];
      expect(topItem.reason).toContain('cyclomatic complexity');
      expect(topItem.suggestedAction.length).toBeGreaterThan(10);
    });
  });

  describe('ScenarioEngine', () => {
    it('should simulate a what-if refactoring scenario and calculate projected debt reduction', () => {
      const assumptions = CostModel.resolveAssumptions({ currency: 'INR', hourlyRate: 2000 });
      const scenarioResult = ScenarioEngine.evaluateScenario(
        mockFileMetrics,
        mockHotspots,
        75,
        {
          scenarioName: 'Fix Top Hotspots',
          selectedFilePaths: ['src/services/PaymentProcessor.ts'],
          hourlyRate: 2000,
          remediationEffectiveness: 0.7,
        },
        assumptions
      );

      expect(scenarioResult.selectedFilesCount).toBe(1);
      expect(scenarioResult.refactoringInvestment).toBeGreaterThan(0);
      expect(scenarioResult.potentialAnnualSavings).toBeGreaterThan(0);
      expect(scenarioResult.projectedResidualDebtScore).toBeLessThan(75);
      expect(scenarioResult.isViable).toBe(true);
    });

    it('should compare preset scenarios (Quick Wins vs Strategic vs Comprehensive)', () => {
      const assumptions = CostModel.resolveAssumptions({ currency: 'INR', hourlyRate: 2000 });
      const comparison = ScenarioEngine.comparePresets(
        'analysis-123',
        mockFileMetrics,
        mockHotspots,
        75,
        assumptions
      );

      expect(comparison.scenarios.length).toBe(3);
      expect(comparison.scenarios[0].scenarioName).toContain('Quick Wins');
      expect(comparison.scenarios[1].scenarioName).toContain('High-Impact');
      expect(comparison.scenarios[2].scenarioName).toContain('Comprehensive');
    });
  });

  describe('PortfolioPrioritizationService', () => {
    it('should aggregate debt exposure across multiple repositories', () => {
      const portfolio = PortfolioPrioritizationService.buildPortfolio(
        [
          {
            repository: { id: 'repo-1', name: 'payments-service', isDemo: false },
            analysis: { summary: { overallDebtScore: 82, criticalHotspots: 4, totalFiles: 18 } },
            financialData: { summary: { totalAnnualExposure: 2400000, potentialAnnualSavings: 1560000 } },
          },
          {
            repository: { id: 'repo-2', name: 'user-portal', isDemo: false },
            analysis: { summary: { overallDebtScore: 45, criticalHotspots: 1, totalFiles: 10 } },
            financialData: { summary: { totalAnnualExposure: 600000, potentialAnnualSavings: 390000 } },
          },
        ],
        'INR',
        2000
      );

      expect(portfolio.totalRepositories).toBe(2);
      expect(portfolio.totalDebtExposure).toBe(3000000);
      expect(portfolio.highestRiskRepository?.name).toBe('payments-service');
      expect(portfolio.repositories[0].name).toBe('payments-service');
    });
  });

  describe('DebtSummaryService', () => {
    it('should compare two analyses and calculate debt score and cost deltas', () => {
      const comparison = DebtSummaryService.compareAnalyses(
        {
          analysisId: 'analysis-january',
          debtScore: 78,
          hotspotsCount: 14,
          annualExposure: 2800000,
          createdAt: new Date('2026-01-15'),
        },
        {
          analysisId: 'analysis-march',
          debtScore: 62,
          hotspotsCount: 8,
          annualExposure: 1900000,
          createdAt: new Date('2026-03-15'),
        },
        'INR'
      );

      expect(comparison.deltas.debtScoreDelta).toBe(-16);
      expect(comparison.deltas.hotspotsDelta).toBe(-6);
      expect(comparison.deltas.annualExposureDelta).toBe(-900000);
      expect(comparison.deltas.direction).toBe('IMPROVED');
      expect(comparison.explanation).toContain('improved');
    });
  });

  describe('ExecutiveReportService', () => {
    it('should generate a structured executive brief with markdown output', () => {
      const intel = FinancialIntelligenceEngine.generateIntelligence({
        analysisId: 'analysis-test',
        repositoryId: 'repo-test',
        fileMetrics: mockFileMetrics,
        hotspots: mockHotspots,
        overallDebtScore: 70,
        totalCommits: 20,
      });

      const priorities = DebtPrioritizationEngine.prioritize({
        analysisId: 'analysis-test',
        fileMetrics: mockFileMetrics,
        hotspots: mockHotspots,
      });

      const report = ExecutiveReportService.generateReport(intel, priorities, 'OrderManagementService');

      expect(report.repositoryId).toBe('repo-test');
      expect(report.headlineSummary).toContain('OrderManagementService');
      expect(report.priorityActions.length).toBeGreaterThan(0);
      expect(report.markdownBrief).toContain('# Executive Briefing');
      expect(report.confidenceAndLimitations.observedSignals.length).toBeGreaterThan(0);
    });
  });
});
