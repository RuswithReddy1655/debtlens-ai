import {
  ActionableRecommendation,
  FileDebtScore,
  HotspotItem,
  RecommendationEngine,
} from './interfaces';

export class DefaultRecommendationEngine implements RecommendationEngine {
  async generateRecommendations(
    hotspots: HotspotItem[],
    debtScores: FileDebtScore[],
    hourlyRate: number = 95
  ): Promise<ActionableRecommendation[]> {
    const recommendations: ActionableRecommendation[] = [];

    // Filter top critical & high hotspots
    const criticalHotspots = hotspots.filter((h) => h.riskLevel === 'critical');
    const highHotspots = hotspots.filter((h) => h.riskLevel === 'high');

    // 1. Critical Refactoring: Break down high-complexity God Classes / Modules
    if (criticalHotspots.length > 0) {
      const topTarget = criticalHotspots[0];
      const effort = topTarget.estimatedRemediationHours;
      const cost = Math.round(effort * hourlyRate);
      const savings = Math.round(topTarget.futureAvoidableCost * 1.5);
      const roi = cost > 0 ? Number(((savings * 2) / cost).toFixed(2)) : 2.5;

      recommendations.push({
        id: 'REC-001',
        title: `Decompose monolithic core hotspot: ${topTarget.filePath.split('/').pop()}`,
        category: 'architecture',
        priority: 'critical',
        targetFiles: [topTarget.filePath],
        rationale: `File exhibits critical technical debt (${topTarget.debtScore}/100) with severe cyclomatic complexity (${topTarget.complexityScore}/100) and frequent churn (${topTarget.churnScore}/100). Modifying this module drives high regression rates and engineer drag.`,
        actionPlan: [
          'Extract domain business logic into dedicated single-responsibility domain services',
          'Isolate data access and external API dependencies behind typed interfaces',
          'Introduce unit test suites with >85% branch coverage prior to refactor',
          'Execute phased extraction via Strangler Fig pattern to avoid downtime',
        ],
        estimatedEffortHours: effort,
        estimatedCost: cost,
        projectedAnnualSavings: savings,
        roiRatio: roi,
        paybackPeriodMonths: Math.max(1, Math.round((cost / (savings / 12)) * 10) / 10),
      });
    }

    // 2. Testing Gap Recommendation
    const untestedComplexFiles = debtScores
      .filter((f) => f.components.complexityScore > 50)
      .slice(0, 3);

    if (untestedComplexFiles.length > 0) {
      const effort = 36;
      const cost = Math.round(effort * hourlyRate);
      const savings = Math.round(cost * 1.8);

      recommendations.push({
        id: 'REC-002',
        title: 'Establish regression test safety net for high-churn components',
        category: 'testing',
        priority: 'high',
        targetFiles: untestedComplexFiles.map((f) => f.filePath),
        rationale:
          'Multiple frequently modified files with elevated complexity lack comprehensive automated test coverage, causing avoidable defect triage in production.',
        actionPlan: [
          'Add integration test fixtures with deterministic mock data',
          'Add property-based tests for boundary edge cases in transaction handling',
          'Enforce CI gate requiring test coverage delta >= 0 on all PRs targeting core paths',
        ],
        estimatedEffortHours: effort,
        estimatedCost: cost,
        projectedAnnualSavings: savings,
        roiRatio: Number(((savings * 2) / cost).toFixed(2)),
        paybackPeriodMonths: 4.2,
      });
    }

    // 3. Ownership / Knowledge Silo Mitigation
    const siloFiles = debtScores
      .filter((f) => f.components.ownershipScore >= 65)
      .slice(0, 2);

    if (siloFiles.length > 0) {
      const effort = 20;
      const cost = Math.round(effort * hourlyRate);
      const savings = Math.round(cost * 1.4);

      recommendations.push({
        id: 'REC-003',
        title: 'Mitigate single-contributor knowledge silo and code ownership risk',
        category: 'ownership',
        priority: 'medium',
        targetFiles: siloFiles.map((f) => f.filePath),
        rationale:
          'Core modules are dominated by a single committer (>80% author share), creating severe bus-factor risk and code review bottlenecks.',
        actionPlan: [
          'Schedule pair programming / peer code review sessions for future PRs in this directory',
          'Document architectural decision records (ADRs) for state management invariants',
          'Rotate on-call triage ownership for related service components',
        ],
        estimatedEffortHours: effort,
        estimatedCost: cost,
        projectedAnnualSavings: savings,
        roiRatio: Number(((savings * 2) / cost).toFixed(2)),
        paybackPeriodMonths: 5.6,
      });
    }

    // 4. Dependency & Legacy Refresh
    const legacyFiles = debtScores
      .filter((f) => f.components.legacyScore >= 50)
      .slice(0, 2);

    if (legacyFiles.length > 0) {
      const effort = 24;
      const cost = Math.round(effort * hourlyRate);
      const savings = Math.round(cost * 1.6);

      recommendations.push({
        id: 'REC-004',
        title: 'Upgrade stale dependencies and deprecated interface usage',
        category: 'dependency',
        priority: 'low',
        targetFiles: legacyFiles.map((f) => f.filePath),
        rationale:
          'Stale modules depend on legacy patterns and deprecated third-party packages, preventing modernization and performance optimizations.',
        actionPlan: [
          'Audit package lockfiles for unpatched CVE advisories',
          'Migrate to modern asynchronous runtime primitives',
          'Remove dead code paths identified by static dead-code elimination',
        ],
        estimatedEffortHours: effort,
        estimatedCost: cost,
        projectedAnnualSavings: savings,
        roiRatio: Number(((savings * 2) / cost).toFixed(2)),
        paybackPeriodMonths: 6.1,
      });
    }

    return recommendations;
  }
}
