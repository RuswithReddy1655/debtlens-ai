import request from 'supertest';
import { app } from '../src/app';

describe('Phase 3 Financial Intelligence & Decision Support API Endpoints', () => {
  const demoAnalysisId = 'analysis-demo-fintech-01';

  describe('GET /api/analyses/:id/financial-intelligence', () => {
    it('should return complete financial intelligence with 4 quadrants, traces, and INR currency', async () => {
      const response = await request(app)
        .get(`/api/analyses/${demoAnalysisId}/financial-intelligence`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.currency).toBe('INR');
      expect(response.body.data.hourlyRate).toBe(2000);
      expect(response.body.data.summary.totalAnnualExposure).toBeGreaterThan(0);
      expect(response.body.data.fourQuadrants.estimatedRemediationInvestment.trace).toBeDefined();
    });

    it('should support dynamic currency and hourly rate overrides', async () => {
      const response = await request(app)
        .get(`/api/analyses/${demoAnalysisId}/financial-intelligence?currency=USD&hourlyRate=120`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currency).toBe('USD');
      expect(response.body.data.hourlyRate).toBe(120);
      expect(response.body.data.summary.formattedAnnualExposure).toContain('$');
    });

    it('should return 404 for non-existent analysis', async () => {
      await request(app)
        .get('/api/analyses/non-existent-analysis-id/financial-intelligence')
        .expect(404);
    });
  });

  describe('GET /api/analyses/:id/cost-drivers', () => {
    it('should return cost drivers breakdown and top cost driver files', async () => {
      const response = await request(app)
        .get(`/api/analyses/${demoAnalysisId}/cost-drivers`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.drivers.maintenanceFriction).toBeDefined();
      expect(response.body.data.drivers.defectFixBurden).toBeDefined();
      expect(response.body.data.topCostDriverFiles.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/analyses/:id/priorities', () => {
    it('should return prioritized debt items with Impact vs Effort matrix classification', async () => {
      const response = await request(app)
        .get(`/api/analyses/${demoAnalysisId}/priorities`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.priorities.length).toBeGreaterThan(0);
      expect(response.body.data.quadrantDistribution).toBeDefined();
      expect(response.body.data.tierDistribution).toBeDefined();

      const topPriority = response.body.data.priorities[0];
      expect(topPriority.rank).toBe(1);
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MONITOR']).toContain(topPriority.priorityTier);
      expect(['QUICK WINS', 'STRATEGIC', 'OPPORTUNISTIC', 'DEFER']).toContain(topPriority.matrixQuadrant);
    });
  });

  describe('GET /api/analyses/:id/savings', () => {
    it('should return modeled annual savings, residual drag, and payback horizon', async () => {
      const response = await request(app)
        .get(`/api/analyses/${demoAnalysisId}/savings`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.potentialAnnualSavings).toBeGreaterThan(0);
      expect(response.body.data.savingsRange).toBeDefined();
      expect(response.body.data.roiPercentage).toBeDefined();
    });
  });

  describe('POST /api/analyses/:id/scenarios', () => {
    it('should evaluate custom what-if scenario and return projected debt score and ROI', async () => {
      const payload = {
        scenarioName: 'Test Hotspot Refactoring',
        selectedFilePaths: ['src/services/paymentService.ts'],
        hourlyRate: 2000,
        remediationEffectiveness: 0.7,
        effortMultiplier: 1.0,
      };

      const response = await request(app)
        .post(`/api/analyses/${demoAnalysisId}/scenarios`)
        .send(payload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scenarioName).toBe('Test Hotspot Refactoring');
      expect(response.body.data.refactoringInvestment).toBeGreaterThan(0);
      expect(response.body.data.potentialAnnualSavings).toBeGreaterThan(0);
      expect(response.body.data.twoYearNetSavings).toBeDefined();
    });
  });

  describe('GET /api/analyses/:id/scenarios/presets', () => {
    it('should return 3-way preset scenario comparisons (Quick Wins vs Strategic vs Comprehensive)', async () => {
      const response = await request(app)
        .get(`/api/analyses/${demoAnalysisId}/scenarios/presets`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scenarios.length).toBe(3);
      expect(response.body.data.baselineAnnualImpact).toBeGreaterThan(0);
    });
  });

  describe('GET /api/analyses/:id/executive-report', () => {
    it('should generate an executive briefing report with markdown text', async () => {
      const response = await request(app)
        .get(`/api/analyses/${demoAnalysisId}/executive-report?repoName=PaymentPlatform`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.headlineSummary).toContain('PaymentPlatform');
      expect(response.body.data.markdownBrief).toContain('# Executive Briefing');
      expect(response.body.data.priorityActions.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/analyses/:id/compare', () => {
    it('should compare two analyses and calculate debt score and cost deltas', async () => {
      const response = await request(app)
        .post(`/api/analyses/${demoAnalysisId}/compare`)
        .send({
          targetAnalysisId: demoAnalysisId,
          currency: 'INR',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deltas).toBeDefined();
      expect(response.body.data.explanation).toBeDefined();
    });
  });

  describe('GET /api/portfolio', () => {
    it('should return aggregated cross-repository debt portfolio', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRepositories).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalDebtExposure).toBeGreaterThan(0);
      expect(response.body.data.repositories.length).toBeGreaterThanOrEqual(1);
    });
  });
});
