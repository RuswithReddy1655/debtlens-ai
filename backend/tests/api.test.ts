import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('DebtLens AI REST API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 and healthy status with service metadata', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('DebtLens AI Intelligence Core');
      expect(res.body.database).toBeDefined();
    });
  });

  describe('GET /api/repositories', () => {
    it('should return 200 and a list of repositories', async () => {
      const res = await request(app).get('/api/repositories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toBeDefined();
    });
  });

  describe('GET /api/repositories/:id', () => {
    it('should return 200 for a valid demo repository ID', async () => {
      const res = await request(app).get('/api/repositories/repo-demo-fintech-01');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('fintech-core-ledger');
      expect(res.body.data.isDemo).toBe(true);
    });

    it('should return 404 for an unknown repository ID', async () => {
      const res = await request(app).get('/api/repositories/non-existent-repo-999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REPOSITORY_NOT_FOUND');
    });
  });

  describe('POST /api/repositories', () => {
    it('should return 400 validation error when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/repositories')
        .send({ name: 'incomplete-repo' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 201 when registering a valid repository', async () => {
      const res = await request(app)
        .post('/api/repositories')
        .send({
          name: 'billing-service',
          owner: 'acme-org',
          url: 'https://github.com/acme-org/billing-service',
          defaultBranch: 'main',
          description: 'Recurring billing and subscription state engine',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('billing-service');
    });
  });

  describe('GET /api/analyses/:id', () => {
    it('should return analysis details and summary', async () => {
      const res = await request(app).get('/api/analyses/analysis-demo-fintech-01');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.totalFiles).toBeGreaterThan(0);
      expect(res.body.data.summary.overallHealthScore).toBeDefined();
    });
  });

  describe('GET /api/analyses/:id/hotspots', () => {
    it('should return prioritized list of code hotspots', async () => {
      const res = await request(app).get('/api/analyses/analysis-demo-fintech-01/hotspots');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].rank).toBe(1);
      expect(res.body.data[0].riskLevel).toBeDefined();
      expect(res.body.data[0].debtScore).toBeDefined();
    });
  });

  describe('GET /api/analyses/:id/metrics', () => {
    it('should return file-level complexity and churn metrics', async () => {
      const res = await request(app).get('/api/analyses/analysis-demo-fintech-01/metrics');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].filePath).toBeDefined();
      expect(res.body.data[0].linesOfCode).toBeGreaterThan(0);
    });
  });

  describe('GET /api/analyses/:id/trends', () => {
    it('should return historical debt and health trends', async () => {
      const res = await request(app).get('/api/analyses/repo-demo-fintech-01/trends');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].date).toBeDefined();
      expect(res.body.data[0].healthScore).toBeDefined();
    });
  });

  describe('GET /api/analyses/:id/recommendations', () => {
    it('should return ROI-prioritized refactoring recommendations', async () => {
      const res = await request(app).get('/api/analyses/analysis-demo-fintech-01/recommendations');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].priority).toBeDefined();
      expect(res.body.data[0].roiRatio).toBeGreaterThan(0);
      expect(res.body.data[0].actionPlan.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/analyses/:id/cost', () => {
    it('should return complete financial valuation with transparent formula traces', async () => {
      const res = await request(app).get('/api/analyses/analysis-demo-fintech-01/cost?hourlyRate=110');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hourlyRate).toBe(110);
      expect(res.body.data.estimatedRemediationInvestment.trace).toBeDefined();
      expect(res.body.data.historicalMaintenanceReworkBurden.trace).toBeDefined();
      expect(res.body.data.estimatedFutureAvoidableCost.trace).toBeDefined();
      expect(res.body.data.potentialRefactoringBenefit.trace).toBeDefined();
      expect(res.body.data.disclaimer).toBeDefined();
    });
  });
});
