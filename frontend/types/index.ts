export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Repository {
  _id: string;
  id?: string;
  name: string;
  owner: string;
  url: string;
  defaultBranch: string;
  isDemo: boolean;
  description?: string;
  primaryLanguage?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  status: 'idle' | 'analyzing' | 'completed' | 'failed';
  totalCommits?: number;
  firstCommitAt?: string;
  lastCommitAt?: string;
  activeBranches?: string[];
  lastAnalyzedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisSummary {
  totalFiles: number;
  totalLinesOfCode: number;
  totalDebtHours: number;
  estimatedRemediationCost: number;
  annualAvoidableCost: number;
  historicalReworkCost: number;
  potentialRefactoringBenefit: number;
  overallHealthScore: number;
  averageComplexity: number;
  hotspotCount: number;
  criticalHotspots: number;
  filesAnalyzed?: number;
  commitsAnalyzed?: number;
}

export interface Analysis {
  _id: string;
  id?: string;
  repositoryId: string;
  branch: string;
  commitHash: string;
  commitSha?: string;
  status:
    | 'queued'
    | 'cloning'
    | 'analyzing'
    | 'calculating'
    | 'persisting'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'in_progress';
  progress?: number;
  currentStage?: string;
  filesDiscovered?: number;
  filesAnalyzed?: number;
  commitsAnalyzed?: number;
  error?: string;
  isDemo: boolean;
  summary: AnalysisSummary;
  technicalDebtScore?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisJobStatus {
  analysisId: string;
  repositoryId: string;
  status:
    | 'queued'
    | 'cloning'
    | 'analyzing'
    | 'calculating'
    | 'persisting'
    | 'completed'
    | 'failed'
    | 'cancelled';
  progress: number;
  currentStage: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  commitSha?: string;
  filesDiscovered: number;
  filesAnalyzed: number;
  commitsAnalyzed: number;
  isDemo: boolean;
}

export interface FileMetric {
  _id: string;
  id?: string;
  filePath: string;
  directory: string;
  language: string;
  linesOfCode: number;
  codeLines?: number;
  blankLines?: number;
  commentLines?: number;
  functionCount?: number;
  classCount?: number;
  importCount?: number;
  exportCount?: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepthMax?: number;
  churnCount: number;
  linesAdded?: number;
  linesDeleted?: number;
  totalChurn?: number;
  changesPerMonth?: number;
  defectCount: number;
  defectFixCommitCount?: number;
  defectFixFrequency?: number;
  duplicationPercentage: number;
  testCoveragePercentage: number;
  contributorCount: number;
  ownershipEntropy: number;
  primaryContributor?: string;
  ownershipPercentage?: number;
  firstSeenAt?: string;
  lastModifiedAt?: string;
  ageInDays?: number;
  daysSinceLastChange?: number;
  isLegacy: boolean;
  debtScore: number;
  debtHours: number;
  estimatedRemediationCost: number;
  riskCategory: RiskLevel;
  analysisStatus?: 'SUPPORTED' | 'PARTIAL' | 'UNSUPPORTED';
  reason?: string;
  isDemo: boolean;
}

export interface Hotspot {
  _id?: string;
  rank: number;
  filePath: string;
  riskLevel: RiskLevel;
  debtScore: number;
  complexityScore: number;
  churnScore: number;
  defectFixCount?: number;
  changeFrequency?: number;
  estimatedRemediationHours: number;
  estimatedRemediationCost: number;
  historicalReworkCost: number;
  futureAvoidableCost: number;
  potentialBenefit: number;
  primaryDebtDrivers: string[];
  reason?: string;
  isDemo?: boolean;
}

export interface FormulaTrace {
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
    trace: FormulaTrace;
    formulaTrace?: string;
  };
  historicalMaintenanceReworkBurden: {
    totalHours: number;
    totalCost: number;
    trace: FormulaTrace;
    formulaTrace?: string;
  };
  estimatedFutureAvoidableCost: {
    projectedAnnualCost: number;
    trace: FormulaTrace;
    formulaTrace?: string;
  };
  potentialRefactoringBenefit: {
    netSavings: number;
    roiRatio?: number;
    roiMultiple?: number;
    paybackMonths?: number;
    paybackPeriodMonths?: number;
    trace: FormulaTrace;
    formulaTrace?: string;
  };
  disclaimer: string;
}

export interface Recommendation {
  id?: string;
  _id?: string;
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

export interface TrendPoint {
  _id: string;
  id?: string;
  repositoryId: string;
  analysisId?: string;
  date: string;
  commitHash: string;
  totalDebtHours: number;
  healthScore: number;
  remediationCost: number;
  reworkHours: number;
  avoidableAnnualCost: number;
  linesOfCode: number;
  hotspotCount: number;
  criticalHotspots: number;
  isDemo: boolean;
}

// ==========================================
// Phase 3: Financial Intelligence & Decision Support
// ==========================================

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';

export interface CostRange {
  low: number;
  expected: number;
  high: number;
  formatted?: string;
}

export interface FinancialTraceItem {
  metric: string;
  category: string;
  inputs: Array<{ name: string; value: number | string; unit?: string }>;
  formula: string;
  estimatedValue: number;
  range: CostRange;
  currency: string;
  confidence: ConfidenceLevel;
  explanation: string;
}

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

export interface FinancialIntelligenceData {
  analysisId: string;
  repositoryId: string;
  currency: CurrencyCode;
  currencySymbol: string;
  hourlyRate: number;
  modelVersion: string;
  confidence: ConfidenceLevel;
  summary: {
    totalAnnualExposure: number;
    annualExposureRange: CostRange;
    formattedAnnualExposure: string;
    remediationInvestment: number;
    investmentRange: CostRange;
    formattedInvestment: string;
    historicalReworkBurden: number;
    historicalReworkRange: CostRange;
    formattedHistoricalRework: string;
    potentialAnnualSavings: number;
    savingsRange: CostRange;
    formattedSavings: string;
    twoYearNetBenefit: number;
    netBenefitRange: CostRange;
    formattedNetBenefit: string;
    roiPercentage: number;
    paybackPeriodMonths: number | null;
  };
  fourQuadrants: {
    estimatedRemediationInvestment: {
      totalHours: number;
      totalCost: number;
      costRange: CostRange;
      trace: FinancialTraceItem;
    };
    historicalMaintenanceReworkBurden: {
      totalHours: number;
      totalCost: number;
      costRange: CostRange;
      trace: FinancialTraceItem;
    };
    estimatedFutureAvoidableCost: {
      projectedAnnualHours: number;
      projectedAnnualCost: number;
      costRange: CostRange;
      trace: FinancialTraceItem;
    };
    potentialRefactoringBenefit: {
      netSavings: number;
      roiPercentage: number;
      paybackPeriodMonths: number | null;
      costRange: CostRange;
      trace: FinancialTraceItem;
    };
  };
  costDrivers: CostDriverBreakdown;
  assumptions: {
    currency: CurrencyCode;
    hourlyRate: number;
    annualWorkingHoursPerDev: number;
    averageMaintenanceHoursCritical: number;
    averageMaintenanceHoursHigh: number;
    averageMaintenanceHoursMedium: number;
    defectFixHoursHeuristic: number;
    defectRemediationMultiplier: number;
    changeFrictionMultiplier: number;
    legacyRiskMultiplier: number;
    defaultRemediationEffectiveness: number;
    evaluationWindowYears: number;
    modelVersion: string;
  };
  disclaimer: string;
}

export type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MONITOR';

export type MatrixQuadrant = 'QUICK WINS' | 'STRATEGIC' | 'OPPORTUNISTIC' | 'DEFER';

export interface EffortRange {
  lowHours: number;
  expectedHours: number;
  highHours: number;
  formattedRange: string;
}

export interface PriorityItem {
  rank: number;
  filePath: string;
  language: string;
  priorityTier: PriorityTier;
  matrixQuadrant: MatrixQuadrant;
  priorityScore: number;
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

export interface ScenarioResult {
  scenarioName: string;
  selectedFilesCount: number;
  selectedFilePaths: string[];
  currency: string;
  hourlyRate: number;
  remediationEffectiveness: number;
  estimatedRefactoringHours: number;
  refactoringInvestment: number;
  investmentRange: CostRange;
  currentAnnualImpact: number;
  currentCostRange: CostRange;
  potentialAnnualSavings: number;
  savingsRange: CostRange;
  residualAnnualImpact: number;
  residualCostRange: CostRange;
  twoYearNetSavings: number;
  netSavingsRange: CostRange;
  roiPercentage: number;
  paybackPeriodMonths: number | null;
  projectedDebtScoreReduction: number;
  projectedResidualDebtScore: number;
  isViable: boolean;
  explanation: string;
}

export interface ScenarioComparison {
  analysisId: string;
  baselineAnnualImpact: number;
  baselineDebtScore: number;
  currency: string;
  scenarios: ScenarioResult[];
}

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

export interface AnalysisComparisonSummary {
  repositoryId: string;
  currency: string;
  baselineAnalysis: {
    analysisId: string;
    commitSha?: string;
    createdAt: string;
    debtScore: number;
    hotspotsCount: number;
    annualExposure: number;
    formattedExposure: string;
  };
  targetAnalysis: {
    analysisId: string;
    commitSha?: string;
    createdAt: string;
    debtScore: number;
    hotspotsCount: number;
    annualExposure: number;
    formattedExposure: string;
  };
  deltas: {
    debtScoreDelta: number;
    hotspotsDelta: number;
    annualExposureDelta: number;
    modeledReductionCostRange: CostRange;
    formattedModeledReduction: string;
    direction: 'IMPROVED' | 'DEGRADED' | 'UNCHANGED';
  };
  explanation: string;
  disclaimer: string;
}

export interface ExecutiveReport {
  generatedAt: string;
  repositoryId: string;
  analysisId: string;
  currency: string;
  headlineSummary: string;
  keyMetrics: {
    overallDebtScore: number;
    annualFinancialExposureFormatted: string;
    topCostDriver: string;
    criticalHotspotsCount: number;
    potentialAnnualSavingsFormatted: string;
    refactoringROIFormatted: string;
    paybackPeriodMonths: number | null;
  };
  executiveSummaryText: string;
  financialPositionText: string;
  costDriversSummaryText: string;
  priorityActions: Array<{
    rank: number;
    filePath: string;
    priorityTier: string;
    matrixQuadrant: string;
    annualImpactFormatted: string;
    savingsFormatted: string;
    suggestedAction: string;
    reason: string;
  }>;
  confidenceAndLimitations: {
    confidenceLevel: string;
    observedSignals: string[];
    derivedSignals: string[];
    estimatedSignals: string[];
    modeledSignals: string[];
    limitations: string[];
  };
  predictiveOutlook?: {
    currentDebtPosition: string;
    futureRiskTier: string;
    futureRiskScore: number;
    riskTrend: string;
    forecastedExposureFormatted: string;
    potentialIncreaseFormatted: string;
    emergingHotspotsCount: number;
    costOfDoingNothingText: string;
    recommendedFocus: string[];
    goalOutlook: string;
    predictionConfidence: string;
  };
  markdownBrief: string;
}

// ==========================================
// PHASE 4 CONTINUOUS INTELLIGENCE TYPES
// ==========================================

export type ConnectionStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'AUTH_REQUIRED'
  | 'ERROR'
  | 'ANALYSIS_PENDING';

export type AnalysisFrequency =
  | 'MANUAL'
  | 'DAILY'
  | 'WEEKLY'
  | 'AFTER_PUSH'
  | 'AFTER_MERGE';

export interface RepositoryConnection {
  _id: string;
  id?: string;
  userId?: string;
  organizationId?: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'local';
  providerRepositoryId: string;
  repositoryId: string;
  repositoryName: string;
  owner: string;
  defaultBranch: string;
  visibility: 'public' | 'private';
  installationId?: string;
  connectionStatus: ConnectionStatus;
  lastAnalysisId?: string;
  lastAnalysisAt?: string;
  nextAnalysisAt?: string;
  analysisFrequency: AnalysisFrequency;
  webhookEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisSnapshot {
  _id: string;
  id?: string;
  analysisId: string;
  repositoryId: string;
  commitSha: string;
  branch: string;
  timestamp: string;
  linesOfCode: number;
  commitCount: number;
  totalChurn: number;
  codeAge: number;
  complexity: number;
  maxNesting: number;
  hotspotCount: number;
  criticalHotspotCount: number;
  technicalDebtScore: number;
  financialExposure: number;
  maintenanceFriction: number;
  defectFixBurden: number;
  changeFriction: number;
  legacyRisk: number;
  priorityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    monitor: number;
  };
  telemetryConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';
  createdAt: string;
}

export interface MetricDelta {
  metricName: string;
  before: number;
  after: number;
  delta: number;
  percentChange: number;
  direction: 'REDUCED' | 'INCREASED' | 'UNCHANGED' | 'INSUFFICIENT DATA';
  isImprovement: boolean;
}

export interface SnapshotComparisonResult {
  repositoryId: string;
  baselineSnapshotId: string;
  currentSnapshotId: string;
  baselineCommitSha: string;
  currentCommitSha: string;
  baselineDate: string;
  currentDate: string;
  overallStatus: 'IMPROVING' | 'WORSENING' | 'STABLE' | 'INSUFFICIENT DATA';
  deltas: {
    debtScore: MetricDelta;
    complexity: MetricDelta;
    churn: MetricDelta;
    hotspots: MetricDelta;
    criticalHotspots: MetricDelta;
    financialExposure: MetricDelta;
  };
  summarySentence: string;
}

export type DebtItemStatus =
  | 'DETECTED'
  | 'PRIORITIZED'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'WONT_FIX'
  | 'ACCEPTED_RISK'
  | 'REOPENED';

export type DebtPriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MONITOR';

export type VerificationResultStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'NOT_VERIFIED'
  | 'INSUFFICIENT_DATA';

export interface DebtItem {
  _id: string;
  id?: string;
  repositoryId: string;
  debtItemId: string;
  filePath: string;
  symbolName: string;
  category: 'COMPLEXITY' | 'CHURN' | 'DEFECT' | 'LEGACY' | 'ARCHITECTURE';
  firstDetectedAt: string;
  lastDetectedAt: string;
  currentStatus: DebtItemStatus;
  priority: DebtPriorityTier;
  priorityScore: number;
  technicalRisk: number;
  financialImpact: number;
  changeFrequency: number;
  defectActivity: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCost: number;
  estimatedEffortHours: number;
  assignedTo?: string;
  targetDate?: string;
  resolutionCommitSha?: string;
  resolutionDate?: string;
  pullRequestUrl?: string;
  externalIssueUrl?: string;
  notes?: string;
  verificationAnalysisId?: string;
  verificationStatus: VerificationResultStatus;
  verificationDetails?: {
    complexityReductionPct?: number;
    hotspotScoreDelta?: number;
    message?: string;
  };
  baselineMetrics?: {
    complexity: number;
    debtScore: number;
    churn: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VerificationResult {
  debtItemId: string;
  filePath: string;
  verificationStatus: VerificationResultStatus;
  complexityBefore: number;
  complexityAfter: number;
  complexityDelta: number;
  complexityReductionPct: number;
  hotspotScoreBefore: number;
  hotspotScoreAfter: number;
  hotspotScoreDelta: number;
  verifiedTechnicalImprovement: string;
  modeledAnnualExposureReduction: number;
  realizedBusinessSavings: string;
  message: string;
}

export type GoalMetric =
  | 'CRITICAL_HOTSPOTS'
  | 'TECHNICAL_DEBT_SCORE'
  | 'ANNUAL_EXPOSURE'
  | 'HIGH_PRIORITY_DEBT'
  | 'AVERAGE_COMPLEXITY';

export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'MISSED' | 'PAUSED' | 'CANCELLED';

export interface EngineeringGoal {
  _id: string;
  id?: string;
  repositoryId: string;
  title: string;
  description?: string;
  metric: GoalMetric;
  targetValue: number;
  startingValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: GoalStatus;
  progressPercentage: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AlertType =
  | 'CRITICAL_HOTSPOT_INCREASED'
  | 'DEBT_SCORE_INCREASED'
  | 'EXPOSURE_INCREASED'
  | 'NEW_CRITICAL_DEBT'
  | 'DEBT_REOPENED'
  | 'GOAL_AT_RISK'
  | 'GOAL_ACHIEVED'
  | 'ANALYSIS_FAILED'
  | 'CONNECTION_EXPIRED'
  | 'PREDICTED_CRITICAL_HOTSPOT'
  | 'ACCELERATING_DEBT'
  | 'FORECASTED_EXPOSURE_INCREASE'
  | 'PREDICTED_GOAL_MISS'
  | 'RISK_ESCALATION';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export type AlertStatus = 'UNREAD' | 'READ' | 'RESOLVED' | 'DISMISSED';

export interface EngineeringAlert {
  _id: string;
  id?: string;
  repositoryId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metric?: string;
  previousValue?: number;
  currentValue?: number;
  threshold?: number;
  status: AlertStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditEvent {
  _id: string;
  id?: string;
  repositoryId: string;
  actorId: string;
  actorType: 'USER' | 'SYSTEM' | 'WEBHOOK' | 'SCHEDULER';
  action: string;
  targetId: string;
  targetType: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface GitHubRepoSummary {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  cloneUrl: string;
  description?: string;
  updatedAt: string;
  language?: string;
}

// ==========================================
// Phase 5: Predictive Intelligence & Risk Forecasting Types
// ==========================================

export type ForecastHorizon = 'NEXT_ANALYSIS' | 'SHORT_TERM' | 'MEDIUM_TERM';
export type PredictiveRiskTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'STABLE' | 'INSUFFICIENT_DATA';
export type PredictiveTrend = 'IMPROVING' | 'STABLE' | 'WORSENING' | 'ACCELERATING' | 'DECELERATING' | 'INSUFFICIENT_DATA';
export type PredictionConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';

export interface NumericForecastRange {
  low: number;
  expected: number;
  high: number;
}

export interface FinancialForecastRange extends NumericForecastRange {
  currency: string;
  formattedRange: string;
}

export interface PredictedHotspot {
  filePath: string;
  currentRisk: string;
  predictedRisk: string;
  riskTrend: string;
  confidence: string;
  primaryDrivers: string[];
  complexityGrowthPct: number;
  churnGrowthPct: number;
  defectActivityCount: number;
  financialExposure: number;
  recommendedAction: string;
}

export interface FileRiskForecast {
  filePath: string;
  currentRisk: string;
  predictedRisk: string;
  riskDelta: number;
  confidence: string;
  isDeterioratingRapidly: boolean;
}

export interface PredictiveRiskDriver {
  feature: string;
  value: string | number;
  weight: number;
  contribution: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
}

export interface PredictiveAction {
  actionId: string;
  target: string;
  recommendation: string;
  why: string[];
  estimatedEffort: {
    lowHours: number;
    expectedHours: number;
    highHours: number;
    formatted: string;
  };
  expectedOutcome: string;
  confidence: string;
  riskDrivers: PredictiveRiskDriver[];
  feedback?: 'HELPFUL' | 'NOT_HELPFUL' | 'NOT_APPLICABLE' | null;
}

export interface GoalForecast {
  goalId: string;
  title: string;
  metric: string;
  currentProgress: number;
  requiredProgress: number;
  historicalVelocity: number;
  forecastedValue: number;
  status: 'ON TRACK' | 'AT RISK' | 'LIKELY TO MISS' | 'ACHIEVABLE' | 'ACHIEVED' | 'INSUFFICIENT DATA';
  rationale: string;
}

export interface WhatIfForecastScenario {
  scenarioName: string;
  description: string;
  forecastedExposure: number;
  exposureRange: NumericForecastRange;
  modeledDifference: number;
  formattedDifference: string;
  modeledRiskLevel: string;
  remediationEffortHours: number;
}

export interface PredictiveAssessment {
  _id?: string;
  id?: string;
  repositoryId: string;
  analysisId: string;
  generatedAt: string;
  forecastHorizon: ForecastHorizon;
  modelVersion: string;
  currentDebtScore: number;
  predictedDebtScore: NumericForecastRange;
  currentFinancialExposure: number;
  predictedFinancialExposure: FinancialForecastRange;
  currentCriticalHotspots: number;
  predictedCriticalHotspots: NumericForecastRange;
  riskLevel: PredictiveRiskTier;
  riskScore: number;
  riskTrend: PredictiveTrend;
  confidence: PredictionConfidenceLevel;
  confidenceFactors: {
    historicalSnapshotsCount: number;
    dataCompleteness: number;
    metricStability: number;
    gitHistoryQuality: string;
    reasons: string[];
  };
  costOfDoingNothing: {
    currentAnnualExposure: number;
    forecastedAnnualExposure: number;
    potentialIncrease: number;
    currency: string;
    formattedPotentialIncrease: string;
    rationale: string;
  };
  featureSnapshot?: Record<string, any>;
  predictionTrace?: {
    modelVersion: string;
    inputSnapshotIds: string[];
    featureValues: Record<string, number | string>;
    calculationMethod: string;
    weights: Record<string, number>;
    thresholds: Record<string, number>;
    confidence: string;
    generatedAt: string;
  };
  predictedHotspots: PredictedHotspot[];
  fileLevelRiskForecasts: FileRiskForecast[];
  recommendedActions: PredictiveAction[];
  goalForecasts: GoalForecast[];
  whatIfScenarios: WhatIfForecastScenario[];
}

export interface CapacityPlanResult {
  sprintCapacityHours: number;
  allocatedRemediationHours: number;
  remainingCapacityHours: number;
  utilizationRatePercentage: number;
  selectedActions: PredictiveAction[];
  unallocatedActions: PredictiveAction[];
  modeledRiskReduction: 'HIGH' | 'MODERATE' | 'LOW';
  summary: string;
}

export interface AccuracyReport {
  repositoryId: string;
  totalEvaluated: number;
  overallAccuracyPercentage: number;
  meanAbsoluteError: number;
  meanAbsolutePercentageError: number;
  rangeCoveragePercentage: number;
  directionalAccuracyPercentage: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';
  metricsBreakdown: {
    debtScore: { count: number; mae: number; withinRangeRate: number };
    financialExposure: { count: number; mae: number; withinRangeRate: number };
    criticalHotspots: { count: number; mae: number; withinRangeRate: number };
  };
  evaluations: any[];
  summary: string;
}

