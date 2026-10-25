import { Request, Response } from 'express';
import {
  RepositoryConnection,
  DebtItem,
  EngineeringGoal,
  EngineeringAlert,
  AuditEvent,
  AnalysisSnapshot,
} from '../models';
import { GitHubIntegrationService } from '../services/github/GitHubIntegrationService';
import { ScheduledAnalysisService } from '../services/scheduler/ScheduledAnalysisService';
import { DebtIdentityService } from '../services/debt/DebtIdentityService';
import { DebtLifecycleService } from '../services/debt/DebtLifecycleService';
import { VerificationEngine } from '../services/verification/VerificationEngine';
import { GoalProgressEngine } from '../services/goals/GoalProgressEngine';
import { AlertEngine } from '../services/alerts/AlertEngine';
import { AuditTrailService } from '../services/audit/AuditTrailService';
import { AnalysisSnapshotService } from '../services/reporting/AnalysisSnapshotService';
import { SnapshotComparisonEngine } from '../services/reporting/SnapshotComparisonEngine';
import { AnalysisOrchestrator } from '../services/analysis/AnalysisOrchestrator';
import { getDatabaseStatus } from '../config/database';

export class Phase4Controller {
  // ==========================================
  // 1. GITHUB INTEGRATION & OAUTH
  // ==========================================

  static async getGitHubConnectUrl(req: Request, res: Response) {
    try {
      const redirectUri = (req.query.redirectUri as string) || process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/connections';
      const auth = GitHubIntegrationService.getAuthorizationUrl(redirectUri);
      return res.json({
        success: true,
        data: auth,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async handleGitHubCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.status(400).json({ success: false, error: 'Missing code or state parameter.' });
      }

      const result = await GitHubIntegrationService.handleOAuthCallback(
        code as string,
        state as string
      );

      await AuditTrailService.logEvent({
        repositoryId: 'global',
        action: 'REPO_CONNECTED',
        targetType: 'CONNECTION',
        targetId: result.isMock ? 'mock_user' : 'github_user',
        description: `GitHub OAuth connection established (mode: ${result.isMock ? 'Mock/Benchmarking' : 'Live GitHub'}).`,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getGitHubRepositories(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const repos = await GitHubIntegrationService.getUserRepositories(token);
      return res.json({
        success: true,
        data: repos,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 2. REPOSITORY CONNECTIONS & SCHEDULING
  // ==========================================

  static async getConnections(req: Request, res: Response) {
    try {
      const connections = await ScheduledAnalysisService.getConnections();
      return res.json({
        success: true,
        data: connections,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async connectRepository(req: Request, res: Response) {
    try {
      const {
        repositoryId,
        repositoryName,
        owner,
        provider = 'GITHUB',
        providerRepositoryId,
        defaultBranch = 'main',
        visibility = 'PUBLIC',
        analysisFrequency = 'MANUAL',
        webhookEnabled = false,
      } = req.body;

      if (!repositoryId || !repositoryName) {
        return res.status(400).json({ success: false, error: 'repositoryId and repositoryName are required.' });
      }

      const connection = await ScheduledAnalysisService.registerConnection({
        repositoryId,
        repositoryName,
        owner: owner || 'organization',
        provider,
        providerRepositoryId: providerRepositoryId || `gh-${Date.now()}`,
        defaultBranch,
        visibility,
        analysisFrequency,
        webhookEnabled,
      });

      await AuditTrailService.logEvent({
        repositoryId,
        action: 'REPO_CONNECTED',
        targetType: 'REPOSITORY',
        targetId: repositoryId,
        description: `Repository ${repositoryName} (${defaultBranch}) connected with ${analysisFrequency} analysis frequency.`,
      });

      return res.status(201).json({
        success: true,
        data: connection,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateSchedule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { analysisFrequency, webhookEnabled } = req.body;

      if (!analysisFrequency) {
        return res.status(400).json({ success: false, error: 'analysisFrequency is required.' });
      }

      const connection = await ScheduledAnalysisService.updateSchedule(id, analysisFrequency, webhookEnabled);
      if (!connection) {
        return res.status(404).json({ success: false, error: 'Connection not found.' });
      }

      return res.json({
        success: true,
        data: connection,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async disconnectRepository(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connection = await ScheduledAnalysisService.disconnect(id);
      if (!connection) {
        return res.status(404).json({ success: false, error: 'Connection not found.' });
      }

      await AuditTrailService.logEvent({
        repositoryId: id,
        action: 'REPO_DISCONNECTED',
        targetType: 'REPOSITORY',
        targetId: id,
        description: `Repository ${connection.repositoryName} disconnected from continuous analysis.`,
      });

      return res.json({
        success: true,
        data: connection,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async triggerAnalysis(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ScheduledAnalysisService.triggerAnalysisNow(id);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 3. ANALYSIS SNAPSHOTS & COMPARISON
  // ==========================================

  static async getSnapshots(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const snapshots = await AnalysisSnapshotService.getSnapshots(id, limit);
      return res.json({
        success: true,
        data: snapshots,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getComparison(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { baselineId, currentId } = req.query;

      const snapshots = await AnalysisSnapshotService.getSnapshots(id, 20);

      let current = currentId
        ? snapshots.find((s) => s.analysisId === currentId || (s as any)._id?.toString() === currentId)
        : snapshots[0];
      let baseline = baselineId
        ? snapshots.find((s) => s.analysisId === baselineId || (s as any)._id?.toString() === baselineId)
        : snapshots[1];

      if (!current) {
        return res.status(404).json({
          success: false,
          error: 'No analysis snapshots found for this repository.',
        });
      }

      if (!baseline) {
        return res.json({
          success: true,
          data: {
            overallStatus: 'INSUFFICIENT DATA',
            message: 'At least two analyses are required to calculate before/after comparisons and delta trends.',
            currentSnapshot: current,
          },
        });
      }

      const comparison = SnapshotComparisonEngine.compareSnapshots(baseline, current);
      return res.json({
        success: true,
        data: comparison,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 4. DEBT MANAGEMENT & LIFECYCLE
  // ==========================================

  static async getDebtItems(req: Request, res: Response) {
    try {
      const {
        repositoryId,
        status,
        priority,
        category,
        assignee,
      } = req.query;

      const items = await DebtLifecycleService.getDebtItems({
        repositoryId: repositoryId as string,
        status: status as any,
        priority: priority as any,
        category: category as any,
        assignedTo: assignee as string,
      });

      return res.json({
        success: true,
        data: items,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getDebtItemById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await DebtLifecycleService.getDebtItemById(id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Debt item not found.' });
      }
      return res.json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateDebtStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newStatus, actor = 'Lead Engineer', note } = req.body;

      if (!newStatus) {
        return res.status(400).json({ success: false, error: 'newStatus is required.' });
      }

      const item = await DebtLifecycleService.transitionStatus(id, newStatus, actor, note);
      return res.json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async assignDebtItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { assignedTo, targetDate, actor = 'Engineering Manager' } = req.body;

      const item = await DebtLifecycleService.assignDebtItem(
        id,
        assignedTo,
        targetDate ? new Date(targetDate) : undefined,
        actor
      );

      return res.json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async linkDebtWork(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { commitSha, prNumber, prUrl, branch, actor = 'Developer' } = req.body;

      const item = await DebtLifecycleService.linkWork(id, {
        commitSha,
        pullRequestUrl: prUrl,
        notes: `PR #${prNumber || ''} on branch ${branch || ''}`,
        actorId: actor,
      });

      return res.json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async verifyDebtItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await DebtLifecycleService.getDebtItemById(id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Debt item not found.' });
      }

      // Check latest file metrics from memory or DB
      const metricDocs = AnalysisOrchestrator.getFileMetrics(item.repositoryId) || [];
      const hotspotDocs = AnalysisOrchestrator.getHotspots(item.repositoryId) || [];
      const latestMetric = metricDocs.find((f: any) => f.filePath === item.filePath) || null;
      const latestHotspot = hotspotDocs.find((h: any) => h.filePath === item.filePath) || null;

      const verificationResult = VerificationEngine.verifyItem(
        item,
        latestMetric,
        latestHotspot,
        'manual-verification'
      );

      return res.json({
        success: true,
        data: verificationResult,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 5. ENGINEERING GOALS
  // ==========================================

  static async getGoals(req: Request, res: Response) {
    try {
      const { repositoryId } = req.query;
      const goals = await GoalProgressEngine.getGoals(repositoryId as string);
      return res.json({
        success: true,
        data: goals,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createGoal(req: Request, res: Response) {
    try {
      const {
        repositoryId,
        title,
        description,
        metric,
        targetValue,
        startingValue,
        unit,
        targetDate,
        createdBy = 'Engineering Team',
      } = req.body;

      if (!repositoryId || !title || !metric || targetValue === undefined || startingValue === undefined) {
        return res.status(400).json({
          success: false,
          error: 'repositoryId, title, metric, targetValue, and startingValue are required.',
        });
      }

      const goal = await GoalProgressEngine.createGoal({
        repositoryId,
        title,
        description,
        metric,
        targetValue,
        startingValue,
        unit: unit || '',
        targetDate: targetDate ? new Date(targetDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy,
      });

      return res.status(201).json({
        success: true,
        data: goal,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getGoalById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const goals = await GoalProgressEngine.getGoals();
      const goal = goals.find((g) => (g as any)._id?.toString() === id || (g as any).id === id);
      if (!goal) {
        return res.status(404).json({ success: false, error: 'Goal not found.' });
      }
      return res.json({
        success: true,
        data: goal,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const goal = await GoalProgressEngine.updateGoal(id, req.body);
      if (!goal) {
        return res.status(404).json({ success: false, error: 'Goal not found.' });
      }
      return res.json({
        success: true,
        data: goal,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const isDbConnected = getDatabaseStatus().isConnected;
      if (isDbConnected) {
        await EngineeringGoal.findByIdAndDelete(id);
      }
      return res.json({
        success: true,
        message: 'Goal deleted successfully.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 6. ENGINEERING ALERTS
  // ==========================================

  static async getAlerts(req: Request, res: Response) {
    try {
      const { repositoryId, status } = req.query;
      const alerts = await AlertEngine.getAlerts(repositoryId as string, status as any);
      return res.json({
        success: true,
        data: alerts,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateAlertStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: 'status is required.' });
      }

      const alert = await AlertEngine.updateAlertStatus(id, status);
      if (!alert) {
        return res.status(404).json({ success: false, error: 'Alert not found.' });
      }

      return res.json({
        success: true,
        data: alert,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async dismissAllAlerts(req: Request, res: Response) {
    try {
      const { repositoryId } = req.body;
      await AlertEngine.dismissAll(repositoryId);
      return res.json({
        success: true,
        message: 'All alerts dismissed.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 7. ACTIVITY AUDIT TRAIL
  // ==========================================

  static async getActivityLog(req: Request, res: Response) {
    try {
      const { repositoryId } = req.query;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const events = await AuditTrailService.getRecentEvents(repositoryId as string, limit);
      return res.json({
        success: true,
        data: events,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 8. GITHUB WEBHOOKS
  // ==========================================

  static async handleGitHubWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const event = req.headers['x-github-event'] as string;
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      // Verify signature if secret configured
      const secret = process.env.GITHUB_WEBHOOK_SECRET || 'debtlens-webhook-secret';
      const isValid = GitHubIntegrationService.verifyWebhookSignature(rawBody, signature, secret);

      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid webhook signature.' });
      }

      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const repoFullName = payload.repository?.full_name || payload.repository?.name;

      if (event === 'push') {
        const branch = payload.ref?.replace('refs/heads/', '') || 'main';
        const commitSha = payload.after || payload.head_commit?.id;

        console.log(`[Webhook] Push received for ${repoFullName} on ${branch} (${commitSha})`);

        // Find connection
        const connections = await ScheduledAnalysisService.getConnections();
        const connection = connections.find(
          (c) => c.repositoryName === repoFullName || c.repositoryId === repoFullName
        );

        if (connection && connection.webhookEnabled) {
          await ScheduledAnalysisService.triggerAnalysisNow(connection.repositoryId.toString());
          await AuditTrailService.logEvent({
            repositoryId: connection.repositoryId.toString(),
            actorType: 'WEBHOOK',
            action: 'ANALYSIS_TRIGGERED',
            targetType: 'ANALYSIS',
            targetId: commitSha || 'push',
            description: `Automated analysis queued by GitHub push webhook to ${branch}.`,
          });
        }
      }

      return res.json({
        success: true,
        received: true,
        event,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
