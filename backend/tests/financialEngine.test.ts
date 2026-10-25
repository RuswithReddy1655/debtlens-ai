import { DefaultFinancialCostEngine } from '../src/scoring/financialEngine';
import { DefaultTechnicalDebtEngine } from '../src/scoring/scoringEngine';
import { FileDebtScore } from '../src/analyzers/interfaces';

describe('FinancialCostEngine', () => {
  const engine = new DefaultFinancialCostEngine(95);

  const mockDebtScores: FileDebtScore[] = [
    {
      filePath: 'src/core/heavyModule.ts',
      overallDebtScore: 88,
      riskCategory: 'critical',
      debtHours: 100,
      debtDrivers: ['High Cyclomatic Complexity'],
      components: {
        complexityScore: 85,
        churnScore: 80,
        defectScore: 70,
        ownershipScore: 60,
        legacyScore: 40,
      },
    },
    {
      filePath: 'src/utils/legacyHelper.ts',
      overallDebtScore: 62,
      riskCategory: 'high',
      debtHours: 40,
      debtDrivers: ['Legacy Decay'],
      components: {
        complexityScore: 50,
        churnScore: 40,
        defectScore: 30,
        ownershipScore: 50,
        legacyScore: 75,
      },
    },
    {
      filePath: 'src/services/stableService.ts',
      overallDebtScore: 18,
      riskCategory: 'low',
      debtHours: 10,
      debtDrivers: ['Stable & Well-Maintained'],
      components: {
        complexityScore: 20,
        churnScore: 15,
        defectScore: 10,
        ownershipScore: 20,
        legacyScore: 15,
      },
    },
  ];

  it('should compute financial valuation with all four quadrants', async () => {
    const valuation = await engine.calculateValuation(mockDebtScores, 100);

    // 1. Remediation Investment
    expect(valuation.estimatedRemediationInvestment.totalHours).toBe(150);
    expect(valuation.estimatedRemediationInvestment.totalCost).toBe(150 * 100);
    expect(valuation.estimatedRemediationInvestment.trace).toBeDefined();
    expect(valuation.estimatedRemediationInvestment.trace.formula).toContain('totalRemediationHours * engineeringHourlyRate');

    // 2. Historical Maintenance / Rework Burden
    expect(valuation.historicalMaintenanceReworkBurden.totalCost).toBeGreaterThan(0);
    expect(valuation.historicalMaintenanceReworkBurden.trace).toBeDefined();

    // 3. Estimated Future Avoidable Cost
    expect(valuation.estimatedFutureAvoidableCost.projectedAnnualCost).toBeGreaterThan(0);
    expect(valuation.estimatedFutureAvoidableCost.trace).toBeDefined();

    // 4. Potential Refactoring Benefit
    expect(valuation.potentialRefactoringBenefit.roiRatio).toBeGreaterThan(0);
    expect(valuation.potentialRefactoringBenefit.paybackMonths).toBeGreaterThan(0);
    expect(valuation.potentialRefactoringBenefit.trace).toBeDefined();

    // Disclaimer check
    expect(valuation.disclaimer).toContain('predictive indicators based on engineering economics heuristics');
  });

  it('should dynamically adapt to changing hourly rates', async () => {
    const valuationAt95 = await engine.calculateValuation(mockDebtScores, 95);
    const valuationAt150 = await engine.calculateValuation(mockDebtScores, 150);

    expect(valuationAt150.estimatedRemediationInvestment.totalCost).toBeGreaterThan(
      valuationAt95.estimatedRemediationInvestment.totalCost
    );
  });
});

describe('TechnicalDebtEngine', () => {
  const engine = new DefaultTechnicalDebtEngine();

  it('should classify high complexity and churn as critical risk', async () => {
    const result = await engine.computeFileDebt(
      {
        cyclomaticComplexity: 45,
        cognitiveComplexity: 50,
        linesOfCode: 1200,
        logicalLinesOfCode: 800,
        nestingDepthMax: 6,
        functionCount: 30,
        commentRatio: 0.05,
        duplicationPercentage: 15,
      },
      {
        commitCount: 35,
        changeFrequencyPerMonth: 6,
        reworkCommitCount: 12,
        linesAddedTotal: 4000,
        linesDeletedTotal: 1500,
      },
      {
        totalDefects: 9,
        criticalDefects: 2,
        reworkHoursSpent: 35,
        defectDensityPerKLoC: 7.5,
        defectHistory: [],
      },
      {
        primaryOwner: 'Dev One',
        primaryOwnerPercentage: 85,
        totalContributors: 1,
        ownershipEntropy: 0.1,
        isKnowledgeSilo: true,
        topContributors: [],
      },
      {
        isLegacy: false,
        monthsSinceLastModified: 1,
        dependencyFreshnessScore: 90,
        deprecatedApiCount: 2,
        frameworkVersionLagMonths: 2,
      }
    );

    expect(result.overallDebtScore).toBeGreaterThanOrEqual(75);
    expect(result.riskCategory).toBe('critical');
    expect(result.debtDrivers.length).toBeGreaterThan(0);
  });
});
