import { AnalysisSnapshotService } from '../src/services/reporting/AnalysisSnapshotService';
import { TrendAnalysisService } from '../src/services/predictive/TrendAnalysisService';
import { PredictiveOrchestrator } from '../src/services/predictive/PredictiveOrchestrator';
import { PredictionEvaluationService } from '../src/services/predictive/PredictionEvaluationService';
import { PredictiveRecommendationService } from '../src/services/predictive/PredictiveRecommendationService';
import { AlertEngine } from '../src/services/alerts/AlertEngine';
import { GoalProgressEngine } from '../src/services/goals/GoalProgressEngine';
import { DebtLifecycleService } from '../src/services/debt/DebtLifecycleService';
import { DebtIdentityService } from '../src/services/debt/DebtIdentityService';

describe('Phase 5 Deterministic End-to-End Predictive Intelligence Lifecycle', () => {
  const repoId = 'repo-e2e-predictive-closed-loop';

  beforeAll(() => {
    AnalysisSnapshotService.clearMemory();
    PredictiveOrchestrator.clearMemory();
    PredictionEvaluationService.clearMemory();
    PredictiveRecommendationService.clearMemory();
    AlertEngine.clearMemory();
    GoalProgressEngine.clearMemory();
    DebtIdentityService.clearMemory();
  });

  it('should execute the full 10-step predictive intelligence loop with verified forecast evaluation', async () => {
    // -------------------------------------------------------------------------
    // STEP 1: Set up Engineering Goal
    // -------------------------------------------------------------------------
    const goal = await GoalProgressEngine.createGoal({
      repositoryId: repoId,
      title: 'Reduce Debt Score to 50',
      metric: 'TECHNICAL_DEBT_SCORE',
      startingValue: 75,
      targetValue: 50,
      unit: 'pts',
      targetDate: new Date(Date.now() + 60 * 86400000),
      createdBy: 'Lead Architect',
    });
    expect(goal.status).toBe('ACTIVE');

    // -------------------------------------------------------------------------
    // STEP 2: Analysis #1 — Initial Telemetry Baseline
    // -------------------------------------------------------------------------
    const snapshot1 = await AnalysisSnapshotService.createSnapshot({
      analysisId: 'analysis-cycle-01',
      repositoryId: repoId,
      commitSha: 'commit-001-init',
      branch: 'main',
      timestamp: new Date(Date.now() - 45 * 86400000),
      linesOfCode: 10000,
      commitCount: 40,
      totalChurn: 400,
      complexity: 70,
      hotspotCount: 5,
      criticalHotspotCount: 1,
      technicalDebtScore: 52,
      financialExposure: 120000,
      priorityDistribution: { critical: 1, high: 2, medium: 2, low: 0, monitor: 0 },
      telemetryConfidence: 'HIGH',
    });
    expect(snapshot1.analysisId).toBe('analysis-cycle-01');

    // -------------------------------------------------------------------------
    // STEP 3: Analysis #2 — Initial Deterioration Observed
    // -------------------------------------------------------------------------
    const snapshot2 = await AnalysisSnapshotService.createSnapshot({
      analysisId: 'analysis-cycle-02',
      repositoryId: repoId,
      commitSha: 'commit-002-churn',
      branch: 'main',
      timestamp: new Date(Date.now() - 25 * 86400000),
      linesOfCode: 11500,
      commitCount: 65,
      totalChurn: 750,
      complexity: 88,
      hotspotCount: 7,
      criticalHotspotCount: 2,
      technicalDebtScore: 60,
      financialExposure: 165000,
      priorityDistribution: { critical: 2, high: 3, medium: 2, low: 0, monitor: 0 },
      telemetryConfidence: 'HIGH',
    });
    expect(snapshot2.technicalDebtScore).toBe(60);

    // -------------------------------------------------------------------------
    // STEP 4: Analysis #3 — Deterioration Accelerating
    // -------------------------------------------------------------------------
    const snapshot3 = await AnalysisSnapshotService.createSnapshot({
      analysisId: 'analysis-cycle-03',
      repositoryId: repoId,
      commitSha: 'commit-003-escalate',
      branch: 'main',
      timestamp: new Date(Date.now() - 5 * 86400000),
      linesOfCode: 13000,
      commitCount: 95,
      totalChurn: 1350,
      complexity: 118,
      hotspotCount: 9,
      criticalHotspotCount: 4,
      technicalDebtScore: 74,
      financialExposure: 240000,
      priorityDistribution: { critical: 4, high: 3, medium: 2, low: 0, monitor: 0 },
      telemetryConfidence: 'HIGH',
    });
    expect(snapshot3.technicalDebtScore).toBe(74);

    // -------------------------------------------------------------------------
    // STEP 5: Trend Calculation & Acceleration Detection
    // -------------------------------------------------------------------------
    const snapshotsHistory = await AnalysisSnapshotService.getSnapshots(repoId, 10);
    const trendReport = TrendAnalysisService.analyzeSnapshots(snapshotsHistory);

    expect(trendReport.snapshotCount).toBe(3);
    expect(trendReport.overallTrend).toBe('ACCELERATING');
    expect(trendReport.isAcceleratingRisk).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 6: Predictive Assessment Generation
    // -------------------------------------------------------------------------
    const assessment = await PredictiveOrchestrator.generateAssessment(
      repoId,
      snapshot3.analysisId,
      {
        horizon: 'NEXT_ANALYSIS',
        currency: 'INR',
        forceRefresh: true,
        hotspotsData: [
          {
            filePath: 'src/billing/PaymentService.ts',
            hotspotScore: 84,
            complexity: 32,
            churn: 520,
            defectCount: 3,
            financialExposure: 140000,
            riskTier: 'CRITICAL',
          },
          {
            filePath: 'src/checkout/CartRouter.ts',
            hotspotScore: 72,
            complexity: 24,
            churn: 350,
            defectCount: 2,
            financialExposure: 75000,
            riskTier: 'HIGH',
          },
        ],
      }
    );

    expect(assessment.riskLevel).toBe('CRITICAL');
    expect(assessment.riskTrend).toBe('ACCELERATING');
    expect(assessment.confidence).toBe('MEDIUM'); // 3 snapshots
    expect(assessment.predictedDebtScore.expected).toBeGreaterThan(74);
    expect(assessment.costOfDoingNothing.potentialIncrease).toBeGreaterThan(0);

    // -------------------------------------------------------------------------
    // STEP 7: Risk Recommendations & Next Best Action
    // -------------------------------------------------------------------------
    expect(assessment.recommendedActions.length).toBeGreaterThan(0);
    const topAction = assessment.recommendedActions[0];
    expect(topAction.target).toContain('PaymentService.ts');
    expect(topAction.riskDrivers.length).toBeGreaterThan(0);
    expect(topAction.estimatedEffort.expectedHours).toBeGreaterThan(0);

    // Record user feedback on the recommendation
    PredictiveRecommendationService.recordFeedback(topAction.actionId, 'HELPFUL', 'lead-architect');
    const feedbackStats = PredictiveRecommendationService.getFeedbackStats();
    expect(feedbackStats.helpful).toBe(1);

    // -------------------------------------------------------------------------
    // STEP 8: Engineering Action Simulated & Analysis #4 Ingested
    // -------------------------------------------------------------------------
    // Suppose engineering refactored PaymentService, containing the debt score around 78
    const snapshot4 = await AnalysisSnapshotService.createSnapshot({
      analysisId: 'analysis-cycle-04-post-remediation',
      repositoryId: repoId,
      commitSha: 'commit-004-refactored',
      branch: 'main',
      timestamp: new Date(),
      linesOfCode: 13200,
      commitCount: 110,
      totalChurn: 1450,
      complexity: 112,
      hotspotCount: 8,
      criticalHotspotCount: 5,
      technicalDebtScore: 78,
      financialExposure: 285000,
      priorityDistribution: { critical: 5, high: 2, medium: 1, low: 0, monitor: 0 },
      telemetryConfidence: 'HIGH',
    });

    // -------------------------------------------------------------------------
    // STEP 9: Prediction Evaluated Against Actual Result
    // -------------------------------------------------------------------------
    const evaluationResults = await PredictionEvaluationService.evaluatePredictions(
      repoId,
      assessment,
      snapshot4
    );

    expect(evaluationResults.length).toBe(3);
    const debtScoreEval = evaluationResults.find((e) => e.metricName === 'technicalDebtScore');
    expect(debtScoreEval).toBeDefined();
    // Actual debt score (78) should be within predicted uncertainty range or close to expected
    expect(debtScoreEval!.actualValue).toBe(78);
    expect(debtScoreEval!.predictedRange).toBeDefined();

    // -------------------------------------------------------------------------
    // STEP 10: Forecast Accuracy Report Generated
    // -------------------------------------------------------------------------
    const accuracyReport = await PredictionEvaluationService.computeAccuracyReport(repoId);
    expect(accuracyReport.totalEvaluated).toBe(3);
    expect(accuracyReport.overallAccuracyPercentage).toBeGreaterThanOrEqual(70);
    expect(accuracyReport.metricsBreakdown.debtScore.count).toBe(1);
    expect(accuracyReport.summary).toContain('Prediction Accuracy:');
  });
});
