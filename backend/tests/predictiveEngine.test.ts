import { PredictiveFeatureService } from '../src/services/predictive/PredictiveFeatureService';
import { TrendAnalysisService } from '../src/services/predictive/TrendAnalysisService';
import { PredictiveRiskService } from '../src/services/predictive/PredictiveRiskService';
import { PredictionConfidenceService } from '../src/services/predictive/PredictionConfidenceService';
import { PredictiveForecastService } from '../src/services/predictive/PredictiveForecastService';
import { PredictiveRecommendationService } from '../src/services/predictive/PredictiveRecommendationService';
import { GoalForecastEngine } from '../src/services/predictive/GoalForecastEngine';
import { PredictionEvaluationService } from '../src/services/predictive/PredictionEvaluationService';
import { IAnalysisSnapshot } from '../src/models/AnalysisSnapshot';
import { IEngineeringGoal } from '../src/models/EngineeringGoal';

describe('Phase 5 Predictive Intelligence Engine Unit Tests', () => {
  beforeEach(() => {
    PredictionEvaluationService.clearMemory();
    PredictiveRecommendationService.clearMemory();
  });

  // Helper to create mock analysis snapshots
  const createSnapshot = (
    analysisId: string,
    daysAgo: number,
    debtScore: number,
    criticalHotspots: number,
    complexity: number,
    churn: number,
    exposure: number
  ): IAnalysisSnapshot =>
    ({
      analysisId,
      repositoryId: 'test-repo',
      commitSha: `sha-${analysisId}`,
      branch: 'main',
      timestamp: new Date(Date.now() - daysAgo * 86400000),
      linesOfCode: 15000,
      commitCount: 120,
      totalChurn: churn,
      codeAge: 45,
      complexity,
      maxNesting: 6,
      hotspotCount: 8,
      criticalHotspotCount: criticalHotspots,
      technicalDebtScore: debtScore,
      financialExposure: exposure,
      maintenanceFriction: Math.round(exposure * 0.45),
      defectFixBurden: Math.round(exposure * 0.3),
      changeFriction: Math.round(exposure * 0.15),
      legacyRisk: Math.round(exposure * 0.1),
      priorityDistribution: {
        critical: criticalHotspots,
        high: 3,
        medium: 2,
        low: 1,
        monitor: 1,
      },
      telemetryConfidence: 'HIGH',
    } as unknown as IAnalysisSnapshot);

  describe('PredictiveFeatureService', () => {
    it('should extract classified features with complete history', () => {
      const snapshots = [
        createSnapshot('snap-1', 30, 50, 1, 100, 500, 100000),
        createSnapshot('snap-2', 15, 60, 2, 120, 800, 140000),
        createSnapshot('snap-3', 0, 75, 4, 150, 1200, 200000),
      ];

      const features = PredictiveFeatureService.extractFeatures(snapshots);

      expect(features.repositoryFeatures.commitFrequency.classification).toBe('OBSERVED');
      expect(features.codeFeatures.linesOfCode.classification).toBe('OBSERVED');
      expect(features.debtFeatures.technicalDebtScore.classification).toBe('DERIVED');
      expect(features.debtFeatures.technicalDebtScore.value).toBe(75);
      expect(features.financialFeatures.annualExposure.classification).toBe('MODELED');
      expect(features.financialFeatures.annualExposure.value).toBe(200000);
      expect(features.historySummary.snapshotCount.value).toBe(3);
    });

    it('should handle partial history and zero values gracefully', () => {
      const features = PredictiveFeatureService.extractFeatures([]);

      expect(features.debtFeatures.technicalDebtScore.value).toBe(0);
      expect(features.codeFeatures.linesOfCode.value).toBe(0);
      expect(features.historySummary.snapshotCount.value).toBe(0);
    });
  });

  describe('TrendAnalysisService', () => {
    it('should detect ACCELERATING worsening trend across escalating deltas', () => {
      // Escalating increases: +5, +8, +12
      const series = [50, 55, 63, 75];
      const result = TrendAnalysisService.analyzeNumericSeries(series, 'debt', 'Debt Score', true);

      expect(result.trend).toBe('ACCELERATING');
      expect(result.isAccelerating).toBe(true);
      expect(result.direction).toBe('UP');
    });

    it('should detect IMPROVING trend when values decrease', () => {
      const series = [80, 70, 60, 50];
      const result = TrendAnalysisService.analyzeNumericSeries(series, 'debt', 'Debt Score', true);

      expect(result.trend).toBe('IMPROVING');
      expect(result.direction).toBe('DOWN');
      expect(result.percentageChange).toBe(-37.5);
    });

    it('should detect STABLE trend when deltas are flat', () => {
      const series = [50, 50, 51, 50];
      const result = TrendAnalysisService.analyzeNumericSeries(series, 'debt', 'Debt Score', true);

      expect(result.trend).toBe('STABLE');
    });

    it('should return INSUFFICIENT_DATA when snapshot count is less than 2', () => {
      const result = TrendAnalysisService.analyzeNumericSeries([65], 'debt', 'Debt Score', true);

      expect(result.trend).toBe('INSUFFICIENT_DATA');
      expect(result.confidence).toBe('INSUFFICIENT DATA');
    });
  });

  describe('PredictiveRiskService', () => {
    it('should calculate CRITICAL risk tier when debt is high and accelerating', () => {
      const snapshots = [
        createSnapshot('snap-1', 20, 65, 2, 100, 400, 150000),
        createSnapshot('snap-2', 10, 72, 3, 130, 800, 200000),
        createSnapshot('snap-3', 0, 84, 5, 170, 1400, 310000),
      ];

      const features = PredictiveFeatureService.extractFeatures(snapshots);
      const trend = TrendAnalysisService.analyzeSnapshots(snapshots);
      const risk = PredictiveRiskService.evaluateRisk(features, trend);

      expect(risk.riskScore).toBeGreaterThanOrEqual(75);
      expect(risk.riskLevel).toBe('CRITICAL');
      expect(risk.drivers.length).toBeGreaterThan(0);
      expect(risk.weightsUsed).toBeDefined();
    });

    it('should return INSUFFICIENT_DATA tier when history has less than 2 snapshots', () => {
      const snapshots = [createSnapshot('snap-1', 0, 80, 2, 100, 300, 100000)];
      const features = PredictiveFeatureService.extractFeatures(snapshots);
      const trend = TrendAnalysisService.analyzeSnapshots(snapshots);
      const risk = PredictiveRiskService.evaluateRisk(features, trend);

      expect(risk.riskLevel).toBe('INSUFFICIENT_DATA');
      expect(risk.riskTrend).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('PredictionConfidenceService', () => {
    it('should enforce confidence thresholds based on snapshot count', () => {
      // 0-1 snapshots: INSUFFICIENT DATA
      const snap1 = [createSnapshot('s1', 0, 50, 1, 100, 200, 50000)];
      const feat1 = PredictiveFeatureService.extractFeatures(snap1);
      const trend1 = TrendAnalysisService.analyzeSnapshots(snap1);
      const conf1 = PredictionConfidenceService.evaluateConfidence(feat1, trend1);
      expect(conf1.confidenceLevel).toBe('INSUFFICIENT DATA');

      // 2 snapshots: LOW
      const snap2 = [...snap1, createSnapshot('s2', 0, 55, 1, 110, 250, 60000)];
      const feat2 = PredictiveFeatureService.extractFeatures(snap2);
      const trend2 = TrendAnalysisService.analyzeSnapshots(snap2);
      const conf2 = PredictionConfidenceService.evaluateConfidence(feat2, trend2);
      expect(conf2.confidenceLevel).toBe('LOW');

      // 3-4 snapshots: MEDIUM
      const snap3 = [...snap2, createSnapshot('s3', 0, 60, 2, 120, 300, 70000)];
      const feat3 = PredictiveFeatureService.extractFeatures(snap3);
      const trend3 = TrendAnalysisService.analyzeSnapshots(snap3);
      const conf3 = PredictionConfidenceService.evaluateConfidence(feat3, trend3);
      expect(conf3.confidenceLevel).toBe('MEDIUM');

      // 5+ snapshots: HIGH
      const snap5 = [
        ...snap3,
        createSnapshot('s4', 0, 62, 2, 125, 320, 75000),
        createSnapshot('s5', 0, 64, 2, 130, 340, 80000),
      ];
      const feat5 = PredictiveFeatureService.extractFeatures(snap5);
      const trend5 = TrendAnalysisService.analyzeSnapshots(snap5);
      const conf5 = PredictionConfidenceService.evaluateConfidence(feat5, trend5);
      expect(conf5.confidenceLevel).toBe('HIGH');
    });

    it('should generate low / expected / high uncertainty intervals', () => {
      const range = PredictionConfidenceService.buildNumericRange(100, 'MEDIUM', 1.0, 0, 200);

      expect(range.expected).toBe(100);
      expect(range.low).toBeLessThan(range.expected);
      expect(range.high).toBeGreaterThan(range.expected);
    });
  });

  describe('PredictiveForecastService & Cost of Doing Nothing', () => {
    it('should compute Cost of Doing Nothing and What-If scenarios', () => {
      const snapshots = [
        createSnapshot('snap-1', 20, 60, 2, 100, 400, 150000),
        createSnapshot('snap-2', 10, 68, 3, 120, 600, 190000),
        createSnapshot('snap-3', 0, 76, 4, 150, 900, 240000),
      ];

      const features = PredictiveFeatureService.extractFeatures(snapshots);
      const trend = TrendAnalysisService.analyzeSnapshots(snapshots);
      const confidence = PredictionConfidenceService.evaluateConfidence(features, trend);

      const forecast = PredictiveForecastService.generateForecasts(features, trend, confidence, {
        horizon: 'NEXT_ANALYSIS',
        currency: 'INR',
      });

      expect(forecast.predictedDebtScore.expected).toBeGreaterThan(76);
      expect(forecast.predictedFinancialExposure.expected).toBeGreaterThan(240000);
      expect(forecast.costOfDoingNothing.potentialIncrease).toBeGreaterThan(0);
      expect(forecast.costOfDoingNothing.formattedPotentialIncrease).toContain('₹');

      const whatIf = PredictiveForecastService.buildWhatIfScenarios(
        240000,
        forecast.predictedFinancialExposure.expected,
        [],
        'INR'
      );

      expect(whatIf.length).toBeGreaterThanOrEqual(4);
      const doNothing = whatIf.find((s) => s.scenarioName === 'DO NOTHING');
      const fixTop5 = whatIf.find((s) => s.scenarioName === 'FIX TOP 5 HOTSPOTS');
      expect(doNothing).toBeDefined();
      expect(fixTop5).toBeDefined();
      expect(fixTop5!.forecastedExposure).toBeLessThan(doNothing!.forecastedExposure);
    });
  });

  describe('GoalForecastEngine', () => {
    it('should detect ON TRACK when goal progress leads timeline pacing', () => {
      const goal = {
        title: 'Reduce Debt Score to 40',
        metric: 'TECHNICAL_DEBT_SCORE',
        startingValue: 70,
        targetValue: 40,
        currentValue: 50,
        progressPercentage: 66,
        startDate: new Date(Date.now() - 30 * 86400000),
        targetDate: new Date(Date.now() + 60 * 86400000), // 33% elapsed
        status: 'ACTIVE',
        unit: 'pts',
      } as unknown as IEngineeringGoal;

      const snapshots = [
        createSnapshot('s1', 30, 70, 3, 100, 200, 100000),
        createSnapshot('s2', 15, 60, 2, 90, 180, 85000),
        createSnapshot('s3', 0, 50, 1, 80, 160, 70000),
      ];

      const forecasts = GoalForecastEngine.forecastGoals([goal], snapshots);
      expect(forecasts[0].status).toBe('ON TRACK');
    });

    it('should detect LIKELY TO MISS when goal metric is regressing', () => {
      const goal = {
        title: 'Reduce Critical Hotspots to 1',
        metric: 'CRITICAL_HOTSPOTS',
        startingValue: 3,
        targetValue: 1,
        currentValue: 4,
        progressPercentage: 0,
        startDate: new Date(Date.now() - 30 * 86400000),
        targetDate: new Date(Date.now() + 10 * 86400000),
        status: 'ACTIVE',
        unit: 'hotspots',
      } as unknown as IEngineeringGoal;

      const snapshots = [
        createSnapshot('s1', 30, 50, 2, 100, 200, 100000),
        createSnapshot('s2', 15, 60, 3, 110, 250, 120000),
        createSnapshot('s3', 0, 70, 4, 130, 350, 150000),
      ];

      const forecasts = GoalForecastEngine.forecastGoals([goal], snapshots);
      expect(forecasts[0].status).toBe('LIKELY TO MISS');
    });
  });

  describe('PredictiveRecommendationService & Capacity Planning', () => {
    it('should generate next best actions with explainability and fit sprint capacity', () => {
      const mockHotspots = [
        {
          filePath: 'src/payment/service.ts',
          currentRisk: 'HIGH',
          predictedRisk: 'CRITICAL',
          riskTrend: 'ACCELERATING',
          confidence: 'HIGH',
          primaryDrivers: ['Complexity +25%', 'High recent churn'],
          complexityGrowthPct: 25,
          churnGrowthPct: 35,
          defectActivityCount: 4,
          financialExposure: 240000,
          recommendedAction: 'Decouple processor and refactor branches',
        },
        {
          filePath: 'src/orders/validator.ts',
          currentRisk: 'MEDIUM',
          predictedRisk: 'HIGH',
          riskTrend: 'WORSENING',
          confidence: 'HIGH',
          primaryDrivers: ['Moderate churn'],
          complexityGrowthPct: 15,
          churnGrowthPct: 20,
          defectActivityCount: 1,
          financialExposure: 110000,
          recommendedAction: 'Extract validation rules',
        },
      ];

      const confEval = { confidenceLevel: 'HIGH' as const } as any;
      const actions = PredictiveRecommendationService.generateRecommendations(mockHotspots, confEval);

      expect(actions.length).toBe(2);
      expect(actions[0].target).toBe('src/payment/service.ts');
      expect(actions[0].riskDrivers.length).toBeGreaterThan(0);

      // Capacity planner
      const plan = PredictiveRecommendationService.planSprintCapacity(actions, 40);
      expect(plan.sprintCapacityHours).toBe(40);
      expect(plan.allocatedRemediationHours).toBeLessThanOrEqual(40);
      expect(plan.selectedActions.length).toBeGreaterThanOrEqual(1);

      // Feedback
      PredictiveRecommendationService.recordFeedback(actions[0].actionId, 'HELPFUL');
      const stats = PredictiveRecommendationService.getFeedbackStats();
      expect(stats.helpful).toBe(1);
    });
  });

  describe('PredictionEvaluationService & Forecast Accuracy', () => {
    it('should record forecast evaluation and calculate statistical accuracy', async () => {
      const repoId = 'repo-eval-test';

      const priorAssessment: any = {
        repositoryId: repoId,
        analysisId: 'analysis-prior',
        forecastHorizon: 'NEXT_ANALYSIS',
        confidence: 'HIGH',
        predictedDebtScore: { low: 68, expected: 72, high: 76 },
        predictedFinancialExposure: { low: 180000, expected: 200000, high: 220000 },
        predictedCriticalHotspots: { low: 2, expected: 3, high: 4 },
      };

      const actualSnapshot = createSnapshot('analysis-actual', 0, 73, 3, 150, 400, 205000);

      const evals = await PredictionEvaluationService.evaluatePredictions(
        repoId,
        priorAssessment,
        actualSnapshot
      );

      expect(evals.length).toBe(3);
      expect(evals[0].withinRange).toBe(true); // 73 is within [68, 76]
      expect(evals[0].predictionError).toBe(1); // 73 - 72

      const accuracy = await PredictionEvaluationService.computeAccuracyReport(repoId);
      expect(accuracy.totalEvaluated).toBe(3);
      expect(accuracy.rangeCoveragePercentage).toBe(100);
      expect(accuracy.overallAccuracyPercentage).toBeGreaterThanOrEqual(90);
      expect(accuracy.meanAbsoluteError).toBeLessThan(5000);
    });
  });
});
