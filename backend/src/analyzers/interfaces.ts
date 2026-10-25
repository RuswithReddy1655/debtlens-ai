/**
 * DebtLens AI - Core Analyzer & Service Interfaces
 * Defines modular, decoupled contracts for git ingestion, static analysis,
 * complexity evaluation, debt scoring, and financial quantification.
 */

export interface RepositoryMetadata {
  id: string;
  name: string;
  owner: string;
  url: string;
  defaultBranch: string;
  isDemo: boolean;
  clonePath?: string;
}

export interface CommitInfo {
  hash: string;
  authorName: string;
  authorEmail: string;
  timestamp: Date;
  message: string;
  filesChanged: {
    path: string;
    additions: number;
    deletions: number;
  }[];
  isFixCommit: boolean;
}

export interface FileAnalysisTarget {
  filePath: string;
  relativePath: string;
  language: string;
  content?: string;
  sizeBytes: number;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  logicalLinesOfCode: number;
  nestingDepthMax: number;
  functionCount: number;
  commentRatio: number;
  duplicationPercentage: number;
}

export interface DefectMetrics {
  totalDefects: number;
  criticalDefects: number;
  reworkHoursSpent: number;
  defectDensityPerKLoC: number;
  defectHistory: {
    id: string;
    severity: string;
    resolvedAt?: Date;
    reworkHours: number;
  }[];
}

export interface OwnershipMetrics {
  primaryOwner: string;
  primaryOwnerPercentage: number;
  totalContributors: number;
  ownershipEntropy: number; // 0 (single owner) to 1 (broad spread)
  isKnowledgeSilo: boolean;
  topContributors: {
    name: string;
    email: string;
    commitCount: number;
    sharePercentage: number;
  }[];
}

export interface LegacyMetrics {
  isLegacy: boolean;
  monthsSinceLastModified: number;
  dependencyFreshnessScore: number; // 0 - 100
  deprecatedApiCount: number;
  frameworkVersionLagMonths: number;
}

export interface ChurnMetrics {
  commitCount: number;
  changeFrequencyPerMonth: number;
  reworkCommitCount: number;
  linesAddedTotal: number;
  linesDeletedTotal: number;
}

export interface FileDebtScore {
  filePath: string;
  overallDebtScore: number; // 0 - 100
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  debtHours: number;
  debtDrivers: string[];
  components: {
    complexityScore: number;
    churnScore: number;
    defectScore: number;
    ownershipScore: number;
    legacyScore: number;
  };
}

export interface HotspotItem {
  rank: number;
  filePath: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  debtScore: number;
  complexityScore: number;
  churnScore: number;
  estimatedRemediationHours: number;
  estimatedRemediationCost: number;
  historicalReworkCost: number;
  futureAvoidableCost: number;
  potentialBenefit: number;
  primaryDebtDrivers: string[];
}

export interface FinancialFormulaTrace {
  input: Record<string, number | string>;
  formula: string;
  result: number;
  explanation: string;
}

export interface FinancialValuation {
  currency: string;
  hourlyRate: number;
  estimatedRemediationInvestment: {
    totalHours: number;
    totalCost: number;
    trace: FinancialFormulaTrace;
  };
  historicalMaintenanceReworkBurden: {
    totalHours: number;
    totalCost: number;
    trace: FinancialFormulaTrace;
  };
  estimatedFutureAvoidableCost: {
    projectedAnnualCost: number;
    trace: FinancialFormulaTrace;
  };
  potentialRefactoringBenefit: {
    netSavings: number;
    roiRatio: number;
    paybackMonths: number;
    trace: FinancialFormulaTrace;
  };
  disclaimer: string;
}

export interface ActionableRecommendation {
  id: string;
  title: string;
  category: 'architecture' | 'refactoring' | 'testing' | 'ownership' | 'dependency';
  priority: 'critical' | 'high' | 'medium' | 'low';
  targetFiles: string[];
  rationale: string;
  actionPlan: string[];
  estimatedEffortHours: number;
  estimatedCost: number;
  projectedAnnualSavings: number;
  roiRatio: number;
  paybackPeriodMonths: number;
}

// ==============================================================================
// SERVICE INTERFACES
// ==============================================================================

export interface GitRepositoryService {
  validateRepository(url: string): Promise<{ isValid: boolean; defaultBranch?: string; error?: string }>;
  fetchMetadata(repoId: string): Promise<RepositoryMetadata>;
  listBranches(repoId: string): Promise<string[]>;
}

export interface GitHistoryAnalyzer {
  analyzeHistory(repoId: string, branch: string, maxCommits?: number): Promise<{
    commits: CommitInfo[];
    fileChurnMap: Map<string, ChurnMetrics>;
  }>;
}

export interface SourceCodeAnalyzer {
  enumerateFiles(repoId: string, branch: string): Promise<FileAnalysisTarget[]>;
}

export interface ComplexityAnalyzer {
  calculateComplexity(target: FileAnalysisTarget): Promise<ComplexityMetrics>;
}

export interface DefectAnalyzer {
  analyzeDefects(repoId: string, filePath: string): Promise<DefectMetrics>;
}

export interface OwnershipAnalyzer {
  analyzeOwnership(commits: CommitInfo[], filePath: string): Promise<OwnershipMetrics>;
}

export interface LegacyAnalyzer {
  analyzeLegacy(filePath: string, lastModified: Date): Promise<LegacyMetrics>;
}

export interface HotspotAnalyzer {
  identifyHotspots(
    fileMetrics: FileDebtScore[],
    financialRates: { hourlyRate: number }
  ): Promise<HotspotItem[]>;
}

export interface TechnicalDebtEngine {
  computeFileDebt(
    complexity: ComplexityMetrics,
    churn: ChurnMetrics,
    defect: DefectMetrics,
    ownership: OwnershipMetrics,
    legacy: LegacyMetrics
  ): Promise<FileDebtScore>;
}

export interface FinancialCostEngine {
  calculateValuation(
    debtScores: FileDebtScore[],
    hourlyRate?: number
  ): Promise<FinancialValuation>;
}

export interface RecommendationEngine {
  generateRecommendations(
    hotspots: HotspotItem[],
    debtScores: FileDebtScore[],
    hourlyRate?: number
  ): Promise<ActionableRecommendation[]>;
}
