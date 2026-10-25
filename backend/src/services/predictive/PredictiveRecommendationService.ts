import {
  IPredictiveAction,
  IPredictedHotspot,
} from '../../models/PredictiveAssessment';
import { ConfidenceEvaluationResult } from './PredictionConfidenceService';
import { CostModel } from '../financial/CostModel';

export interface CapacityPlanResult {
  sprintCapacityHours: number;
  allocatedRemediationHours: number;
  remainingCapacityHours: number;
  utilizationRatePercentage: number;
  selectedActions: IPredictiveAction[];
  unallocatedActions: IPredictiveAction[];
  modeledRiskReduction: 'HIGH' | 'MODERATE' | 'LOW';
  summary: string;
}

// In-memory feedback store for fast retrieval and persistence
const feedbackMap = new Map<string, { feedback: 'HELPFUL' | 'NOT_HELPFUL' | 'NOT_APPLICABLE'; timestamp: Date; userId?: string }>();

export class PredictiveRecommendationService {
  /**
   * Generates prioritized "Next Best Actions" with explainable risk drivers and estimated effort.
   */
  static generateRecommendations(
    predictedHotspots: IPredictedHotspot[],
    confidenceEval: ConfidenceEvaluationResult,
    currency: string = 'INR',
    hourlyRate: number = 2000
  ): IPredictiveAction[] {
    if (predictedHotspots.length === 0) return [];

    // Filter to critical or worsening/accelerating hotspots first
    const sorted = [...predictedHotspots].sort((a, b) => {
      const tierRank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, STABLE: 0 };
      const rankA = (tierRank[a.predictedRisk] || 0) * 10 + (a.riskTrend === 'ACCELERATING' ? 5 : a.riskTrend === 'WORSENING' ? 3 : 0);
      const rankB = (tierRank[b.predictedRisk] || 0) * 10 + (b.riskTrend === 'ACCELERATING' ? 5 : b.riskTrend === 'WORSENING' ? 3 : 0);
      return rankB - rankA;
    });

    return sorted.slice(0, 8).map((hotspot, idx) => {
      const actionId = `action-${idx + 1}-${hotspot.filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const savedFeedback = feedbackMap.get(actionId)?.feedback || null;

      // Effort estimation based on risk tier and complexity
      let lowHours = 8;
      let expectedHours = 16;
      let highHours = 24;

      if (hotspot.predictedRisk === 'CRITICAL') {
        lowHours = 16;
        expectedHours = 28;
        highHours = 40;
      } else if (hotspot.predictedRisk === 'HIGH') {
        lowHours = 12;
        expectedHours = 20;
        highHours = 32;
      } else if (hotspot.predictedRisk === 'MEDIUM') {
        lowHours = 6;
        expectedHours = 12;
        highHours = 18;
      }

      const formattedEffort = `${lowHours}–${highHours} hrs (est. ${expectedHours}h)`;

      // Build specific why bullet points
      const why: string[] = [
        `Forecasted Risk: ${hotspot.predictedRisk} (Trajectory: ${hotspot.riskTrend})`,
        ...hotspot.primaryDrivers,
      ];
      if (hotspot.financialExposure > 0) {
        why.push(
          `Modeled annual friction: ${CostModel.formatCurrencyRange(CostModel.calculateRange(hotspot.financialExposure), currency as any)}`
        );
      }

      // Expected outcome
      let expectedOutcome = 'Stabilize code churn and prevent emerging technical debt regressions.';
      if (hotspot.predictedRisk === 'CRITICAL') {
        expectedOutcome = 'Reduce predicted risk from CRITICAL → MEDIUM and prevent defect escalation.';
      } else if (hotspot.predictedRisk === 'HIGH') {
        expectedOutcome = 'Reduce predicted risk from HIGH → LOW and decouple high-churn logic.';
      }

      // Risk drivers for explainability
      const riskDrivers = [
        {
          feature: 'Complexity Projection',
          value: `+${hotspot.complexityGrowthPct}%`,
          weight: 0.35,
          contribution: Math.round(hotspot.complexityGrowthPct * 0.35),
          direction: (hotspot.complexityGrowthPct > 10 ? 'UP' : 'NEUTRAL') as 'UP' | 'DOWN' | 'NEUTRAL',
        },
        {
          feature: 'Churn Volatility',
          value: `+${hotspot.churnGrowthPct}%`,
          weight: 0.30,
          contribution: Math.round(hotspot.churnGrowthPct * 0.30),
          direction: (hotspot.churnGrowthPct > 10 ? 'UP' : 'NEUTRAL') as 'UP' | 'DOWN' | 'NEUTRAL',
        },
        {
          feature: 'Historical Defects',
          value: `${hotspot.defectActivityCount} patches`,
          weight: 0.20,
          contribution: hotspot.defectActivityCount * 5,
          direction: (hotspot.defectActivityCount > 0 ? 'UP' : 'NEUTRAL') as 'UP' | 'DOWN' | 'NEUTRAL',
        },
        {
          feature: 'Financial Exposure',
          value: CostModel.formatCurrencyRange(CostModel.calculateRange(hotspot.financialExposure), currency as any),
          weight: 0.15,
          contribution: Math.min(25, Math.round(hotspot.financialExposure / (hourlyRate * 4))),
          direction: (hotspot.financialExposure > hourlyRate * 10 ? 'UP' : 'NEUTRAL') as 'UP' | 'DOWN' | 'NEUTRAL',
        },
      ];

      return {
        actionId,
        target: hotspot.filePath,
        recommendation: hotspot.recommendedAction || 'Refactor and test within next sprint.',
        why,
        estimatedEffort: {
          lowHours,
          expectedHours,
          highHours,
          formatted: formattedEffort,
        },
        expectedOutcome,
        confidence: confidenceEval.confidenceLevel,
        riskDrivers,
        feedback: savedFeedback,
      };
    });
  }

  /**
   * Capacity Planner: fits recommended actions into realistic engineering sprint capacity.
   */
  static planSprintCapacity(
    actions: IPredictiveAction[],
    sprintCapacityHours: number = 80
  ): CapacityPlanResult {
    let allocatedHours = 0;
    const selectedActions: IPredictiveAction[] = [];
    const unallocatedActions: IPredictiveAction[] = [];

    for (const action of actions) {
      const effort = action.estimatedEffort.expectedHours;
      if (allocatedHours + effort <= sprintCapacityHours) {
        selectedActions.push(action);
        allocatedHours += effort;
      } else {
        unallocatedActions.push(action);
      }
    }

    const remaining = Math.max(0, sprintCapacityHours - allocatedHours);
    const utilization = Math.min(100, Math.round((allocatedHours / (sprintCapacityHours || 1)) * 100));

    let modeledRiskReduction: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    if (selectedActions.length >= 3 || allocatedHours >= sprintCapacityHours * 0.7) {
      modeledRiskReduction = 'HIGH';
    } else if (selectedActions.length >= 1 || allocatedHours >= sprintCapacityHours * 0.3) {
      modeledRiskReduction = 'MODERATE';
    }

    const summary = `Allocated ${selectedActions.length} high-priority predictive work packages (${allocatedHours}h / ${sprintCapacityHours}h sprint capacity). ${remaining}h buffer remaining. Expected risk reduction: ${modeledRiskReduction}.`;

    return {
      sprintCapacityHours,
      allocatedRemediationHours: allocatedHours,
      remainingCapacityHours: remaining,
      utilizationRatePercentage: utilization,
      selectedActions,
      unallocatedActions,
      modeledRiskReduction,
      summary,
    };
  }

  /**
   * Records user feedback on a recommendation.
   */
  static recordFeedback(
    actionId: string,
    feedback: 'HELPFUL' | 'NOT_HELPFUL' | 'NOT_APPLICABLE',
    userId?: string
  ): void {
    feedbackMap.set(actionId, {
      feedback,
      timestamp: new Date(),
      userId,
    });
  }

  /**
   * Retrieves feedback stats for auditing.
   */
  static getFeedbackStats(): { total: number; helpful: number; notHelpful: number; notApplicable: number } {
    let helpful = 0;
    let notHelpful = 0;
    let notApplicable = 0;

    for (const item of feedbackMap.values()) {
      if (item.feedback === 'HELPFUL') helpful++;
      else if (item.feedback === 'NOT_HELPFUL') notHelpful++;
      else if (item.feedback === 'NOT_APPLICABLE') notApplicable++;
    }

    return {
      total: feedbackMap.size,
      helpful,
      notHelpful,
      notApplicable,
    };
  }

  /**
   * Clears feedback store (testing).
   */
  static clearMemory(): void {
    feedbackMap.clear();
  }
}
