import { LegacyMetrics } from './interfaces';

export class RealLegacyAnalyzer {
  /**
   * Evaluates legacy risk based on age, time since last change, complexity, and churn.
   * Avoids penalizing old, stable code that has low complexity and zero churn.
   */
  static evaluateLegacyRisk(params: {
    ageInDays: number;
    daysSinceLastChange: number;
    cyclomaticComplexity: number;
    churnCount: number;
    ownershipPercentage: number;
  }): { isLegacy: boolean; legacyScore: number; reason: string } {
    const monthsSinceLastChange = params.daysSinceLastChange / 30;

    // Component 1: Dormancy without stability (stagnant high-complexity code)
    // If a file hasn't been touched in over a year and has high complexity, it's at high risk of knowledge loss.
    let dormancyRisk = 0;
    if (monthsSinceLastChange > 12) {
      dormancyRisk = Math.min(100, (monthsSinceLastChange / 24) * 80);
    }

    // Component 2: Complexity multiplier
    const complexityWeight = Math.min(100, (params.cyclomaticComplexity / 30) * 100);

    // Component 3: Ownership silo decay
    const siloWeight = params.ownershipPercentage >= 80 ? 70 : 30;

    // A stable utility (low complexity, unchanged) is NOT legacy debt:
    if (params.cyclomaticComplexity <= 10 && params.churnCount <= 5) {
      return {
        isLegacy: false,
        legacyScore: Math.round(dormancyRisk * 0.2),
        reason: 'Stable utility with low complexity and zero churn',
      };
    }

    const legacyScore = Math.min(
      100,
      Math.round(0.4 * dormancyRisk + 0.4 * complexityWeight + 0.2 * siloWeight)
    );

    const isLegacy = legacyScore >= 50 && monthsSinceLastChange > 6;
    let reason = 'Active, regularly maintained code';
    if (isLegacy) {
      reason = `Legacy candidate: Dormant for ${Math.round(monthsSinceLastChange)} months with elevated complexity (${params.cyclomaticComplexity}) and single-owner risk`;
    }

    return {
      isLegacy,
      legacyScore,
      reason,
    };
  }
}
