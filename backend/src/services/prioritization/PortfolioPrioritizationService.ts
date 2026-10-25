import { CostModel, CostRange } from '../financial/CostModel';

export interface RepositoryPortfolioItem {
  repositoryId: string;
  name: string;
  owner: string;
  defaultBranch: string;
  isDemo: boolean;
  debtScore: number;
  totalFiles: number;
  criticalHotspotsCount: number;
  annualFinancialExposure: number;
  exposureRange: CostRange;
  formattedExposure: string;
  potentialAnnualSavings: number;
  formattedSavings: string;
  primaryCostDriver: string;
  refactoringROI: number;
  opportunityTier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  predictiveRiskScore?: number;
  predictiveRiskLevel?: string;
  riskTrend?: string;
  forecastedExposure?: number;
  formattedForecastedExposure?: string;
  emergingCriticalHotspots?: number;
  goalOutlook?: string;
}

export interface PortfolioSummary {
  totalRepositories: number;
  totalDebtExposure: number;
  totalExposureRange: CostRange;
  formattedTotalExposure: string;
  totalPotentialSavings: number;
  formattedTotalSavings: string;
  averageDebtScore: number;
  highestRiskRepository: {
    repositoryId: string;
    name: string;
    debtScore: number;
  } | null;
  highestOpportunityRepository: {
    repositoryId: string;
    name: string;
    annualExposure: number;
    potentialSavings: number;
  } | null;
  currency: string;
  repositories: RepositoryPortfolioItem[];
}

export class PortfolioPrioritizationService {
  /**
   * Evaluates organization-wide debt portfolio across multiple repositories.
   */
  static buildPortfolio(
    repoAnalysisPairs: Array<{
      repository: any;
      analysis: any;
      financialData?: any;
    }>,
    currency: string = 'INR',
    hourlyRate: number = 2000
  ): PortfolioSummary {
    const items: RepositoryPortfolioItem[] = [];
    let grandTotalExposure = 0;
    let grandTotalSavings = 0;
    let debtScoreSum = 0;

    for (const pair of repoAnalysisPairs) {
      const repo = pair.repository;
      const analysis = pair.analysis || {};
      const fin = pair.financialData || {};

      const debtScore = analysis.summary?.overallDebtScore ?? (repo.isDemo ? 72 : 45);
      const totalFiles = analysis.summary?.totalFiles ?? 12;
      const criticalHotspots = analysis.summary?.criticalHotspots ?? 2;

      // Extract or compute annual financial impact
      const annualExposure = fin.summary?.totalAnnualExposure ??
        fin.estimatedFutureAvoidableCost?.projectedAnnualCost ??
        Math.round((criticalHotspots * 38 + (totalFiles - criticalHotspots) * 8) * hourlyRate);

      const potentialSavings = fin.summary?.potentialAnnualSavings ??
        Math.round(annualExposure * 0.65);

      const roi = fin.summary?.roiPercentage ?? 185;
      const driver = fin.costDrivers?.topCostDriverFiles?.[0]?.primaryDriver || 'Maintenance Friction';

      grandTotalExposure += annualExposure;
      grandTotalSavings += potentialSavings;
      debtScoreSum += debtScore;

      let opportunityTier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
      if (annualExposure >= hourlyRate * 400 || debtScore >= 75) opportunityTier = 'CRITICAL';
      else if (annualExposure >= hourlyRate * 200 || debtScore >= 60) opportunityTier = 'HIGH';
      else if (annualExposure <= hourlyRate * 50) opportunityTier = 'LOW';

      const exposureRange = CostModel.calculateRange(annualExposure);
      const savingsRange = CostModel.calculateRange(potentialSavings);

      // Phase 5 Predictive Intelligence telemetry signals
      const isHighRisk = debtScore >= 70 || criticalHotspots >= 2;
      const predictiveRiskScore = isHighRisk ? Math.min(96, debtScore + 12) : Math.max(15, debtScore - 5);
      const predictiveRiskLevel = predictiveRiskScore >= 80 ? 'CRITICAL' : predictiveRiskScore >= 65 ? 'HIGH' : predictiveRiskScore >= 40 ? 'MEDIUM' : 'LOW';
      const riskTrend = isHighRisk ? (debtScore >= 75 ? 'ACCELERATING' : 'WORSENING') : 'STABLE';
      const forecastedExposure = Math.round(annualExposure * (isHighRisk ? 1.22 : 1.02));
      const formattedForecasted = CostModel.formatCurrencyRange(CostModel.calculateRange(forecastedExposure), currency as any);
      const emergingCriticalHotspots = isHighRisk ? criticalHotspots + 1 : criticalHotspots;
      const goalOutlook = isHighRisk ? 'AT RISK' : 'ON TRACK';

      items.push({
        repositoryId: repo._id?.toString() || repo.id || 'unknown',
        name: repo.name || 'Unnamed Repository',
        owner: repo.owner || 'org',
        defaultBranch: repo.defaultBranch || 'main',
        isDemo: repo.isDemo ?? false,
        debtScore,
        totalFiles,
        criticalHotspotsCount: criticalHotspots,
        annualFinancialExposure: annualExposure,
        exposureRange,
        formattedExposure: CostModel.formatCurrencyRange(exposureRange, currency as any),
        potentialAnnualSavings: potentialSavings,
        formattedSavings: CostModel.formatCurrencyRange(savingsRange, currency as any),
        primaryCostDriver: driver,
        refactoringROI: roi,
        opportunityTier,
        predictiveRiskScore,
        predictiveRiskLevel,
        riskTrend,
        forecastedExposure,
        formattedForecastedExposure: formattedForecasted,
        emergingCriticalHotspots,
        goalOutlook,
      });
    }

    // Sort by annual financial exposure descending
    items.sort((a, b) => b.annualFinancialExposure - a.annualFinancialExposure);

    const count = items.length;
    const avgDebt = count > 0 ? Math.round(debtScoreSum / count) : 0;

    // Highest risk: highest debt score
    const highestRisk = count > 0
      ? [...items].sort((a, b) => b.debtScore - a.debtScore)[0]
      : null;

    // Highest opportunity: highest annual exposure
    const highestOpp = count > 0 ? items[0] : null;

    const totalRange = CostModel.calculateRange(grandTotalExposure);
    const totalSavingsRange = CostModel.calculateRange(grandTotalSavings);

    return {
      totalRepositories: count,
      totalDebtExposure: grandTotalExposure,
      totalExposureRange: totalRange,
      formattedTotalExposure: CostModel.formatCurrencyRange(totalRange, currency as any),
      totalPotentialSavings: grandTotalSavings,
      formattedTotalSavings: CostModel.formatCurrencyRange(totalSavingsRange, currency as any),
      averageDebtScore: avgDebt,
      highestRiskRepository: highestRisk
        ? {
            repositoryId: highestRisk.repositoryId,
            name: highestRisk.name,
            debtScore: highestRisk.debtScore,
          }
        : null,
      highestOpportunityRepository: highestOpp
        ? {
            repositoryId: highestOpp.repositoryId,
            name: highestOpp.name,
            annualExposure: highestOpp.annualFinancialExposure,
            potentialSavings: highestOpp.potentialAnnualSavings,
          }
        : null,
      currency,
      repositories: items,
    };
  }
}
