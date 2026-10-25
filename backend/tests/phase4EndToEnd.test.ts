import { DebtIdentityService } from '../src/services/debt/DebtIdentityService';
import { DebtLifecycleService } from '../src/services/debt/DebtLifecycleService';
import { VerificationEngine } from '../src/services/verification/VerificationEngine';
import { GoalProgressEngine } from '../src/services/goals/GoalProgressEngine';
import { AlertEngine } from '../src/services/alerts/AlertEngine';
import { AnalysisSnapshotService } from '../src/services/reporting/AnalysisSnapshotService';
import { SnapshotComparisonEngine } from '../src/services/reporting/SnapshotComparisonEngine';
import { AuditTrailService } from '../src/services/audit/AuditTrailService';

describe('Phase 4: Deterministic End-to-End Workflow', () => {
  const repoId = 'repo-e2e-deterministic';

  beforeAll(() => {
    DebtIdentityService.clearMemory();
    GoalProgressEngine.clearMemory();
    AlertEngine.clearMemory();
    AnalysisSnapshotService.clearMemory();
    AuditTrailService.clearMemory();
  });

  it('should run complete closed-loop continuous intelligence cycle', async () => {
    // -------------------------------------------------------------
    // STEP 1: Connect Repository and Create Engineering Goal
    // -------------------------------------------------------------
    const goal = await GoalProgressEngine.createGoal({
      repositoryId: repoId,
      title: 'Reduce Critical Hotspots Below 2',
      metric: 'CRITICAL_HOTSPOTS',
      startingValue: 4,
      targetValue: 1,
      unit: 'hotspots',
      targetDate: new Date(Date.now() + 30 * 86400000),
      createdBy: 'VP of Engineering',
    });

    expect(goal.progressPercentage).toBe(0);
    expect(goal.status).toBe('ACTIVE');

    // -------------------------------------------------------------
    // STEP 2: Analysis #1 — Baseline Telemetry
    // -------------------------------------------------------------
    const baselineAnalysisId = 'analysis-e2e-run-01';

    const baselineHotspots = [
      {
        filePath: 'src/checkout/OrderPaymentRouter.ts',
        rank: 1,
        riskLevel: 'critical',
        complexityScore: 88,
        churnScore: 75,
        debtScore: 82,
        primaryDebtDrivers: ['Cyclomatic Complexity', 'Frequent Defect Fixes'],
      },
      {
        filePath: 'src/pricing/DynamicEngine.ts',
        rank: 2,
        riskLevel: 'critical',
        complexityScore: 78,
        churnScore: 65,
        debtScore: 74,
        primaryDebtDrivers: ['Cognitive Complexity'],
      },
    ];

    const baselineMetrics = [
      {
        filePath: 'src/checkout/OrderPaymentRouter.ts',
        cyclomaticComplexity: 44,
        debtScore: 82,
        totalChurn: 280,
        defectFixCommitCount: 5,
        linesOfCode: 520,
      },
      {
        filePath: 'src/pricing/DynamicEngine.ts',
        cyclomaticComplexity: 36,
        debtScore: 74,
        totalChurn: 190,
        defectFixCommitCount: 3,
        linesOfCode: 380,
      },
    ];

    const baselinePriorities = [
      {
        filePath: 'src/checkout/OrderPaymentRouter.ts',
        priority: 'CRITICAL',
        priorityScore: 92,
        modeledAnnualImpact: 350000,
        estimatedEffortHours: 18,
      },
      {
        filePath: 'src/pricing/DynamicEngine.ts',
        priority: 'CRITICAL',
        priorityScore: 84,
        modeledAnnualImpact: 220000,
        estimatedEffortHours: 12,
      },
    ];

    // Detect persistent debt items
    const detectedDebt = await DebtIdentityService.matchOrCreateDebtItems(
      repoId,
      baselineHotspots,
      baselineMetrics,
      baselinePriorities,
      2000
    );

    expect(detectedDebt.length).toBe(2);
    expect(detectedDebt[0].currentStatus).toBe('DETECTED');
    expect(detectedDebt[0].debtItemId.startsWith('debt-')).toBe(true);

    const targetDebtItem = detectedDebt[0]; // OrderPaymentRouter

    // Persist Baseline Snapshot
    const baselineSnapshot = await AnalysisSnapshotService.createSnapshot({
      analysisId: baselineAnalysisId,
      repositoryId: repoId,
      commitSha: 'commit-sha-001',
      branch: 'main',
      linesOfCode: 900,
      commitCount: 45,
      totalChurn: 470,
      complexity: 40,
      hotspotCount: 2,
      criticalHotspotCount: 2,
      technicalDebtScore: 78,
      financialExposure: 570000,
    });

    // -------------------------------------------------------------
    // STEP 3: Prioritize, Plan, and Associate Engineering Work
    // -------------------------------------------------------------
    await DebtLifecycleService.transitionStatus(targetDebtItem.debtItemId, 'PRIORITIZED');
    await DebtLifecycleService.assignDebtItem(
      targetDebtItem.debtItemId,
      'Staff Architect',
      new Date(Date.now() + 14 * 86400000)
    );
    await DebtLifecycleService.transitionStatus(targetDebtItem.debtItemId, 'IN_PROGRESS');

    // Engineer links Pull Request and marks RESOLVED
    await DebtLifecycleService.linkWork(targetDebtItem.debtItemId, {
      commitSha: 'commit-sha-002-fix',
      pullRequestUrl: 'https://github.com/org/repo/pull/184',
      notes: 'Decoupled monolithic router into modular strategy pipeline',
    });
    const resolvedItem = await DebtLifecycleService.transitionStatus(
      targetDebtItem.debtItemId,
      'RESOLVED',
      'Staff Architect',
      'Refactoring merged to main'
    );

    expect(resolvedItem.currentStatus).toBe('RESOLVED');
    expect(resolvedItem.resolutionCommitSha).toBe('commit-sha-002-fix');

    // -------------------------------------------------------------
    // STEP 4: Analysis #2 — Re-analysis with Refactored Telemetry
    // -------------------------------------------------------------
    const reanalysisId = 'analysis-e2e-run-02';

    // Telemetry shows OrderPaymentRouter complexity dropped from 44 to 18 (59% reduction!)
    const reanalysisMetrics = [
      {
        filePath: 'src/checkout/OrderPaymentRouter.ts',
        cyclomaticComplexity: 18,
        debtScore: 38,
        totalChurn: 285,
        defectFixCommitCount: 5,
        linesOfCode: 240,
      },
      {
        filePath: 'src/pricing/DynamicEngine.ts',
        cyclomaticComplexity: 36,
        debtScore: 74,
        totalChurn: 190,
        defectFixCommitCount: 3,
        linesOfCode: 380,
      },
    ];

    const reanalysisHotspots = [
      {
        filePath: 'src/pricing/DynamicEngine.ts',
        rank: 1,
        riskLevel: 'critical',
        complexityScore: 78,
        churnScore: 65,
        debtScore: 74,
        primaryDebtDrivers: ['Cognitive Complexity'],
      },
    ];

    // -------------------------------------------------------------
    // STEP 5: Verification Engine Runs Before/After Audit
    // -------------------------------------------------------------
    const verificationResults = await VerificationEngine.verifyRepositoryResolvedItems(
      repoId,
      reanalysisMetrics,
      reanalysisHotspots,
      reanalysisId
    );

    expect(verificationResults.length).toBe(1);
    const vResult = verificationResults[0];
    expect(vResult.debtItemId).toBe(targetDebtItem.debtItemId);
    expect(vResult.verificationStatus).toBe('VERIFIED');
    expect(vResult.complexityBefore).toBe(44);
    expect(vResult.complexityAfter).toBe(18);
    expect(vResult.complexityReductionPct).toBe(59.1);
    expect(vResult.verifiedTechnicalImprovement).toContain('59.1% reduction');

    // Item transitioned to VERIFIED automatically
    const verifiedItem = await DebtIdentityService.getDebtItemById(targetDebtItem.debtItemId);
    expect(verifiedItem?.currentStatus).toBe('VERIFIED');
    expect(verifiedItem?.verificationStatus).toBe('VERIFIED');

    // -------------------------------------------------------------
    // STEP 6: Snapshot Comparison & Delta Tracking
    // -------------------------------------------------------------
    const currentSnapshot = await AnalysisSnapshotService.createSnapshot({
      analysisId: reanalysisId,
      repositoryId: repoId,
      commitSha: 'commit-sha-002-fix',
      branch: 'main',
      linesOfCode: 620,
      commitCount: 50,
      totalChurn: 510,
      complexity: 27,
      hotspotCount: 1,
      criticalHotspotCount: 1, // Decreased from 2 to 1!
      technicalDebtScore: 56, // Improved from 78 to 56!
      financialExposure: 220000,
    });

    const comparison = SnapshotComparisonEngine.compareSnapshots(baselineSnapshot, currentSnapshot);

    expect(comparison.overallStatus).toBe('IMPROVING');
    expect(comparison.deltas.criticalHotspots.before).toBe(2);
    expect(comparison.deltas.criticalHotspots.after).toBe(1);
    expect(comparison.deltas.criticalHotspots.direction).toBe('REDUCED');
    expect(comparison.deltas.criticalHotspots.isImprovement).toBe(true);

    expect(comparison.deltas.debtScore.before).toBe(78);
    expect(comparison.deltas.debtScore.after).toBe(56);
    expect(comparison.deltas.debtScore.isImprovement).toBe(true);

    // -------------------------------------------------------------
    // STEP 7: Goal Progress Automatically Evaluated & Achieved
    // -------------------------------------------------------------
    const updatedGoals = await GoalProgressEngine.evaluateGoals(repoId, {
      criticalHotspots: currentSnapshot.criticalHotspotCount, // 1 hotspot!
      technicalDebtScore: currentSnapshot.technicalDebtScore,
      annualExposure: currentSnapshot.financialExposure,
      highPriorityDebt: 1,
      averageComplexity: currentSnapshot.complexity,
    });

    expect(updatedGoals.length).toBe(1);
    const updatedGoal = updatedGoals[0];
    expect(updatedGoal.currentValue).toBe(1);
    expect(updatedGoal.progressPercentage).toBe(100);
    expect(updatedGoal.status).toBe('ACHIEVED');

    // -------------------------------------------------------------
    // STEP 8: Audit Trail Integrity
    // -------------------------------------------------------------
    const events = await AuditTrailService.getEvents(repoId, 20);
    expect(events.length).toBeGreaterThanOrEqual(4);

    const actionTypes = events.map((e) => e.action);
    expect(actionTypes).toContain('GOAL_ACHIEVED');
    expect(actionTypes).toContain('DEBT_VERIFIED');
    expect(actionTypes).toContain('STATUS_CHANGED');
  });
});
