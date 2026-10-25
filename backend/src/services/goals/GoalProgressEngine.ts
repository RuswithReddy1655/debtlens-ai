import { EngineeringGoal, IEngineeringGoal, GoalMetric, GoalStatus } from '../../models/EngineeringGoal';
import { AuditTrailService } from '../audit/AuditTrailService';
import { AlertEngine } from '../alerts/AlertEngine';
import { getDatabaseStatus } from '../../config/database';

// In-memory fallback
const memoryGoals = new Map<string, IEngineeringGoal>();

export class GoalProgressEngine {
  /**
   * Calculates the percentage progress towards achieving an engineering goal.
   * Handles decreasing metrics (e.g. reducing debt score or hotspots) and increasing metrics.
   */
  static calculateProgress(
    startingValue: number,
    targetValue: number,
    currentValue: number
  ): { progressPercentage: number; isAchieved: boolean } {
    // If starting and target are equal, already completed
    if (startingValue === targetValue) {
      return { progressPercentage: 100, isAchieved: true };
    }

    // Decreasing metric (e.g., Debt Score 78 -> 60, Hotspots 12 -> 6)
    if (startingValue > targetValue) {
      if (currentValue <= targetValue) {
        return { progressPercentage: 100, isAchieved: true };
      }
      const totalSpan = startingValue - targetValue;
      const progressSpan = startingValue - currentValue;
      const pct = Math.min(100, Math.max(0, Math.round((progressSpan / totalSpan) * 100)));
      return { progressPercentage: pct, isAchieved: false };
    }

    // Increasing metric
    if (currentValue >= targetValue) {
      return { progressPercentage: 100, isAchieved: true };
    }
    const totalSpan = targetValue - startingValue;
    const progressSpan = currentValue - startingValue;
    const pct = Math.min(100, Math.max(0, Math.round((progressSpan / totalSpan) * 100)));
    return { progressPercentage: pct, isAchieved: false };
  }

  /**
   * Evaluates and updates all active engineering goals for a repository
   * based on the latest analysis metrics.
   */
  static async evaluateGoals(
    repositoryId: string,
    currentMetrics: {
      criticalHotspots: number;
      technicalDebtScore: number;
      annualExposure: number;
      highPriorityDebt: number;
      averageComplexity: number;
    }
  ): Promise<IEngineeringGoal[]> {
    const goals = await this.getGoals(repositoryId);
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
    const updatedGoals: IEngineeringGoal[] = [];
    const isDbConnected = getDatabaseStatus().isConnected;

    for (const goal of activeGoals) {
      let currentVal = goal.currentValue;

      switch (goal.metric) {
        case 'CRITICAL_HOTSPOTS':
          currentVal = currentMetrics.criticalHotspots;
          break;
        case 'TECHNICAL_DEBT_SCORE':
          currentVal = currentMetrics.technicalDebtScore;
          break;
        case 'ANNUAL_EXPOSURE':
          currentVal = currentMetrics.annualExposure;
          break;
        case 'HIGH_PRIORITY_DEBT':
          currentVal = currentMetrics.highPriorityDebt;
          break;
        case 'AVERAGE_COMPLEXITY':
          currentVal = currentMetrics.averageComplexity;
          break;
      }

      goal.currentValue = currentVal;
      const { progressPercentage, isAchieved } = this.calculateProgress(
        goal.startingValue,
        goal.targetValue,
        currentVal
      );
      goal.progressPercentage = progressPercentage;

      if (isAchieved && goal.status === 'ACTIVE') {
        goal.status = 'ACHIEVED';

        await AuditTrailService.logEvent({
          repositoryId,
          action: 'GOAL_ACHIEVED',
          targetId: (goal as any)._id?.toString() || goal.title,
          targetType: 'GOAL',
          description: `Goal achieved: "${goal.title}" hit target ${goal.targetValue} ${goal.unit}`,
          metadata: { targetValue: goal.targetValue, achievedValue: currentVal },
        });

        await AlertEngine.createAlert({
          repositoryId,
          type: 'GOAL_ACHIEVED',
          severity: 'INFO',
          title: `Goal Achieved: ${goal.title}`,
          message: `Congratulations! Engineering goal "${goal.title}" was reached (Current: ${currentVal} ${goal.unit}).`,
          metric: goal.metric,
          currentValue: currentVal,
          threshold: goal.targetValue,
        });
      } else if (new Date() > new Date(goal.targetDate) && goal.status === 'ACTIVE' && !isAchieved) {
        goal.status = 'MISSED';
      }

      if (isDbConnected && typeof (goal as any).save === 'function') {
        await (goal as any).save();
      } else {
        memoryGoals.set((goal as any)._id?.toString() || goal.title, goal);
      }

      updatedGoals.push(goal);
    }

    return updatedGoals;
  }

  /**
   * Retrieves all goals for a repository.
   */
  static async getGoals(repositoryId?: string): Promise<IEngineeringGoal[]> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      const query = repositoryId ? { repositoryId } : {};
      return EngineeringGoal.find(query).sort({ createdAt: -1 });
    }

    const list = Array.from(memoryGoals.values());
    if (repositoryId) {
      return list.filter((g) => g.repositoryId === repositoryId);
    }
    return list;
  }

  /**
   * Creates a new engineering goal.
   */
  static async createGoal(payload: {
    repositoryId: string;
    title: string;
    description?: string;
    metric: GoalMetric;
    targetValue: number;
    startingValue: number;
    unit?: string;
    targetDate: Date;
    createdBy?: string;
  }): Promise<IEngineeringGoal> {
    const isDbConnected = getDatabaseStatus().isConnected;
    const { progressPercentage, isAchieved } = this.calculateProgress(
      payload.startingValue,
      payload.targetValue,
      payload.startingValue
    );

    const goalData = {
      repositoryId: payload.repositoryId,
      title: payload.title,
      description: payload.description || '',
      metric: payload.metric,
      startingValue: payload.startingValue,
      currentValue: payload.startingValue,
      targetValue: payload.targetValue,
      unit: payload.unit || 'pts',
      startDate: new Date(),
      targetDate: payload.targetDate,
      status: (isAchieved ? 'ACHIEVED' : 'ACTIVE') as GoalStatus,
      progressPercentage,
      createdBy: payload.createdBy || 'Engineering Lead',
    };

    if (isDbConnected) {
      const created = await EngineeringGoal.create(goalData);
      await AuditTrailService.logEvent({
        repositoryId: payload.repositoryId,
        action: 'GOAL_CREATED',
        targetId: (created as any)._id.toString(),
        targetType: 'GOAL',
        description: `Created goal "${payload.title}" (Target: ${payload.targetValue} ${goalData.unit})`,
        metadata: goalData,
      });
      return created;
    }

    const memGoal = {
      ...goalData,
      _id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      id: `goal-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IEngineeringGoal;

    memoryGoals.set((memGoal as any)._id, memGoal);

    await AuditTrailService.logEvent({
      repositoryId: payload.repositoryId,
      action: 'GOAL_CREATED',
      targetId: (memGoal as any)._id,
      targetType: 'GOAL',
      description: `Created goal "${payload.title}" (Target: ${payload.targetValue} ${goalData.unit})`,
      metadata: goalData,
    });

    return memGoal;
  }

  /**
   * Updates an existing goal.
   */
  static async updateGoal(
    goalId: string,
    updates: Partial<{
      title: string;
      description: string;
      targetValue: number;
      targetDate: Date;
      status: GoalStatus;
    }>
  ): Promise<IEngineeringGoal | null> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      return EngineeringGoal.findByIdAndUpdate(goalId, updates, { new: true });
    }

    const item = memoryGoals.get(goalId);
    if (item) {
      Object.assign(item, updates);
      return item;
    }
    return null;
  }

  /**
   * Clears memory store (testing).
   */
  static clearMemory(): void {
    memoryGoals.clear();
  }
}
