import { EngineeringAlert, IEngineeringAlert, AlertType, AlertSeverity, AlertStatus } from '../../models/EngineeringAlert';
import { getDatabaseStatus } from '../../config/database';

export interface CreateAlertPayload {
  repositoryId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metric?: string;
  previousValue?: number;
  currentValue?: number;
  threshold?: number;
}

// In-memory fallback
const memoryAlerts: IEngineeringAlert[] = [];

export class AlertEngine {
  /**
   * Creates an alert with intelligent duplicate suppression (prevents duplicate spam within 24h).
   */
  static async createAlert(payload: CreateAlertPayload): Promise<IEngineeringAlert | null> {
    const isDbConnected = getDatabaseStatus().isConnected;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Deduplication check
    if (isDbConnected) {
      const existing = await EngineeringAlert.findOne({
        repositoryId: payload.repositoryId,
        type: payload.type,
        metric: payload.metric,
        status: 'UNREAD',
        createdAt: { $gte: oneDayAgo },
      });
      if (existing) {
        return null; // Suppress duplicate
      }
    } else {
      const existingMem = memoryAlerts.find(
        (a) =>
          a.repositoryId === payload.repositoryId &&
          a.type === payload.type &&
          a.metric === payload.metric &&
          a.status === 'UNREAD' &&
          new Date(a.createdAt) >= oneDayAgo
      );
      if (existingMem) {
        return null;
      }
    }

    const alertDoc = {
      repositoryId: payload.repositoryId,
      type: payload.type,
      severity: payload.severity,
      title: payload.title,
      message: payload.message,
      metric: payload.metric,
      previousValue: payload.previousValue,
      currentValue: payload.currentValue,
      threshold: payload.threshold,
      status: 'UNREAD' as AlertStatus,
      createdAt: new Date(),
    };

    if (isDbConnected) {
      try {
        return await EngineeringAlert.create(alertDoc);
      } catch (err) {
        console.warn('[AlertEngine] DB save failed, using memory fallback:', err);
      }
    }

    const memDoc = {
      ...alertDoc,
      _id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      id: `alert-${Date.now()}`,
    } as unknown as IEngineeringAlert;

    memoryAlerts.unshift(memDoc);
    return memDoc;
  }

  /**
   * Retrieves alerts for a repository.
   */
  static async getAlerts(repositoryId?: string, status?: AlertStatus): Promise<IEngineeringAlert[]> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      const query: any = {};
      if (repositoryId) query.repositoryId = repositoryId;
      if (status) query.status = status;
      return EngineeringAlert.find(query).sort({ createdAt: -1 });
    }

    let list = memoryAlerts;
    if (repositoryId) list = list.filter((a) => a.repositoryId === repositoryId);
    if (status) list = list.filter((a) => a.status === status);
    return list;
  }

  /**
   * Updates an alert status (e.g. mark as READ or DISMISSED).
   */
  static async updateAlertStatus(alertId: string, status: AlertStatus): Promise<IEngineeringAlert | null> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      return EngineeringAlert.findByIdAndUpdate(
        alertId,
        { status, resolvedAt: status === 'RESOLVED' ? new Date() : undefined },
        { new: true }
      );
    }

    const item = memoryAlerts.find(
      (a) => (a as any)._id === alertId || (a as any).id === alertId
    );
    if (item) {
      item.status = status;
      if (status === 'RESOLVED') item.resolvedAt = new Date();
      return item;
    }
    return null;
  }

  /**
   * Dismisses all unread alerts for a repository.
   */
  static async dismissAll(repositoryId?: string): Promise<void> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      const query: any = { status: 'UNREAD' };
      if (repositoryId) query.repositoryId = repositoryId;
      await EngineeringAlert.updateMany(query, { status: 'DISMISSED' });
      return;
    }

    for (const a of memoryAlerts) {
      if ((!repositoryId || a.repositoryId === repositoryId) && a.status === 'UNREAD') {
        a.status = 'DISMISSED';
      }
    }
  }

  /**
   * Clears memory store (testing).
   */
  static clearMemory(): void {
    memoryAlerts.length = 0;
  }
}
