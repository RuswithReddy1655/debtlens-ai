import { DebtItem, IDebtItem, DebtItemStatus } from '../../models/DebtItem';
import { DebtIdentityService } from './DebtIdentityService';
import { AuditTrailService } from '../audit/AuditTrailService';
import { getDatabaseStatus } from '../../config/database';

export class DebtLifecycleService {
  /**
   * Allowed state transitions map.
   */
  private static VALID_TRANSITIONS: Record<DebtItemStatus, DebtItemStatus[]> = {
    DETECTED: ['PRIORITIZED', 'WONT_FIX', 'ACCEPTED_RISK'],
    PRIORITIZED: ['PLANNED', 'WONT_FIX', 'ACCEPTED_RISK', 'DETECTED'],
    PLANNED: ['IN_PROGRESS', 'PRIORITIZED', 'WONT_FIX', 'ACCEPTED_RISK'],
    IN_PROGRESS: ['RESOLVED', 'PLANNED'],
    RESOLVED: ['VERIFIED', 'REOPENED', 'IN_PROGRESS'],
    VERIFIED: ['REOPENED'],
    WONT_FIX: ['REOPENED', 'DETECTED'],
    ACCEPTED_RISK: ['REOPENED', 'DETECTED'],
    REOPENED: ['PRIORITIZED', 'PLANNED', 'IN_PROGRESS'],
  };

  /**
   * Validates if a state transition is legal.
   */
  static isValidTransition(currentStatus: DebtItemStatus, targetStatus: DebtItemStatus): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = this.VALID_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(targetStatus) : false;
  }

  /**
   * Asserts valid transition or throws descriptive error.
   */
  static assertValidTransition(currentStatus: DebtItemStatus, targetStatus: DebtItemStatus): void {
    if (!this.isValidTransition(currentStatus, targetStatus)) {
      throw new Error(
        `Invalid debt lifecycle transition from "${currentStatus}" to "${targetStatus}". Legal transitions: [${(
          this.VALID_TRANSITIONS[currentStatus] || []
        ).join(', ')}]`
      );
    }
  }

  /**
   * Transitions a debt item to a new status.
   */
  static async updateStatus(
    debtItemId: string,
    targetStatus: DebtItemStatus,
    metadata?: {
      notes?: string;
      resolutionCommitSha?: string;
      pullRequestUrl?: string;
      actorId?: string;
    }
  ): Promise<IDebtItem> {
    const item = await DebtIdentityService.getDebtItemById(debtItemId);
    if (!item) {
      throw new Error(`Debt item "${debtItemId}" not found.`);
    }

    this.assertValidTransition(item.currentStatus, targetStatus);
    const previousStatus = item.currentStatus;
    item.currentStatus = targetStatus;

    if (metadata?.notes) {
      item.notes = metadata.notes;
    }

    if (targetStatus === 'RESOLVED') {
      item.resolutionDate = new Date();
      if (metadata?.resolutionCommitSha) {
        item.resolutionCommitSha = metadata.resolutionCommitSha;
      }
      if (metadata?.pullRequestUrl) {
        item.pullRequestUrl = metadata.pullRequestUrl;
      }
    }

    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected && typeof (item as any).save === 'function') {
      await (item as any).save();
    } else {
      DebtIdentityService.setMemoryItem(item);
    }

    // Log Audit Event
    await AuditTrailService.logEvent({
      repositoryId: item.repositoryId,
      actorId: metadata?.actorId || 'system-user',
      actorType: 'USER',
      action: 'STATUS_CHANGED',
      targetId: item.debtItemId,
      targetType: 'DEBT_ITEM',
      description: `Transitioned debt item ${item.filePath} from ${previousStatus} to ${targetStatus}`,
      metadata: {
        previousStatus,
        targetStatus,
        filePath: item.filePath,
        resolutionCommitSha: metadata?.resolutionCommitSha,
      },
    });

    return item;
  }

  /**
   * Assigns an engineering owner and target date to a debt item.
   */
  static async assignDebtItem(
    debtItemId: string,
    assignedTo: string,
    targetDate?: Date,
    actorId?: string
  ): Promise<IDebtItem> {
    const item = await DebtIdentityService.getDebtItemById(debtItemId);
    if (!item) {
      throw new Error(`Debt item "${debtItemId}" not found.`);
    }

    item.assignedTo = assignedTo;
    if (targetDate) item.targetDate = targetDate;

    // Automatically move to PLANNED if currently DETECTED or PRIORITIZED
    if (item.currentStatus === 'DETECTED' || item.currentStatus === 'PRIORITIZED') {
      item.currentStatus = 'PLANNED';
    }

    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected && typeof (item as any).save === 'function') {
      await (item as any).save();
    } else {
      DebtIdentityService.setMemoryItem(item);
    }

    await AuditTrailService.logEvent({
      repositoryId: item.repositoryId,
      actorId: actorId || 'system-user',
      actorType: 'USER',
      action: 'ASSIGNMENT_CHANGED',
      targetId: item.debtItemId,
      targetType: 'DEBT_ITEM',
      description: `Assigned debt item ${item.filePath} to ${assignedTo}`,
      metadata: { assignedTo, targetDate },
    });

    return item;
  }

  /**
   * Links a pull request or commit to a debt item.
   */
  static async linkWork(
    debtItemId: string,
    links: {
      pullRequestUrl?: string;
      commitSha?: string;
      externalIssueUrl?: string;
      notes?: string;
      actorId?: string;
    }
  ): Promise<IDebtItem> {
    const item = await DebtIdentityService.getDebtItemById(debtItemId);
    if (!item) {
      throw new Error(`Debt item "${debtItemId}" not found.`);
    }

    if (links.pullRequestUrl) item.pullRequestUrl = links.pullRequestUrl;
    if (links.commitSha) item.resolutionCommitSha = links.commitSha;
    if (links.externalIssueUrl) item.externalIssueUrl = links.externalIssueUrl;
    if (links.notes) item.notes = links.notes;

    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected && typeof (item as any).save === 'function') {
      await (item as any).save();
    } else {
      DebtIdentityService.setMemoryItem(item);
    }

    return item;
  }

  /**
   * Retrieves debt items matching query filters.
   */
  static async getDebtItems(filter?: {
    repositoryId?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
  }): Promise<IDebtItem[]> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      const query: any = {};
      if (filter?.repositoryId) query.repositoryId = filter.repositoryId;
      if (filter?.status && filter.status !== 'ALL') query.currentStatus = filter.status;
      if (filter?.priority && filter.priority !== 'ALL') query.priority = filter.priority;
      if (filter?.category && filter.category !== 'ALL') query.category = filter.category;
      if (filter?.assignedTo) query.assignedTo = filter.assignedTo;

      return DebtItem.find(query).sort({ priorityScore: -1 });
    }

    if (filter?.repositoryId) {
      let items = await DebtIdentityService.getDebtItems(filter.repositoryId, filter.status);
      if (filter.priority && filter.priority !== 'ALL') {
        items = items.filter((i) => i.priority === filter.priority);
      }
      if (filter.category && filter.category !== 'ALL') {
        items = items.filter((i) => i.category === filter.category);
      }
      if (filter.assignedTo) {
        items = items.filter((i) => i.assignedTo === filter.assignedTo);
      }
      return items;
    }

    return [];
  }

  /**
   * Retrieves single debt item by debtItemId or _id.
   */
  static async getDebtItemById(debtItemId: string): Promise<IDebtItem | null> {
    return DebtIdentityService.getDebtItemById(debtItemId);
  }

  /**
   * Transitions status with validation and audit logging.
   */
  static async transitionStatus(
    debtItemId: string,
    newStatus: DebtItemStatus,
    actorId?: string,
    note?: string
  ): Promise<IDebtItem> {
    return this.updateStatus(debtItemId, newStatus, { actorId, notes: note });
  }
}
