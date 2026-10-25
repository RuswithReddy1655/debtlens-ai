import request from 'supertest';
import { app } from '../src/app';
import { AnalysisSnapshotService } from '../src/services/reporting/AnalysisSnapshotService';
import { PredictiveOrchestrator } from '../src/services/predictive/PredictiveOrchestrator';
import { PredictionEvaluationService } from '../src/services/predictive/PredictionEvaluationService';
import { PredictiveRecommendationService } from '../src/services/predictive/PredictiveRecommendationService';

describe('Phase 5 Predictive Intelligence REST API Endpoints', () => {
  const repoId = 'repo-predictive-api-test';

  beforeAll(async () => {
    AnalysisSnapshotService.clearMemory();
    PredictiveOrchestrator.clearMemory();
    PredictionEvaluationService.clearMemory();
    PredictiveRecommendationService.clearMemory();

    // Seed historical snapshots to enable trend and forecasting
    await AnalysisSnapshotService.createSnapshot({
      analysisId: 'snap-api-01',
      repositoryId: repoId,
      timestamp: new Date(Date.now() - 30 * 86400000),
      linesOfCode: 12000,
      commitCount: 50,
      totalChurn: 500,
      codeAge: 60,
      complexity: 80,
      maxNesting: 4,
      hotspotCount: 5,
      criticalHotspotCount: 1,
      technicalDebtScore: 55,
      financialExposure: 110000,
      priorityDistribution: { critical: 1, high: 2, medium: 1, low: 1, monitor: 0 },
      telemetryConfidence: 'HIGH',
    });

    await AnalysisSnapshotService.createSnapshot({
      analysisId: 'snap-api-02',
      repositoryId: repoId,
      timestamp: new Date(Date.now() - 15 * 86400000),
      linesOfCode: 13500,
      commitCount: 75,
      totalChurn: 800,
      codeAge: 75,
      complexity: 105,
      maxNesting: 5,
      hotspotCount: 7,
      criticalHotspotCount: 2,
      technicalDebtScore: 66,
      financialExposure: 160000,
      priorityDistribution: { critical: 2, high: 3, medium: 1, low: 1, monitor: 0 },
      telemetryConfidence: 'HIGH',
    });

    await AnalysisSnapshotService.createSnapshot({
      analysisId: 'snap-api-03',
      repositoryId: repoId,
      timestamp: new Date(),
      linesOfCode: 15000,
      commitCount: 110,
      totalChurn: 1400,
      codeAge: 90,
      complexity: 135,
      maxNesting: 6,
      hotspotCount: 9,
      criticalHotspotCount: 3,
      technicalDebtScore: 78,
      financialExposure: 230000,
      priorityDistribution: { critical: 3, high: 4, medium: 1, low: 1, monitor: 0 },
      telemetryConfidence: 'HIGH',
    });
  });

  describe('GET /api/predictive/repositories/:id', () => {
    it('should return complete predictive assessment for the repository', async () => {
      const res = await request(app)
        .get(`/api/predictive/repositories/${repoId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.repositoryId).toBe(repoId);
      expect(res.body.data.riskScore).toBeGreaterThan(0);
      expect(res.body.data.riskLevel).toBeDefined();
      expect(res.body.data.confidence).toBeDefined();
      expect(res.body.data.costOfDoingNothing).toBeDefined();
    });

    it('should support horizon query parameter', async () => {
      const res = await request(app)
        .get(`/api/predictive/repositories/${repoId}?horizon=SHORT_TERM`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.forecastHorizon).toBe('SHORT_TERM');
    });
  });

  describe('GET /api/predictive/repositories/:id/forecast', () => {
    it('should return numeric and financial forecast ranges', async () => {
      const res = await request(app)
        .get(`/api/predictive/repositories/${repoId}/forecast`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.predictedDebtScore.expected).toBeDefined();
      expect(res.body.data.predictedFinancialExposure.formattedRange).toBeDefined();
      expect(res.body.data.costOfDoingNothing.potentialIncrease).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/predictive/repositories/:id/hotspots', () => {
    it('should return predicted hotspots with trajectory and drivers', async () => {
      const res = await request(app)
        .get(`/api/predictive/repositories/${repoId}/hotspots`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.predictedHotspots)).toBe(true);
      expect(res.body.data.predictedHotspots.length).toBeGreaterThan(0);
      expect(res.body.data.predictedHotspots[0].primaryDrivers).toBeDefined();
    });
  });

  describe('GET /api/predictive/repositories/:id/recommendations', () => {
    it('should return prioritized next best actions and feedback stats', async () => {
      const res = await request(app)
        .get(`/api/predictive/repositories/${repoId}/recommendations`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.recommendations)).toBe(true);
      expect(res.body.data.feedbackStats).toBeDefined();
    });
  });

  describe('POST /api/predictive/repositories/:id/refresh', () => {
    it('should force refresh the predictive assessment', async () => {
      const res = await request(app)
        .post(`/api/predictive/repositories/${repoId}/refresh`)
        .send({ horizon: 'NEXT_ANALYSIS', currency: 'INR' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('refreshed');
      expect(res.body.data).toBeDefined();
    });
  });

  describe('POST /api/predictive/scenarios', () => {
    it('should simulate What-If scenarios against baseline forecast', async () => {
      const res = await request(app)
        .post('/api/predictive/scenarios')
        .send({ repositoryId: repoId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.baselineForecast).toBeDefined();
      expect(Array.isArray(res.body.data.scenarios)).toBe(true);
      expect(res.body.data.scenarios.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/predictive/capacity-plan', () => {
    it('should fit predictive recommendations into engineering capacity hours', async () => {
      const res = await request(app)
        .post('/api/predictive/capacity-plan')
        .send({ repositoryId: repoId, sprintCapacityHours: 60 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sprintCapacityHours).toBe(60);
      expect(res.body.data.allocatedRemediationHours).toBeLessThanOrEqual(60);
      expect(res.body.data.selectedActions).toBeDefined();
    });
  });

  describe('POST /api/predictive/recommendations/:id/feedback', () => {
    it('should record user feedback successfully', async () => {
      const res = await request(app)
        .post('/api/predictive/recommendations/act-101/feedback')
        .send({ feedback: 'HELPFUL', userId: 'eng-lead-01' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.actionId).toBe('act-101');
      expect(res.body.data.feedback).toBe('HELPFUL');
    });

    it('should reject invalid feedback values', async () => {
      const res = await request(app)
        .post('/api/predictive/recommendations/act-101/feedback')
        .send({ feedback: 'INVALID_FEEDBACK' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/predictive/repositories/:id/accuracy', () => {
    it('should return prediction accuracy metrics report', async () => {
      const res = await request(app)
        .get(`/api/predictive/repositories/${repoId}/accuracy`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.repositoryId).toBe(repoId);
      expect(res.body.data.overallAccuracyPercentage).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
    });
  });
});
