import {
  FileDebtScore,
  HotspotAnalyzer,
  HotspotItem,
} from './interfaces';

export class DefaultHotspotAnalyzer implements HotspotAnalyzer {
  async identifyHotspots(
    fileMetrics: FileDebtScore[],
    financialRates: { hourlyRate: number }
  ): Promise<HotspotItem[]> {
    const rate = financialRates.hourlyRate || 95;

    // Hotspot rank: files ordered by highest debt score and churn impact
    const sorted = [...fileMetrics].sort((a, b) => {
      // Hotspots are where high complexity intersects with high change frequency
      const scoreA = a.overallDebtScore * 0.6 + a.components.churnScore * 0.4;
      const scoreB = b.overallDebtScore * 0.6 + b.components.churnScore * 0.4;
      return scoreB - scoreA;
    });

    return sorted.map((file, index) => {
      const remediationHours = file.debtHours;
      const remediationCost = Math.round(remediationHours * rate);
      // Historical rework proportional to defect and churn score
      const reworkHours = Math.round(
        remediationHours * (0.8 + (file.components.defectScore / 100) * 0.8)
      );
      const historicalReworkCost = Math.round(reworkHours * rate);

      // Future avoidable cost (annual)
      const annualFrictionHours =
        file.riskCategory === 'critical' ? 40 : file.riskCategory === 'high' ? 24 : 10;
      const futureAvoidableCost = Math.round(annualFrictionHours * rate);

      // Potential benefit over 2 years
      const potentialBenefit = Math.max(0, futureAvoidableCost * 2 - remediationCost);

      return {
        rank: index + 1,
        filePath: file.filePath,
        riskLevel: file.riskCategory,
        debtScore: file.overallDebtScore,
        complexityScore: file.components.complexityScore,
        churnScore: file.components.churnScore,
        estimatedRemediationHours: remediationHours,
        estimatedRemediationCost: remediationCost,
        historicalReworkCost,
        futureAvoidableCost,
        potentialBenefit,
        primaryDebtDrivers: file.debtDrivers,
      };
    });
  }
}
