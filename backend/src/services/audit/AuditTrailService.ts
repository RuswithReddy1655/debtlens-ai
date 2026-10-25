import { AuditEvent, IAuditEvent, AuditAction } from '../../models/AuditEvent';
import { getDatabaseStatus } from '../../config/database';

export interface AuditLogPayload {
  repositoryId: string;
  action: AuditAction;
  targetId: string;
  targetType: 'DEBT_ITEM' | 'GOAL' | 'REPOSITORY' | 'ANALYSIS' | 'CONNECTION';
  description: string;
  metadata?: Record<string, any>;
  actorId?: string;
  actorType?: 'USER' | 'SYSTEM' | 'WEBHOOK' | 'SCHEDULER';
}

// In-memory fallback
const memoryAuditEvents: IAuditEvent[] = [];

export class AuditTrailService {
  /**
   * Logs an audit event to MongoDB or in-memory fallback.
   */
  static async logEvent(payload: AuditLogPayload): Promise<IAuditEvent> {
    const isDbConnected = getDatabaseStatus().isConnected;
    const eventData = {
      repositoryId: payload.repositoryId,
      actorId: payload.actorId || 'system',
      actorType: payload.actorType || 'SYSTEM',
      action: payload.action,
      targetId: payload.targetId,
      targetType: payload.targetType,
      description: payload.description,
      metadata: payload.metadata || {},
      timestamp: new Date(),
    };

    if (isDbConnected) {
      try {
        return await AuditEvent.create(eventData);
      } catch (err) {
        console.warn('[AuditTrailService] Failed to persist audit event, using memory fallback:', err);
      }
    }

    const memDoc = {
      ...eventData,
      _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    } as unknown as IAuditEvent;

    memoryAuditEvents.unshift(memDoc);
    if (memoryAuditEvents.length > 500) {
      memoryAuditEvents.pop();
    }

    return memDoc;
  }

  /**
   * Retrieves recent audit events for a repository.
   */
  static async getEvents(repositoryId?: string, limit: number = 50): Promise<IAuditEvent[]> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      const query = repositoryId ? { repositoryId } : {};
      return AuditEvent.find(query).sort({ timestamp: -1 }).limit(limit);
    }

    if (repositoryId) {
      return memoryAuditEvents.filter((e) => e.repositoryId === repositoryId).slice(0, limit);
    }
    return memoryAuditEvents.slice(0, limit);
  }

  /**
   * Alias for getEvents.
   */
  static async getRecentEvents(repositoryId?: string, limit: number = 50): Promise<IAuditEvent[]> {
    return this.getEvents(repositoryId, limit);
  }

  /**
   * Clears memory (useful for testing).
   */
  static clearMemory(): void {
    memoryAuditEvents.length = 0;
  }
}
