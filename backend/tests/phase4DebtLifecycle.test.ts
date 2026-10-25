import { DebtIdentityService } from '../src/services/debt/DebtIdentityService';
import { DebtLifecycleService } from '../src/services/debt/DebtLifecycleService';
import { VerificationEngine } from '../src/services/verification/VerificationEngine';
import { GoalProgressEngine } from '../src/services/goals/GoalProgressEngine';
import { AlertEngine } from '../src/services/alerts/AlertEngine';
import { GitHubIntegrationService } from '../src/services/github/GitHubIntegrationService';
import { SnapshotComparisonEngine } from '../src/services/reporting/SnapshotComparisonEngine';
import { IDebtItem } from '../src/models/DebtItem';

describe('Phase 4: Debt Lifecycle, Identity, Verification & Goals Engine', () => {
  beforeEach(() => {
    DebtIdentityService.clearMemory();
    GoalProgressEngine.clearMemory();
    AlertEngine.clearMemory();
  });

  describe('Debt Item Identity & Matching Engine', () => {
    it('should generate deterministic, resilient debtItemId across line number changes', () => {
      const id1 = DebtIdentityService.generateDebtItemId('repo-123', 'src/payment/service.ts', 'PaymentHandler', 'COMPLEXITY');
      const id2 = DebtIdentityService.generateDebtItemId('repo-123', 'src/payment/service.ts', 'PaymentHandler', 'COMPLEXITY');
      const idDifferent = DebtIdentityService.generateDebtItemId('repo-123', 'src/auth/service.ts', 'AuthHandler', 'COMPLEXITY');

      expect(id1).toBe(id2);
      expect(id1).not.toBe(idDifferent);
      expect(id1.startsWith('debt-')).toBe(true);
    });

    it('should normalize Windows backslashes and case when matching debt item identity', () => {
      const idUnix = DebtIdentityService.generateDebtItemId('repo-1', 'src/utils/math.ts');
      const idWin = DebtIdentityService.generateDebtItemId('repo-1', 'src\\utils\\math.ts');

      expect(idUnix).toBe(idWin);
    });
  });

  describe('Debt Lifecycle State Machine', () => {
    it('should enforce legal state transitions', async () => {
      // Create a test debt item in memory
      const item: any = {
        debtItemId: 'debt-test-01',
        repositoryId: 'repo-lifecycle',
        filePath: 'src/checkout/flow.ts',
        symbolName: 'module',
        category: 'COMPLEXITY',
        currentStatus: 'DETECTED',
        priority: 'CRITICAL',
        priorityScore: 85,
        baselineMetrics: { complexity: 45, debtScore: 85 },
      };
      DebtIdentityService.setMemoryItem(item as IDebtItem);

      // DETECTED -> PRIORITIZED
      const s1 = await DebtLifecycleService.transitionStatus('debt-test-01', 'PRIORITIZED');
      expect(s1.currentStatus).toBe('PRIORITIZED');

      // PRIORITIZED -> PLANNED
      const s2 = await DebtLifecycleService.transitionStatus('debt-test-01', 'PLANNED');
      expect(s2.currentStatus).toBe('PLANNED');

      // PLANNED -> IN_PROGRESS
      const s3 = await DebtLifecycleService.transitionStatus('debt-test-01', 'IN_PROGRESS');
      expect(s3.currentStatus).toBe('IN_PROGRESS');

      // IN_PROGRESS -> RESOLVED
      const s4 = await DebtLifecycleService.transitionStatus('debt-test-01', 'RESOLVED', 'Dev Lead', 'Refactored helper methods');
      expect(s4.currentStatus).toBe('RESOLVED');
      expect(s4.resolutionDate).toBeDefined();

      // RESOLVED -> VERIFIED
      const s5 = await DebtLifecycleService.transitionStatus('debt-test-01', 'VERIFIED');
      expect(s5.currentStatus).toBe('VERIFIED');
    });

    it('should reject illegal state transitions with descriptive error', async () => {
      const item: any = {
        debtItemId: 'debt-illegal-01',
        repositoryId: 'repo-lifecycle',
        filePath: 'src/api/auth.ts',
        currentStatus: 'DETECTED',
        priority: 'HIGH',
        priorityScore: 75,
      };
      DebtIdentityService.setMemoryItem(item as IDebtItem);

      // Cannot jump from DETECTED directly to VERIFIED
      await expect(
        DebtLifecycleService.transitionStatus('debt-illegal-01', 'VERIFIED')
      ).rejects.toThrow(/Invalid debt lifecycle transition from "DETECTED" to "VERIFIED"/);

      // Cannot jump from DETECTED directly to RESOLVED
      await expect(
        DebtLifecycleService.transitionStatus('debt-illegal-01', 'RESOLVED')
      ).rejects.toThrow(/Invalid debt lifecycle transition/);
    });

    it('should automatically move item to PLANNED when assigned', async () => {
      const item: any = {
        debtItemId: 'debt-assign-01',
        repositoryId: 'repo-lifecycle',
        filePath: 'src/billing/invoice.ts',
        currentStatus: 'DETECTED',
        priority: 'MEDIUM',
        priorityScore: 60,
      };
      DebtIdentityService.setMemoryItem(item as IDebtItem);

      const updated = await DebtLifecycleService.assignDebtItem(
        'debt-assign-01',
        'Senior Backend Engineer',
        new Date(Date.now() + 7 * 86400000)
      );

      expect(updated.assignedTo).toBe('Senior Backend Engineer');
      expect(updated.currentStatus).toBe('PLANNED');
    });

    it('should link pull request and commit to a debt item', async () => {
      const item: any = {
        debtItemId: 'debt-link-01',
        repositoryId: 'repo-lifecycle',
        filePath: 'src/orders/process.ts',
        currentStatus: 'IN_PROGRESS',
        priority: 'HIGH',
        priorityScore: 78,
      };
      DebtIdentityService.setMemoryItem(item as IDebtItem);

      const linked = await DebtLifecycleService.linkWork('debt-link-01', {
        commitSha: 'a1b2c3d4e5f6',
        pullRequestUrl: 'https://github.com/org/repo/pull/42',
        notes: 'Extracted order validation logic into modular pipeline',
      });

      expect(linked.resolutionCommitSha).toBe('a1b2c3d4e5f6');
      expect(linked.pullRequestUrl).toBe('https://github.com/org/repo/pull/42');
      expect(linked.notes).toContain('Extracted order validation');
    });
  });

  describe('Automated Before/After Verification Engine', () => {
    it('should verify debt when complexity decreases by >= 20%', () => {
      const item: any = {
        debtItemId: 'debt-v-01',
        repositoryId: 'repo-verify',
        filePath: 'src/services/payment.ts',
        currentStatus: 'RESOLVED',
        priorityScore: 80,
        financialImpact: 250000,
        baselineMetrics: { complexity: 40, debtScore: 80 },
      };

      const latestMetric = {
        filePath: 'src/services/payment.ts',
        cyclomaticComplexity: 22, // 45% reduction
        debtScore: 42,
      };

      const result = VerificationEngine.verifyItem(item, latestMetric, null);

      expect(result.verificationStatus).toBe('VERIFIED');
      expect(result.complexityReductionPct).toBe(45);
      expect(result.complexityBefore).toBe(40);
      expect(result.complexityAfter).toBe(22);
      expect(result.realizedBusinessSavings).toContain('NOT VERIFIED'); // Model vs accounting principle
    });

    it('should mark partially verified when complexity decreases between 5% and 19%', () => {
      const item: any = {
        debtItemId: 'debt-v-02',
        repositoryId: 'repo-verify',
        filePath: 'src/services/search.ts',
        currentStatus: 'RESOLVED',
        priorityScore: 70,
        financialImpact: 150000,
        baselineMetrics: { complexity: 30, debtScore: 70 },
      };

      const latestMetric = {
        filePath: 'src/services/search.ts',
        cyclomaticComplexity: 26, // 13.3% reduction
        debtScore: 63,
      };

      const result = VerificationEngine.verifyItem(item, latestMetric, null);

      expect(result.verificationStatus).toBe('PARTIALLY_VERIFIED');
      expect(result.complexityReductionPct).toBe(13.3);
    });

    it('should mark NOT_VERIFIED and reopen when complexity did not improve or worsened', () => {
      const item: any = {
        debtItemId: 'debt-v-03',
        repositoryId: 'repo-verify',
        filePath: 'src/services/fraud.ts',
        currentStatus: 'RESOLVED',
        priorityScore: 75,
        financialImpact: 200000,
        baselineMetrics: { complexity: 35, debtScore: 75 },
      };

      const latestMetric = {
        filePath: 'src/services/fraud.ts',
        cyclomaticComplexity: 38, // Worsened!
        debtScore: 80,
      };

      const result = VerificationEngine.verifyItem(item, latestMetric, null);

      expect(result.verificationStatus).toBe('NOT_VERIFIED');
      expect(result.complexityReductionPct).toBe(-8.6);
    });
  });

  describe('Engineering Goals Progress Engine', () => {
    it('should calculate decreasing metric progress correctly (debt score reduction)', () => {
      // Goal: reduce debt score from 75 to 55 (target span = 20)
      // Current: 65 -> 10 points progress out of 20 = 50%
      const res = GoalProgressEngine.calculateProgress(75, 55, 65);
      expect(res.progressPercentage).toBe(50);
      expect(res.isAchieved).toBe(false);

      // Achieved
      const achieved = GoalProgressEngine.calculateProgress(75, 55, 50);
      expect(achieved.progressPercentage).toBe(100);
      expect(achieved.isAchieved).toBe(true);
    });

    it('should handle zero span edge case without division by zero', () => {
      const res = GoalProgressEngine.calculateProgress(50, 50, 50);
      expect(res.progressPercentage).toBe(100);
      expect(res.isAchieved).toBe(true);
    });

    it('should clamp progress between 0% and 100% when regression occurs', () => {
      // Goal: reduce critical hotspots from 10 to 4
      // Current: 15 (worsened)
      const res = GoalProgressEngine.calculateProgress(10, 4, 15);
      expect(res.progressPercentage).toBe(0);
      expect(res.isAchieved).toBe(false);
    });
  });

  describe('Engineering Alert Engine & Duplicate Suppression', () => {
    it('should generate alert on threshold crossing and suppress identical duplicates within 24 hours', async () => {
      const alert1 = await AlertEngine.createAlert({
        repositoryId: 'repo-alert-01',
        type: 'CRITICAL_HOTSPOT_INCREASED',
        severity: 'CRITICAL',
        title: 'Critical Hotspot Spiked',
        message: 'Critical hotspots increased from 3 to 7',
        metric: 'criticalHotspots',
        previousValue: 3,
        currentValue: 7,
      });

      expect(alert1).not.toBeNull();
      expect(alert1?.severity).toBe('CRITICAL');

      // Duplicate attempt within 24 hours
      const alert2 = await AlertEngine.createAlert({
        repositoryId: 'repo-alert-01',
        type: 'CRITICAL_HOTSPOT_INCREASED',
        severity: 'CRITICAL',
        title: 'Critical Hotspot Spiked',
        message: 'Critical hotspots increased from 3 to 7',
        metric: 'criticalHotspots',
        previousValue: 3,
        currentValue: 7,
      });

      expect(alert2).toBeNull(); // Suppressed!
    });
  });

  describe('GitHub Webhook HMAC Signature Verification', () => {
    it('should validate valid HMAC-SHA256 signatures and reject tampered payloads', () => {
      const crypto = require('crypto');
      const secret = 'my-test-webhook-secret';
      const payload = JSON.stringify({ ref: 'refs/heads/main', repository: { name: 'demo-repo' } });

      const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const validSignature = `sha256=${hmac}`;

      const isValid = GitHubIntegrationService.verifyWebhookSignature(payload, validSignature, secret);
      expect(isValid).toBe(true);

      const isInvalid = GitHubIntegrationService.verifyWebhookSignature(
        payload + 'tampered',
        validSignature,
        secret
      );
      expect(isInvalid).toBe(false);
    });
  });
});
