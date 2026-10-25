import {
  RepositoryConnection,
  IRepositoryConnection,
  AnalysisFrequency,
  ConnectionStatus,
} from '../../models/RepositoryConnection';
import { AnalysisOrchestrator } from '../analysis/AnalysisOrchestrator';
import { AuditTrailService } from '../audit/AuditTrailService';
import { getDatabaseStatus } from '../../config/database';

// In-memory fallback
const memoryConnections = new Map<string, IRepositoryConnection>();

export class ScheduledAnalysisService {
  /**
   * Computes the next analysis execution timestamp based on frequency.
   */
  static computeNextRunDate(frequency: AnalysisFrequency): Date | undefined {
    const now = new Date();
    switch (frequency) {
      case 'DAILY':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'WEEKLY':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'AFTER_PUSH':
      case 'AFTER_MERGE':
      case 'MANUAL':
      default:
        return undefined;
    }
  }

  /**
   * Connects a repository to continuous intelligence.
   */
  static async connectRepository(payload: {
    userId?: string;
    provider?: 'github' | 'gitlab' | 'bitbucket' | 'local';
    providerRepositoryId: string;
    repositoryId: any;
    repositoryName: string;
    owner: string;
    defaultBranch?: string;
    visibility?: 'public' | 'private';
    analysisFrequency?: AnalysisFrequency;
    webhookEnabled?: boolean;
  }): Promise<IRepositoryConnection> {
    const isDbConnected = getDatabaseStatus().isConnected;
    const frequency = payload.analysisFrequency || 'DAILY';
    const nextAnalysisAt = this.computeNextRunDate(frequency);

    const docData: any = {
      userId: payload.userId || 'system-user',
      provider: payload.provider || 'github',
      providerRepositoryId: payload.providerRepositoryId,
      repositoryId: payload.repositoryId,
      repositoryName: payload.repositoryName,
      owner: payload.owner,
      defaultBranch: payload.defaultBranch || 'main',
      visibility: payload.visibility || 'public',
      connectionStatus: 'CONNECTED' as ConnectionStatus,
      analysisFrequency: frequency,
      nextAnalysisAt,
      webhookEnabled: payload.webhookEnabled ?? false,
    };

    if (isDbConnected) {
      const conn = await RepositoryConnection.findOneAndUpdate(
        { provider: docData.provider, providerRepositoryId: docData.providerRepositoryId },
        docData,
        { upsert: true, new: true }
      );

      await AuditTrailService.logEvent({
        repositoryId: payload.repositoryId.toString(),
        action: 'REPO_CONNECTED',
        targetId: (conn as any)._id.toString(),
        targetType: 'CONNECTION',
        description: `Connected repository ${payload.owner}/${payload.repositoryName} with ${frequency} schedule.`,
        metadata: docData,
      });

      return conn;
    }

    const memDoc = {
      ...docData,
      _id: `conn-${Date.now()}`,
      id: `conn-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IRepositoryConnection;

    memoryConnections.set(docData.providerRepositoryId, memDoc);

    await AuditTrailService.logEvent({
      repositoryId: payload.repositoryId.toString(),
      action: 'REPO_CONNECTED',
      targetId: (memDoc as any)._id,
      targetType: 'CONNECTION',
      description: `Connected repository ${payload.owner}/${payload.repositoryName} with ${frequency} schedule.`,
      metadata: docData,
    });

    return memDoc;
  }

  /**
   * Alias for connectRepository
   */
  static async registerConnection(payload: any): Promise<IRepositoryConnection> {
    return this.connectRepository(payload);
  }

  /**
   * Updates analysis schedule frequency and optional webhook setting.
   */
  static async updateSchedule(
    connectionId: string,
    frequency: AnalysisFrequency,
    webhookEnabled?: boolean
  ): Promise<IRepositoryConnection | null> {
    const isDbConnected = getDatabaseStatus().isConnected;
    const nextAnalysisAt = this.computeNextRunDate(frequency);
    const updateObj: any = { analysisFrequency: frequency, nextAnalysisAt };
    if (webhookEnabled !== undefined) {
      updateObj.webhookEnabled = webhookEnabled;
    }

    if (isDbConnected) {
      return RepositoryConnection.findByIdAndUpdate(
        connectionId,
        updateObj,
        { new: true }
      );
    }

    for (const conn of memoryConnections.values()) {
      if ((conn as any)._id === connectionId || (conn as any).id === connectionId) {
        conn.analysisFrequency = frequency;
        conn.nextAnalysisAt = nextAnalysisAt;
        if (webhookEnabled !== undefined) {
          conn.webhookEnabled = webhookEnabled;
        }
        return conn;
      }
    }
    return null;
  }

  /**
   * Disconnects a repository.
   */
  static async disconnectRepository(connectionId: string): Promise<boolean> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      const conn = await RepositoryConnection.findByIdAndUpdate(
        connectionId,
        { connectionStatus: 'DISCONNECTED', nextAnalysisAt: undefined },
        { new: true }
      );
      if (conn) {
        await AuditTrailService.logEvent({
          repositoryId: conn.repositoryId.toString(),
          action: 'REPO_DISCONNECTED',
          targetId: connectionId,
          targetType: 'CONNECTION',
          description: `Disconnected repository ${conn.repositoryName}.`,
        });
        return true;
      }
      return false;
    }

    for (const [key, conn] of memoryConnections.entries()) {
      if ((conn as any)._id === connectionId || (conn as any).id === connectionId) {
        conn.connectionStatus = 'DISCONNECTED';
        conn.nextAnalysisAt = undefined;
        await AuditTrailService.logEvent({
          repositoryId: conn.repositoryId.toString(),
          action: 'REPO_DISCONNECTED',
          targetId: connectionId,
          targetType: 'CONNECTION',
          description: `Disconnected repository ${conn.repositoryName}.`,
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Alias for disconnectRepository returning connection.
   */
  static async disconnect(connectionId: string): Promise<IRepositoryConnection | null> {
    const connections = await this.getConnections();
    const conn = connections.find(
      (c) => (c as any)._id?.toString() === connectionId || (c as any).id === connectionId
    );
    if (!conn) return null;
    await this.disconnectRepository(connectionId);
    conn.connectionStatus = 'DISCONNECTED';
    return conn;
  }

  /**
   * Retrieves all repository connections.
   */
  static async getConnections(): Promise<IRepositoryConnection[]> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      return RepositoryConnection.find().sort({ createdAt: -1 });
    }
    return Array.from(memoryConnections.values());
  }

  /**
   * Triggers an immediate analysis run for a connected repository.
   */
  static async triggerAnalysis(connectionId: string): Promise<{ success: boolean; analysisId: string }> {
    const connections = await this.getConnections();
    const conn = connections.find(
      (c) => (c as any)._id?.toString() === connectionId || (c as any).id === connectionId
    );

    if (!conn) {
      throw new Error(`Repository connection "${connectionId}" not found.`);
    }

    const repoId = conn.repositoryId.toString();

    // Check if an analysis job is already actively running for this repo
    const currentStatus = AnalysisOrchestrator.getJobStatus(repoId);
    if (
      currentStatus &&
      currentStatus.status !== 'completed' &&
      currentStatus.status !== 'failed' &&
      currentStatus.status !== 'cancelled'
    ) {
      return { success: true, analysisId: currentStatus.analysisId };
    }

    const analysisId = `analysis-${Date.now()}`;
    const repoUrl = `https://github.com/${conn.repositoryName}.git`;

    // Trigger analysis asynchronously
    AnalysisOrchestrator.runAnalysis({
      analysisId,
      repositoryId: repoId,
      repoUrl,
      branch: conn.defaultBranch || 'main',
      hourlyRate: 95,
    }).catch((err) => {
      console.error(`[ScheduledAnalysisService] Scheduled analysis error: ${err.message}`);
    });

    conn.lastAnalysisId = analysisId;
    conn.lastAnalysisAt = new Date();
    conn.nextAnalysisAt = this.computeNextRunDate(conn.analysisFrequency);

    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected && typeof (conn as any).save === 'function') {
      await (conn as any).save();
    }

    return { success: true, analysisId };
  }

  /**
   * Alias for triggerAnalysis
   */
  static async triggerAnalysisNow(connectionId: string): Promise<{ success: boolean; analysisId: string }> {
    return this.triggerAnalysis(connectionId);
  }

  /**
   * Clears in-memory store (testing).
   */
  static clearMemory(): void {
    memoryConnections.clear();
  }
}
