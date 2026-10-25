import { CostModel, CostRange, FinancialAssumptions } from './CostModel';

export interface CostDriverItem {
  driverName: string;
  category: 'maintenance' | 'defect_fix' | 'change_friction' | 'legacy_risk';
  estimatedCost: number;
  costRange: CostRange;
  estimatedHours: number;
  percentageContribution: number;
  keySignals: string[];
  explanation: string;
}

export interface FileCostDriverContribution {
  filePath: string;
  language: string;
  totalAnnualImpact: number;
  costRange: CostRange;
  maintenanceCost: number;
  defectCost: number;
  changeCost: number;
  legacyCost: number;
  primaryDriver: string;
  cyclomaticComplexity: number;
  totalChurn: number;
  defectFixCommitCount: number;
  explanation: string;
}

export interface CostDriverBreakdown {
  totalAnnualImpact: number;
  totalCostRange: CostRange;
  currency: string;
  hourlyRate: number;
  drivers: {
    maintenanceFriction: CostDriverItem;
    defectFixBurden: CostDriverItem;
    changeFriction: CostDriverItem;
    legacyRisk: CostDriverItem;
  };
  topCostDriverFiles: FileCostDriverContribution[];
}

export class CostDriverEngine {
  /**
   * Evaluates the 4 distinct cost drivers across analyzed file metrics.
   */
  static calculateCostDrivers(
    fileMetrics: any[],
    hotspots: any[],
    assumptions: FinancialAssumptions
  ): CostDriverBreakdown {
    const rate = assumptions.hourlyRate;
    const fileContributions: FileCostDriverContribution[] = [];

    let totalMaintHours = 0;
    let totalDefectHours = 0;
    let totalChangeHours = 0;
    let totalLegacyHours = 0;

    for (const f of fileMetrics) {
      const codeLines = f.codeLines ?? f.linesOfCode ?? 100;
      const complexity = f.cyclomaticComplexity ?? 5;
      const churn = f.totalChurn ?? 0;
      const changeCount = f.changeCount ?? 1;
      const defectCount = f.defectFixCommitCount ?? 0;
      const isLegacy = f.isLegacyCandidate ?? false;
      const isHotspot = hotspots.some((h) => h.filePath === f.filePath);

      // 1. Maintenance Friction Hours
      // Base maintenance effort from size & complexity
      const baseComplexityFactor = Math.max(1, complexity / 10);
      const sizeFactor = Math.max(1, codeLines / 150);
      const fileMaintHours = Math.round(
        (isHotspot ? assumptions.averageMaintenanceHoursCritical : assumptions.averageMaintenanceHoursMedium) *
          0.6 *
          (baseComplexityFactor * 0.7 + sizeFactor * 0.3)
      );

      // 2. Defect/Fix Burden Hours
      // Heuristic hours spent triaging and patching recurring defects
      const fileDefectHours = Math.round(
        defectCount * assumptions.defectFixHoursHeuristic * (assumptions.defectRemediationMultiplier / 2)
      );

      // 3. Change Friction Hours
      // Friction when altering frequently modified code
      const normalizedChurn = Math.min(50, Math.round(churn / 40));
      const fileChangeHours = Math.round(
        (normalizedChurn * 0.4 + changeCount * 0.3) * assumptions.changeFrictionMultiplier
      );

      // 4. Legacy Risk Hours
      // Aging or stale high-complexity code with abandoned ownership
      let fileLegacyHours = 0;
      if (isLegacy && complexity >= 10) {
        fileLegacyHours = Math.round(16 * assumptions.legacyRiskMultiplier);
      } else if (f.daysSinceLastChange && f.daysSinceLastChange > 180 && complexity >= 15) {
        fileLegacyHours = Math.round(10 * assumptions.legacyRiskMultiplier);
      }

      totalMaintHours += fileMaintHours;
      totalDefectHours += fileDefectHours;
      totalChangeHours += fileChangeHours;
      totalLegacyHours += fileLegacyHours;

      const fileMaintCost = Math.round(fileMaintHours * rate);
      const fileDefectCost = Math.round(fileDefectHours * rate);
      const fileChangeCost = Math.round(fileChangeHours * rate);
      const fileLegacyCost = Math.round(fileLegacyHours * rate);

      const fileTotalCost = fileMaintCost + fileDefectCost + fileChangeCost + fileLegacyCost;

      // Identify primary driver for this file
      let primaryDriver = 'Maintenance Friction';
      let maxCost = fileMaintCost;
      if (fileDefectCost > maxCost) {
        primaryDriver = 'Defect/Fix Burden';
        maxCost = fileDefectCost;
      }
      if (fileChangeCost > maxCost) {
        primaryDriver = 'Change Friction';
        maxCost = fileChangeCost;
      }
      if (fileLegacyCost > maxCost) {
        primaryDriver = 'Legacy Staleness';
      }

      // Build explainable justification
      const reasons: string[] = [];
      if (complexity >= 15) reasons.push(`High AST cyclomatic complexity (${complexity})`);
      if (churn >= 250) reasons.push(`High code churn (${churn} lines flux)`);
      if (defectCount >= 2) reasons.push(`Repeated defect-fix activity (${defectCount} fix commits)`);
      if (isLegacy) reasons.push('Identified as legacy candidate due to age & dormancy');
      const explanation = reasons.length > 0 ? reasons.join(' + ') : 'Standard maintainability drag';

      fileContributions.push({
        filePath: f.filePath,
        language: f.language || 'Unknown',
        totalAnnualImpact: fileTotalCost,
        costRange: CostModel.calculateRange(fileTotalCost),
        maintenanceCost: fileMaintCost,
        defectCost: fileDefectCost,
        changeCost: fileChangeCost,
        legacyCost: fileLegacyCost,
        primaryDriver,
        cyclomaticComplexity: complexity,
        totalChurn: churn,
        defectFixCommitCount: defectCount,
        explanation,
      });
    }

    // Sort files by total annual impact descending
    fileContributions.sort((a, b) => b.totalAnnualImpact - a.totalAnnualImpact);

    const totalMaintCost = Math.round(totalMaintHours * rate);
    const totalDefectCost = Math.round(totalDefectHours * rate);
    const totalChangeCost = Math.round(totalChangeHours * rate);
    const totalLegacyCost = Math.round(totalLegacyHours * rate);

    const grandTotal = totalMaintCost + totalDefectCost + totalChangeCost + totalLegacyCost;
    const safeGrandTotal = Math.max(1, grandTotal);

    const maintPercent = Math.round((totalMaintCost / safeGrandTotal) * 100);
    const defectPercent = Math.round((totalDefectCost / safeGrandTotal) * 100);
    const changePercent = Math.round((totalChangeCost / safeGrandTotal) * 100);
    const legacyPercent = Math.max(0, 100 - maintPercent - defectPercent - changePercent);

    return {
      totalAnnualImpact: grandTotal,
      totalCostRange: CostModel.calculateRange(grandTotal),
      currency: assumptions.currency,
      hourlyRate: rate,
      drivers: {
        maintenanceFriction: {
          driverName: 'Maintenance Friction',
          category: 'maintenance',
          estimatedCost: totalMaintCost,
          costRange: CostModel.calculateRange(totalMaintCost),
          estimatedHours: totalMaintHours,
          percentageContribution: maintPercent,
          keySignals: ['AST Cyclomatic Complexity', 'Lines of Code', 'Nesting Depth'],
          explanation: 'Developer capacity lost understanding and navigating highly complex, tangled source files.',
        },
        defectFixBurden: {
          driverName: 'Defect/Fix Burden',
          category: 'defect_fix',
          estimatedCost: totalDefectCost,
          costRange: CostModel.calculateRange(totalDefectCost),
          estimatedHours: totalDefectHours,
          percentageContribution: defectPercent,
          keySignals: ['Defect-Fix Commits', 'Repeated Bug Patches', 'Regression Cycles'],
          explanation: 'Recurring engineering hours expended on bug triage, hotfix commits, and defect remediation cycles.',
        },
        changeFriction: {
          driverName: 'Change Friction',
          category: 'change_friction',
          estimatedCost: totalChangeCost,
          costRange: CostModel.calculateRange(totalChangeCost),
          estimatedHours: totalChangeHours,
          percentageContribution: changePercent,
          keySignals: ['Code Churn (Lines Added/Deleted)', 'Change Frequency', 'Active Revisions'],
          explanation: 'Slowed velocity and merge conflicts arising from repeatedly modifying unstable, volatile modules.',
        },
        legacyRisk: {
          driverName: 'Legacy Risk',
          category: 'legacy_risk',
          estimatedCost: totalLegacyCost,
          costRange: CostModel.calculateRange(totalLegacyCost),
          estimatedHours: totalLegacyHours,
          percentageContribution: legacyPercent,
          keySignals: ['Code Dormancy', 'Stale Modules', 'Abandoned Contributor Ownership'],
          explanation: 'Onboarding friction and fragility when modifying long-dormant code with lost institutional memory.',
        },
      },
      topCostDriverFiles: fileContributions.slice(0, 10),
    };
  }
}
