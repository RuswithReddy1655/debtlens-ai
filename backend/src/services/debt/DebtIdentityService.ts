import crypto from 'crypto';
import { DebtItem, IDebtItem, DebtPriorityTier } from '../../models/DebtItem';
import { getDatabaseStatus } from '../../config/database';

// In-memory store for offline fallback / demo mode
const memoryDebtItems = new Map<string, IDebtItem>();

export class DebtIdentityService {
  /**
   * Generates a deterministic, resilient identifier for a technical debt item.
   * Resilient to line number changes as code moves within a file.
   */
  static generateDebtItemId(
    repositoryId: string,
    filePath: string,
    symbolName: string = 'module',
    category: string = 'COMPLEXITY'
  ): string {
    const normalizedPath = filePath.trim().toLowerCase().replace(/\\/g, '/');
    const normalizedSymbol = symbolName.trim().toLowerCase();
    const normalizedCategory = category.trim().toUpperCase();

    const hash = crypto
      .createHash('sha256')
      .update(`${repositoryId}:${normalizedPath}:${normalizedSymbol}:${normalizedCategory}`)
      .digest('hex');

    return `debt-${hash.substring(0, 16)}`;
  }

  /**
   * Matches detected hotspots and prioritization results with existing DebtItems,
   * or creates new ones if first observed.
   */
  static async matchOrCreateDebtItems(
    repositoryId: string,
    hotspots: any[],
    fileMetrics: any[],
    priorities: any[] = [],
    hourlyRate: number = 2000
  ): Promise<IDebtItem[]> {
    const results: IDebtItem[] = [];
    const isDbConnected = getDatabaseStatus().isConnected;

    for (const h of hotspots) {
      const filePath = h.filePath;
      const fileMetric = fileMetrics.find((f) => f.filePath === filePath);
      const prio = priorities.find((p) => p.filePath === filePath);

      // Determine category
      let category: 'COMPLEXITY' | 'CHURN' | 'DEFECT' | 'LEGACY' | 'ARCHITECTURE' = 'COMPLEXITY';
      if ((fileMetric?.defectFixCommitCount ?? 0) >= 3) {
        category = 'DEFECT';
      } else if ((fileMetric?.totalChurn ?? 0) > 300) {
        category = 'CHURN';
      } else if (fileMetric?.isLegacy) {
        category = 'LEGACY';
      }

      const symbolName = 'module';
      const debtItemId = this.generateDebtItemId(repositoryId, filePath, symbolName, category);

      const complexity = fileMetric?.cyclomaticComplexity ?? h.complexityScore ?? 15;
      const churn = fileMetric?.totalChurn ?? h.churnScore ?? 50;
      const defectFixCount = fileMetric?.defectFixCommitCount ?? 0;
      const debtScore = fileMetric?.debtScore ?? h.debtScore ?? 60;

      const priorityTier: DebtPriorityTier = prio?.priorityTier ?? (debtScore >= 75 ? 'CRITICAL' : debtScore >= 50 ? 'HIGH' : 'MEDIUM');
      const priorityScore = prio?.priorityScore ?? debtScore;
      const financialImpact = prio?.estimatedFinancialImpact ?? Math.round(complexity * 12 * hourlyRate);

      let existingItem: IDebtItem | null = null;

      if (isDbConnected) {
        existingItem = await DebtItem.findOne({ repositoryId, debtItemId });
      } else {
        existingItem = memoryDebtItems.get(`${repositoryId}:${debtItemId}`) || null;
      }

      if (existingItem) {
        // Update existing item telemetry
        existingItem.lastDetectedAt = new Date();
        existingItem.priority = priorityTier;
        existingItem.priorityScore = priorityScore;
        existingItem.technicalRisk = Math.min(100, Math.round(complexity * 2.5));
        existingItem.financialImpact = financialImpact;
        existingItem.changeFrequency = churn;
        existingItem.defectActivity = defectFixCount;

        // If it was resolved, store resolvedMetrics
        if (existingItem.currentStatus === 'RESOLVED') {
          existingItem.resolvedMetrics = {
            complexity,
            churn,
            defectFixCount,
            debtScore,
          };
        }

        if (isDbConnected) {
          await existingItem.save();
        } else {
          memoryDebtItems.set(`${repositoryId}:${debtItemId}`, existingItem);
        }
        results.push(existingItem);
      } else {
        // Create newly detected debt item
        const newItemData: any = {
          repositoryId,
          debtItemId,
          filePath,
          symbolName,
          category,
          firstDetectedAt: new Date(),
          lastDetectedAt: new Date(),
          currentStatus: 'DETECTED',
          priority: priorityTier,
          priorityScore,
          technicalRisk: Math.min(100, Math.round(complexity * 2.5)),
          financialImpact,
          changeFrequency: churn,
          defectActivity: defectFixCount,
          confidence: 'HIGH',
          estimatedCost: financialImpact,
          estimatedEffort: {
            lowHours: Math.max(4, Math.round(complexity * 0.4)),
            expectedHours: Math.max(8, Math.round(complexity * 0.6)),
            highHours: Math.max(12, Math.round(complexity * 0.9)),
            formattedRange: `${Math.max(4, Math.round(complexity * 0.4))}–${Math.max(12, Math.round(complexity * 0.9))} hrs`,
          },
          baselineMetrics: {
            complexity,
            churn,
            defectFixCount,
            debtScore,
          },
          verificationStatus: 'PENDING',
        };

        let created: IDebtItem;
        if (isDbConnected) {
          created = await DebtItem.create(newItemData);
        } else {
          created = {
            ...newItemData,
            _id: debtItemId,
            id: debtItemId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as IDebtItem;
          memoryDebtItems.set(`${repositoryId}:${debtItemId}`, created);
        }
        results.push(created);
      }
    }

    return results;
  }

  /**
   * Retrieves debt items by repository from DB or memory.
   */
  static async getDebtItems(repositoryId: string, filterStatus?: string): Promise<IDebtItem[]> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      const query: any = { repositoryId };
      if (filterStatus && filterStatus !== 'ALL') {
        query.currentStatus = filterStatus;
      }
      return DebtItem.find(query).sort({ priorityScore: -1 });
    }

    // In-memory fallback
    const items = Array.from(memoryDebtItems.values()).filter(
      (item) => item.repositoryId === repositoryId
    );
    if (filterStatus && filterStatus !== 'ALL') {
      return items.filter((item) => item.currentStatus === filterStatus);
    }
    return items.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Retrieves a single debt item by its stable ID.
   */
  static async getDebtItemById(debtItemId: string): Promise<IDebtItem | null> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      return DebtItem.findOne({ $or: [{ debtItemId }, { _id: debtItemId }] });
    }

    for (const item of memoryDebtItems.values()) {
      if (item.debtItemId === debtItemId || (item as any)._id === debtItemId || (item as any).id === debtItemId) {
        return item;
      }
    }
    return null;
  }

  /**
   * Upserts a debt item into memory (useful for tests or demo mode).
   */
  static setMemoryItem(item: IDebtItem): void {
    memoryDebtItems.set(`${item.repositoryId}:${item.debtItemId}`, item);
  }

  /**
   * Clears in-memory debt items.
   */
  static clearMemory(): void {
    memoryDebtItems.clear();
  }
}
