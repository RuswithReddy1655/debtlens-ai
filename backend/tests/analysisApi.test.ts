import request from 'supertest';
import app from '../src/app';
import { setupSampleRepository, SAMPLE_REPO_DIR } from './fixtures/setupSampleRepo';
import { AnalysisOrchestrator } from '../src/services/analysis/AnalysisOrchestrator';

describe('Phase 2 Analysis API Endpoints & Real Telemetry', () => {
  let fixtureRepoPath: string;
  let testRepoId: string;
  let authToken: string;

  beforeAll(async () => {
    fixtureRepoPath = setupSampleRepository();

    // Login or use mock token for authenticated routes
    authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock';

    // Register test fixture repo
    const repoRes = await request(app)
      .post('/api/repositories')
      .set('Authorization', authToken)
      .send({
        name: 'sample-fixture',
        owner: 'test-org',
        url: fixtureRepoPath,
        defaultBranch: 'main',
      });

    expect(repoRes.status).toBe(201);
    testRepoId = repoRes.body.data._id || repoRes.body.data.id;
  });

  describe('POST /api/analyses & Real Orchestration', () => {
    it('should initiate real repository analysis and return 202 with isDemoSource: false', async () => {
      const res = await request(app)
        .post('/api/analyses')
        .set('Authorization', authToken)
        .send({
          repositoryId: testRepoId,
          branch: 'main',
          hourlyRate: 100,
        });

      expect([201, 202]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.isDemoSource).toBe(false);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('queued');

      const analysisId = res.body.data.id || res.body.data._id;

      // Check status polling endpoint
      const statusRes = await request(app)
        .get(`/api/analyses/${analysisId}/status`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.success).toBe(true);
      expect(statusRes.body.data.progress).toBeGreaterThanOrEqual(0);
      expect(statusRes.body.data.currentStage).toBeDefined();
    });

    it('should allow polling status on demo analysis with 100% completed status', async () => {
      const res = await request(app)
        .get('/api/analyses/analysis-demo-fintech-01/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isDemoSource).toBe(true);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.progress).toBe(100);
    });

    it('should return 404 for status of an unknown analysis ID', async () => {
      const res = await request(app)
        .get('/api/analyses/unknown-nonexistent-id/status');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Real Analysis Metrics, Hotspots & Cost Retrieval', () => {
    let completedAnalysisId: string;

    beforeAll(async () => {
      completedAnalysisId = `analysis-real-api-${Date.now()}`;
      await AnalysisOrchestrator.runAnalysis({
        analysisId: completedAnalysisId,
        repositoryId: testRepoId,
        repoUrl: fixtureRepoPath,
        branch: 'main',
        hourlyRate: 95,
      });
    }, 35000);

    it('GET /api/analyses/:id should return real analysis without demo flag', async () => {
      const res = await request(app)
        .get(`/api/analyses/${completedAnalysisId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isDemoSource).toBe(false);
      expect(res.body.data.summary).toBeDefined();
    });

    it('GET /api/analyses/:id/metrics should return real file-level metrics with isDemoSource: false', async () => {
      const res = await request(app)
        .get(`/api/analyses/${completedAnalysisId}/metrics`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isDemoSource).toBe(false);
      expect(res.body.count).toBeGreaterThanOrEqual(4);
      expect(res.body.data[0].filePath).toBeDefined();
      expect(res.body.data[0].isDemo).toBe(false);
    });

    it('GET /api/analyses/:id/hotspots should return real hotspots with isDemoSource: false', async () => {
      const res = await request(app)
        .get(`/api/analyses/${completedAnalysisId}/hotspots`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isDemoSource).toBe(false);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/analyses/:id/cost should return real financial estimate with isDemoSource: false', async () => {
      const res = await request(app)
        .get(`/api/analyses/${completedAnalysisId}/cost?hourlyRate=105`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isDemoSource).toBe(false);
      expect(res.body.data.estimatedRemediationInvestment).toBeDefined();
      expect(res.body.data.estimatedFutureAvoidableCost).toBeDefined();
    });
  });
});
