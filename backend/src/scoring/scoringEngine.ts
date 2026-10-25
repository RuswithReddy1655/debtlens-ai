import {
  ComplexityMetrics,
  ChurnMetrics,
  DefectMetrics,
  OwnershipMetrics,
  LegacyMetrics,
  FileDebtScore,
  TechnicalDebtEngine,
} from '../analyzers/interfaces';

export class DefaultTechnicalDebtEngine implements TechnicalDebtEngine {
  /**
   * Computes a multi-dimensional technical debt score (0 - 100)
   * Weights:
   * - Complexity: 30%
   * - Churn: 25%
   * - Defect density & rework: 20%
   * - Ownership silo risk: 15%
   * - Legacy & decay: 10%
   */
  async computeFileDebt(
    complexity: ComplexityMetrics,
    churn: ChurnMetrics,
    defect: DefectMetrics,
    ownership: OwnershipMetrics,
    legacy: LegacyMetrics
  ): Promise<FileDebtScore> {
    // 1. Normalized Complexity (0 - 100)
    // Cyclomatic > 20 is high, > 50 is extreme; LoC > 500 is high, > 1500 is extreme
    const cyclomaticFactor = Math.min(100, (complexity.cyclomaticComplexity / 40) * 100);
    const locFactor = Math.min(100, (complexity.linesOfCode / 1000) * 100);
    const nestingFactor = Math.min(100, (complexity.nestingDepthMax / 6) * 100);
    const complexityScore = Math.round(
      0.5 * cyclomaticFactor + 0.3 * locFactor + 0.2 * nestingFactor
    );

    // 2. Normalized Churn Score (0 - 100)
    // Commits > 20 in 6 months is high churn
    const commitFactor = Math.min(100, (churn.commitCount / 25) * 100);
    const reworkFactor = Math.min(100, (churn.reworkCommitCount / 10) * 100);
    const churnScore = Math.round(0.6 * commitFactor + 0.4 * reworkFactor);

    // 3. Defect & Rework Score (0 - 100)
    const defectFactor = Math.min(100, (defect.totalDefects / 8) * 100);
    const reworkHoursFactor = Math.min(100, (defect.reworkHoursSpent / 30) * 100);
    const defectScore = Math.round(0.5 * defectFactor + 0.5 * reworkHoursFactor);

    // 4. Ownership Silo Risk (0 - 100)
    // High single-owner percentage + low contributor entropy = high risk
    const siloFactor = ownership.isKnowledgeSilo ? 85 : Math.round(ownership.primaryOwnerPercentage);
    const entropyFactor = Math.round((1 - ownership.ownershipEntropy) * 100);
    const ownershipScore = Math.round(0.6 * siloFactor + 0.4 * entropyFactor);

    // 5. Legacy & Decay (0 - 100)
    const ageFactor = Math.min(100, (legacy.monthsSinceLastModified / 24) * 100);
    const depFactor = Math.min(100, (legacy.deprecatedApiCount / 5) * 100);
    const legacyScore = Math.round(0.6 * ageFactor + 0.4 * depFactor);

    // Composite Weighted Score
    const overallDebtScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          0.30 * complexityScore +
          0.25 * churnScore +
          0.20 * defectScore +
          0.15 * ownershipScore +
          0.10 * legacyScore
        )
      )
    );

    // Risk Classification
    let riskCategory: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (overallDebtScore >= 75) {
      riskCategory = 'critical';
    } else if (overallDebtScore >= 50) {
      riskCategory = 'high';
    } else if (overallDebtScore >= 25) {
      riskCategory = 'medium';
    }

    // Identify Drivers
    const debtDrivers: string[] = [];
    if (complexityScore >= 60) debtDrivers.push('High Cyclomatic & Cognitive Complexity');
    if (churnScore >= 60) debtDrivers.push('Frequent Code Churn & Revision Velocity');
    if (defectScore >= 50) debtDrivers.push('High Defect Density & Historical Rework');
    if (ownershipScore >= 70) debtDrivers.push('Single-Developer Knowledge Silo');
    if (legacyScore >= 60) debtDrivers.push('Legacy Decay & Stale Dependencies');
    if (debtDrivers.length === 0) debtDrivers.push('Stable & Well-Maintained');

    // Remediation hours estimate: base function of LoC, complexity, and debt score
    // e.g. 1 hour per 80 LoC scaled by complexity multiplier
    const baseHours = (complexity.linesOfCode / 80) * (complexity.cyclomaticComplexity / 15);
    const debtHours = Math.max(1, Math.round(baseHours * (overallDebtScore / 50)));

    return {
      filePath: '',
      overallDebtScore,
      riskCategory,
      debtHours,
      debtDrivers,
      components: {
        complexityScore,
        churnScore,
        defectScore,
        ownershipScore,
        legacyScore,
      },
    };
  }
}
