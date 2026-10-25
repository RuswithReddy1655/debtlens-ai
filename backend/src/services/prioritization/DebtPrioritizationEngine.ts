import { ImpactScoreEngine, EffortRange } from './ImpactScoreEngine';
import { ConfidenceLevel, CostModel, CostRange } from '../financial/CostModel';

export type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MONITOR';

export type MatrixQuadrant = 'QUICK WINS' | 'STRATEGIC' | 'OPPORTUNISTIC' | 'DEFER';

export interface PriorityItem {
  rank: number;
  filePath: string;
  language: string;
  priorityTier: PriorityTier;
  matrixQuadrant: MatrixQuadrant;
  priorityScore: number; // 0 to 100
  technicalRiskScore: number;
  cyclomaticComplexity: number;
  totalChurn: number;
  changeCount: number;
  defectFixCommitCount: number;
  estimatedFinancialImpact: number;
  formattedFinancialImpact: string;
  impactRange: CostRange;
  estimatedRefactoringEffort: EffortRange;
  potentialAnnualSavings: number;
  formattedSavings: string;
  confidence: ConfidenceLevel;
  suggestedAction: string;
  reason: string;
  signals: {
    techRiskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    financialImpactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    changeFrequencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    defectActivityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export interface PrioritizationResult {
  analysisId: string;
  totalItemsPrioritized: number;
  currency: string;
  quadrantDistribution: {
    quickWinsCount: number;
    strategicCount: number;
    opportunisticCount: number;
    deferCount: number;
  };
  tierDistribution: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    monitorCount: number;
  };
  priorities: PriorityItem[];
}

export class DebtPrioritizationEngine {
  /**
   * Prioritizes code debt items across technical risk, financial drag, change frequency, and defect activity.
   */
  static prioritize(params: {
    analysisId: string;
    fileMetrics: any[];
    hotspots: any[];
    currency?: string;
    hourlyRate?: number;
    confidence?: ConfidenceLevel;
  }): PrioritizationResult {
    const rate = params.hourlyRate || 2000;
    const currency = (params.currency as any) || 'INR';
    const confidence = params.confidence || 'HIGH';

    // 1. Calculate individual file annual impacts
    const fileImpactMap = new Map<string, number>();
    let maxImpact = 1;

    for (const f of params.fileMetrics) {
      const isHotspot = params.hotspots.some((h) => h.filePath === f.filePath);
      const maintHours = isHotspot ? 38 : (f.debtScore && f.debtScore >= 50 ? 18 : 6);
      const defectHours = (f.defectFixCommitCount ?? 0) * 8;
      const changeHours = Math.round(((f.totalChurn ?? 0) / 40) * 1.3);
      const annualImpact = Math.round((maintHours + defectHours + changeHours) * rate);

      fileImpactMap.set(f.filePath, annualImpact);
      if (annualImpact > maxImpact) {
        maxImpact = annualImpact;
      }
    }

    // 2. Evaluate each file and compute multi-signal priority score
    const items: PriorityItem[] = [];

    for (const f of params.fileMetrics) {
      const complexity = f.cyclomaticComplexity ?? 5;
      const churn = f.totalChurn ?? 0;
      const changeCount = f.changeCount ?? 1;
      const defectCount = f.defectFixCommitCount ?? 0;
      const debtScore = f.debtScore ?? 40;
      const annualImpact = fileImpactMap.get(f.filePath) || 1000;

      // Normalized components (0 to 100)
      const techRisk = Math.min(100, Math.round(debtScore * 0.7 + Math.min(100, complexity * 3) * 0.3));
      const finImpact = Math.min(100, Math.round((annualImpact / maxImpact) * 100));
      const changeFreq = Math.min(100, Math.round(changeCount * 12 + Math.min(100, churn / 15)));
      const defectSignal = Math.min(100, defectCount * 25);
      const confScore = confidence === 'HIGH' ? 100 : confidence === 'MEDIUM' ? 70 : 40;

      // Priority Formula: 0.30 Tech + 0.30 Financial + 0.20 Change + 0.15 Defect + 0.05 Confidence
      const priorityScore = Math.round(
        techRisk * 0.30 +
        finImpact * 0.30 +
        changeFreq * 0.20 +
        defectSignal * 0.15 +
        confScore * 0.05
      );

      // Determine Priority Tier
      let priorityTier: PriorityTier = 'MONITOR';
      if (priorityScore >= 75) priorityTier = 'CRITICAL';
      else if (priorityScore >= 55) priorityTier = 'HIGH';
      else if (priorityScore >= 35) priorityTier = 'MEDIUM';
      else if (priorityScore >= 18) priorityTier = 'LOW';

      // Determine Impact vs Effort Matrix Quadrant
      const effort = ImpactScoreEngine.estimateRefactoringEffort(
        f.codeLines ?? f.linesOfCode ?? 100,
        complexity,
        f.nestingDepth ?? 2
      );
      const effortScore = Math.min(100, Math.round((effort.expectedHours / 50) * 100));

      let matrixQuadrant: MatrixQuadrant = 'OPPORTUNISTIC';
      if (finImpact >= 50 && effortScore < 50) {
        matrixQuadrant = 'QUICK WINS';
      } else if (finImpact >= 50 && effortScore >= 50) {
        matrixQuadrant = 'STRATEGIC';
      } else if (finImpact < 50 && effortScore < 50) {
        matrixQuadrant = 'OPPORTUNISTIC';
      } else {
        matrixQuadrant = 'DEFER';
      }

      // Potential annual savings (modeled at 65% reduction)
      const potentialSavings = Math.round(annualImpact * 0.65);

      // Structured explanation
      const reasons: string[] = [];
      if (priorityTier === 'CRITICAL' || priorityTier === 'HIGH') {
        if (complexity >= 15) reasons.push(`High AST cyclomatic complexity (${complexity})`);
        if (defectCount >= 2) reasons.push(`Repeated defect-fix activity (${defectCount} patches)`);
        if (churn >= 250) reasons.push(`High code flux (${churn} churn)`);
        if (annualImpact >= (rate * 30)) reasons.push(`Significant modeled annual drag`);
      } else if (priorityTier === 'MEDIUM') {
        reasons.push('Moderate technical complexity with recurring modifications');
      } else {
        reasons.push('Low current change friction or stable architecture');
      }

      const reasonText = reasons.length > 0 ? reasons.join(' + ') : 'Maintainable stable module';

      // Suggested action
      let suggestedAction = 'Monitor in future analysis runs';
      if (matrixQuadrant === 'QUICK WINS') {
        suggestedAction = 'Refactor immediate decision branches and extract helper methods for rapid ROI';
      } else if (matrixQuadrant === 'STRATEGIC') {
        suggestedAction = 'Schedule architectural modularization and break monolithic class responsibilities';
      } else if (matrixQuadrant === 'OPPORTUNISTIC') {
        suggestedAction = 'Address maintainability cleanups incrementally during routine feature edits';
      } else {
        suggestedAction = 'Defer remediation; high effort with low current maintenance drag';
      }

      const impactRange = CostModel.calculateRange(annualImpact);
      const savingsRange = CostModel.calculateRange(potentialSavings);

      items.push({
        rank: 0, // Assigned after sorting
        filePath: f.filePath,
        language: f.language || 'TypeScript',
        priorityTier,
        matrixQuadrant,
        priorityScore,
        technicalRiskScore: techRisk,
        cyclomaticComplexity: complexity,
        totalChurn: churn,
        changeCount,
        defectFixCommitCount: defectCount,
        estimatedFinancialImpact: annualImpact,
        formattedFinancialImpact: CostModel.formatCurrencyRange(impactRange, currency),
        impactRange,
        estimatedRefactoringEffort: effort,
        potentialAnnualSavings: potentialSavings,
        formattedSavings: CostModel.formatCurrencyRange(savingsRange, currency),
        confidence,
        suggestedAction,
        reason: reasonText,
        signals: {
          techRiskLevel: techRisk >= 60 ? 'HIGH' : techRisk >= 35 ? 'MEDIUM' : 'LOW',
          financialImpactLevel: finImpact >= 60 ? 'HIGH' : finImpact >= 35 ? 'MEDIUM' : 'LOW',
          changeFrequencyLevel: changeFreq >= 50 ? 'HIGH' : changeFreq >= 25 ? 'MEDIUM' : 'LOW',
          defectActivityLevel: defectSignal >= 50 ? 'HIGH' : defectSignal >= 25 ? 'MEDIUM' : 'LOW',
        },
      });
    }

    // Sort by priorityScore descending
    items.sort((a, b) => b.priorityScore - a.priorityScore);

    // Assign 1-indexed ranks
    items.forEach((item, index) => {
      item.rank = index + 1;
    });

    const quickWinsCount = items.filter((i) => i.matrixQuadrant === 'QUICK WINS').length;
    const strategicCount = items.filter((i) => i.matrixQuadrant === 'STRATEGIC').length;
    const opportunisticCount = items.filter((i) => i.matrixQuadrant === 'OPPORTUNISTIC').length;
    const deferCount = items.filter((i) => i.matrixQuadrant === 'DEFER').length;

    const criticalCount = items.filter((i) => i.priorityTier === 'CRITICAL').length;
    const highCount = items.filter((i) => i.priorityTier === 'HIGH').length;
    const mediumCount = items.filter((i) => i.priorityTier === 'MEDIUM').length;
    const lowCount = items.filter((i) => i.priorityTier === 'LOW').length;
    const monitorCount = items.filter((i) => i.priorityTier === 'MONITOR').length;

    return {
      analysisId: params.analysisId,
      totalItemsPrioritized: items.length,
      currency,
      quadrantDistribution: {
        quickWinsCount,
        strategicCount,
        opportunisticCount,
        deferCount,
      },
      tierDistribution: {
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        monitorCount,
      },
      priorities: items,
    };
  }
}
