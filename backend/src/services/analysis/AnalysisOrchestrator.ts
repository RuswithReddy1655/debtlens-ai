import path from 'path';
import { Types } from 'mongoose';
import { config } from '../../config/env';
import { getDatabaseStatus } from '../../config/database';
import {
  Analysis,
  Repository,
  FileMetric,
  Hotspot,
  Recommendation,
  TrendPoint,
  Contributor,
  Commit,
  FinancialAssumption,
  RiskLevel,
} from '../../models';
import { RepositorySecurityService } from '../repository/RepositorySecurityService';
import { RepositoryCloneService } from '../repository/RepositoryCloneService';
import { RepositoryMetadataService } from '../repository/RepositoryMetadataService';
import { RepositoryCleanupService } from '../repository/RepositoryCleanupService';
import { RealGitHistoryAnalyzer, FileGitStats } from '../../analyzers/realGitHistoryAnalyzer';
import { RealSourceCodeAnalyzer, DiscoveredSourceFile } from '../../analyzers/realSourceCodeAnalyzer';
import { RealLegacyAnalyzer } from '../../analyzers/realLegacyAnalyzer';
import { DefaultTechnicalDebtEngine } from '../../scoring/scoringEngine';
import { DefaultFinancialCostEngine } from '../../scoring/financialEngine';
import { DefaultHotspotAnalyzer } from '../../analyzers/hotspotAnalyzer';
import { DefaultRecommendationEngine } from '../../analyzers/recommendationEngine';
import { FileDebtScore } from '../../analyzers/interfaces';
import { FinancialIntelligenceEngine, FinancialIntelligenceSummary } from '../financial/FinancialIntelligenceEngine';
import { DebtPrioritizationEngine, PrioritizationResult } from '../prioritization/DebtPrioritizationEngine';
import { ScenarioEngine, ScenarioDefinition, ScenarioResult, ScenarioComparison } from '../financial/ScenarioEngine';
import { ExecutiveReportService, ExecutiveReport } from '../reporting/ExecutiveReportService';
import { DebtSummaryService, AnalysisComparisonSummary } from '../reporting/DebtSummaryService';
import { PortfolioPrioritizationService, PortfolioSummary } from '../prioritization/PortfolioPrioritizationService';
import { DemoDataService } from '../demoDataService';
import { FinancialScenario } from '../../models';
import { RepositoryController } from '../../controllers/repositoryController';
import { DebtIdentityService } from '../debt/DebtIdentityService';
import { DebtLifecycleService } from '../debt/DebtLifecycleService';
import { VerificationEngine } from '../verification/VerificationEngine';
import { AnalysisSnapshotService } from '../reporting/AnalysisSnapshotService';
import { SnapshotComparisonEngine } from '../reporting/SnapshotComparisonEngine';
import { GoalProgressEngine } from '../goals/GoalProgressEngine';
import { AlertEngine } from '../alerts/AlertEngine';
import { AuditTrailService } from '../audit/AuditTrailService';
import { PredictiveOrchestrator } from '../predictive/PredictiveOrchestrator';

export interface AnalysisJobStatus {
  analysisId: string;
  repositoryId: string;
  status: 'queued' | 'cloning' | 'analyzing' | 'calculating' | 'persisting' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStage: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  commitSha?: string;
  filesDiscovered: number;
  filesAnalyzed: number;
  commitsAnalyzed: number;
  isDemo: boolean;
}

// In-memory job registry for active progress polling
const activeJobs = new Map<string, AnalysisJobStatus>();

// Active cancellation tokens
const cancellationTokens = new Set<string>();

export interface CompletedAnalysisData {
  analysis: any;
  fileMetrics: any[];
  hotspots: any[];
  recommendations: any[];
  trends: any[];
  valuation: any;
  metadata: any;
  summary: any;
  financialIntelligence?: any;
  priorities?: any;
  debtItems?: any[];
  verificationResults?: any[];
  snapshot?: any;
  comparison?: any;
}

const completedAnalyses = new Map<string, CompletedAnalysisData>();

export class AnalysisOrchestrator {
  private static debtEngine = new DefaultTechnicalDebtEngine();
  private static financialEngine = new DefaultFinancialCostEngine();
  private static hotspotAnalyzer = new DefaultHotspotAnalyzer();
  private static recommendationEngine = new DefaultRecommendationEngine();

  /**
   * Retrieves the current live status of an analysis job.
   */
  static getJobStatus(analysisId: string): AnalysisJobStatus | null {
    if (activeJobs.has(analysisId)) {
      return activeJobs.get(analysisId)!;
    }
    return null;
  }

  /**
   * Retrieves full completed analysis dataset from memory (cache or offline fallback).
   */
  static getCompletedData(analysisId: string): CompletedAnalysisData | null {
    return completedAnalyses.get(analysisId) || null;
  }

  /**
   * Retrieves real hotspots for an analysis.
   */
  static getHotspots(analysisId: string): any[] | null {
    const data = completedAnalyses.get(analysisId);
    return data ? data.hotspots : null;
  }

  /**
   * Retrieves real file metrics for an analysis.
   */
  static getFileMetrics(analysisId: string): any[] | null {
    const data = completedAnalyses.get(analysisId);
    return data ? data.fileMetrics : null;
  }

  /**
   * Retrieves real recommendations for an analysis.
   */
  static getRecommendations(analysisId: string): any[] | null {
    const data = completedAnalyses.get(analysisId);
    return data ? data.recommendations : null;
  }

  /**
   * Retrieves real historical trends for an analysis or repository.
   */
  static getTrends(repoOrAnalysisId: string): any[] | null {
    for (const [id, data] of completedAnalyses.entries()) {
      if (id === repoOrAnalysisId || data.analysis.repositoryId === repoOrAnalysisId) {
        return data.trends;
      }
    }
    return null;
  }

  /**
   * Retrieves debt items for an analysis or repository.
   */
  static getDebtItems(analysisId: string): any[] | null {
    const data = completedAnalyses.get(analysisId);
    return data ? data.debtItems || null : null;
  }

  /**
   * Retrieves verification results for an analysis.
   */
  static getVerificationResults(analysisId: string): any[] | null {
    const data = completedAnalyses.get(analysisId);
    return data ? data.verificationResults || null : null;
  }

  /**
   * Retrieves snapshot comparison result for an analysis.
   */
  static getComparison(analysisId: string): any | null {
    const data = completedAnalyses.get(analysisId);
    return data ? data.comparison || null : null;
  }

  /**
   * Calculates or retrieves financial valuation for a real analysis.
   */
  static async getValuation(analysisId: string, hourlyRate: number = 95): Promise<any | null> {
    const data = completedAnalyses.get(analysisId);
    if (!data) return null;
    if (hourlyRate === 95 || !data.fileMetrics) {
      return data.valuation;
    }
    const fileDebtScores: FileDebtScore[] = data.fileMetrics.map((m: any) => ({
      filePath: m.filePath,
      overallDebtScore: m.debtScore,
      debtHours: m.debtHours,
      riskCategory: m.riskCategory,
      components: {
        complexityScore: 0,
        churnScore: 0,
        defectScore: 0,
        ownershipScore: 0,
        legacyScore: 0,
      },
      debtDrivers: [],
    }));
    return await this.financialEngine.calculateValuation(fileDebtScores, hourlyRate);
  }

  /**
   * Retrieves or computes Financial Intelligence for an analysis.
   */
  static getFinancialIntelligence(
    analysisId: string,
    options?: { currency?: string; hourlyRate?: number }
  ): FinancialIntelligenceSummary | null {
    const data = completedAnalyses.get(analysisId);
    if (data && data.fileMetrics) {
      return FinancialIntelligenceEngine.generateIntelligence({
        analysisId,
        repositoryId: data.analysis.repositoryId,
        fileMetrics: data.fileMetrics,
        hotspots: data.hotspots,
        overallDebtScore: data.summary?.overallHealthScore ? 100 - data.summary.overallHealthScore : 50,
        totalCommits: data.analysis.commitsAnalyzed || 10,
        isDemo: false,
        overrides: {
          currency: (options?.currency as any),
          hourlyRate: options?.hourlyRate,
        },
      });
    }

    // Demo fallback
    const demoAnalysis = DemoDataService.getAnalysisById(analysisId);
    if (demoAnalysis || analysisId === 'analysis-demo-fintech-01') {
      const demoMetrics = DemoDataService.getFileMetrics('analysis-demo-fintech-01');
      const demoHotspots = DemoDataService.getHotspots('analysis-demo-fintech-01');
      return FinancialIntelligenceEngine.generateIntelligence({
        analysisId: 'analysis-demo-fintech-01',
        repositoryId: 'repo-demo-fintech-01',
        fileMetrics: demoMetrics,
        hotspots: demoHotspots,
        overallDebtScore: 72,
        totalCommits: 340,
        isDemo: true,
        overrides: {
          currency: (options?.currency as any),
          hourlyRate: options?.hourlyRate,
        },
      });
    }

    return null;
  }

  /**
   * Retrieves Cost Driver Breakdown for an analysis.
   */
  static getCostDrivers(
    analysisId: string,
    options?: { currency?: string; hourlyRate?: number }
  ) {
    const intel = this.getFinancialIntelligence(analysisId, options);
    return intel ? intel.costDrivers : null;
  }

  /**
   * Retrieves prioritized debt items and Impact vs Effort matrix.
   */
  static getPriorities(
    analysisId: string,
    options?: { currency?: string; hourlyRate?: number }
  ): PrioritizationResult | null {
    const data = completedAnalyses.get(analysisId);
    if (data && data.fileMetrics) {
      const intel = this.getFinancialIntelligence(analysisId, options);
      return DebtPrioritizationEngine.prioritize({
        analysisId,
        fileMetrics: data.fileMetrics,
        hotspots: data.hotspots,
        currency: intel?.currency,
        hourlyRate: intel?.hourlyRate,
        confidence: intel?.confidence,
      });
    }

    // Demo fallback
    const demoAnalysis = DemoDataService.getAnalysisById(analysisId);
    if (demoAnalysis || analysisId === 'analysis-demo-fintech-01') {
      const demoMetrics = DemoDataService.getFileMetrics('analysis-demo-fintech-01');
      const demoHotspots = DemoDataService.getHotspots('analysis-demo-fintech-01');
      const intel = this.getFinancialIntelligence('analysis-demo-fintech-01', options);
      return DebtPrioritizationEngine.prioritize({
        analysisId: 'analysis-demo-fintech-01',
        fileMetrics: demoMetrics,
        hotspots: demoHotspots,
        currency: intel?.currency,
        hourlyRate: intel?.hourlyRate,
        confidence: intel?.confidence,
      });
    }

    return null;
  }

  /**
   * Evaluates custom what-if scenario.
   */
  static async evaluateScenario(
    analysisId: string,
    scenario: ScenarioDefinition
  ): Promise<ScenarioResult | null> {
    const data = completedAnalyses.get(analysisId);
    const fileMetrics = data?.fileMetrics || DemoDataService.getFileMetrics('analysis-demo-fintech-01');
    const hotspots = data?.hotspots || DemoDataService.getHotspots('analysis-demo-fintech-01');
    const debtScore = data?.summary?.overallHealthScore ? 100 - data.summary.overallHealthScore : 72;

    const intel = this.getFinancialIntelligence(analysisId, {
      hourlyRate: scenario.hourlyRate,
    });
    if (!intel) return null;

    const result = ScenarioEngine.evaluateScenario(
      fileMetrics,
      hotspots,
      debtScore,
      scenario,
      intel.assumptions
    );

    // Save scenario if DB is connected
    const dbStatus = getDatabaseStatus();
    if (dbStatus.isConnected) {
      await FinancialScenario.create({
        scenarioName: result.scenarioName,
        analysisId,
        repositoryId: data?.analysis?.repositoryId || 'repo-demo-fintech-01',
        selectedFilePaths: result.selectedFilePaths,
        hourlyRate: result.hourlyRate,
        currency: result.currency,
        remediationEffectiveness: result.remediationEffectiveness,
        estimatedRefactoringHours: result.estimatedRefactoringHours,
        estimatedInvestment: result.refactoringInvestment,
        estimatedAnnualSavings: result.potentialAnnualSavings,
        twoYearNetSavings: result.twoYearNetSavings,
        roiPercentage: result.roiPercentage,
        paybackPeriodMonths: result.paybackPeriodMonths,
        residualAnnualImpact: result.residualAnnualImpact,
        projectedResidualDebtScore: result.projectedResidualDebtScore,
        isViable: result.isViable,
      }).catch(() => {});
    }

    return result;
  }

  /**
   * Generates preset scenario comparisons.
   */
  static comparePresets(
    analysisId: string,
    options?: { currency?: string; hourlyRate?: number }
  ): ScenarioComparison | null {
    const data = completedAnalyses.get(analysisId);
    const fileMetrics = data?.fileMetrics || DemoDataService.getFileMetrics('analysis-demo-fintech-01');
    const hotspots = data?.hotspots || DemoDataService.getHotspots('analysis-demo-fintech-01');
    const debtScore = data?.summary?.overallHealthScore ? 100 - data.summary.overallHealthScore : 72;

    const intel = this.getFinancialIntelligence(analysisId, options);
    if (!intel) return null;

    return ScenarioEngine.comparePresets(
      analysisId,
      fileMetrics,
      hotspots,
      debtScore,
      intel.assumptions,
      options?.hourlyRate
    );
  }

  /**
   * Generates Executive Report briefing.
   */
  static getExecutiveReport(
    analysisId: string,
    repoName?: string,
    options?: { currency?: string; hourlyRate?: number }
  ): ExecutiveReport | null {
    const intel = this.getFinancialIntelligence(analysisId, options);
    const priorities = this.getPriorities(analysisId, options);
    if (!intel || !priorities) return null;

    return ExecutiveReportService.generateReport(
      intel,
      priorities,
      repoName || 'Primary Repository'
    );
  }

  /**
   * Compares two analyses for debt reduction delta.
   */
  static compareAnalyses(
    analysisId1: string,
    analysisId2: string,
    currency?: string
  ): AnalysisComparisonSummary | null {
    const intel1 = this.getFinancialIntelligence(analysisId1, { currency });
    const intel2 = this.getFinancialIntelligence(analysisId2, { currency });
    if (!intel1 || !intel2) return null;

    const data1 = completedAnalyses.get(analysisId1);
    const data2 = completedAnalyses.get(analysisId2);

    const baseline = {
      analysisId: analysisId1,
      commitSha: data1?.analysis?.commitHash || 'a1b2c3d',
      createdAt: data1?.analysis?.completedAt || new Date(Date.now() - 30 * 86400000),
      debtScore: data1?.summary?.overallHealthScore ? 100 - data1.summary.overallHealthScore : 74,
      hotspotsCount: data1?.hotspots?.length || 8,
      annualExposure: intel1.summary.totalAnnualExposure,
    };

    const target = {
      analysisId: analysisId2,
      commitSha: data2?.analysis?.commitHash || 'e4f5a6b',
      createdAt: data2?.analysis?.completedAt || new Date(),
      debtScore: data2?.summary?.overallHealthScore ? 100 - data2.summary.overallHealthScore : 60,
      hotspotsCount: data2?.hotspots?.length || 5,
      annualExposure: intel2.summary.totalAnnualExposure,
    };

    return DebtSummaryService.compareAnalyses(baseline, target, currency || intel1.currency);
  }

  /**
   * Builds organization-wide debt portfolio across repositories.
   */
  static async getPortfolio(currency?: string, hourlyRate?: number): Promise<PortfolioSummary> {
    const allRepos = RepositoryController.getAllRepositories();
    const repoAnalysisPairs: Array<{
      repository: any;
      analysis: any;
      financialData?: any;
    }> = [];

    for (const repo of allRepos) {
      const repoId = repo._id?.toString() || repo.id;
      // Look for a completed analysis
      let analysisData = null;
      for (const [_, d] of completedAnalyses.entries()) {
        if (d.analysis.repositoryId === repoId) {
          analysisData = d;
          break;
        }
      }

      if (analysisData) {
        const finIntel = this.getFinancialIntelligence(analysisData.analysis.id || analysisData.analysis._id, {
          currency,
          hourlyRate,
        });
        repoAnalysisPairs.push({
          repository: repo,
          analysis: analysisData.analysis,
          financialData: finIntel,
        });
      } else {
        // Fallback for demo repo or idle repo
        const finIntel = this.getFinancialIntelligence('analysis-demo-fintech-01', {
          currency,
          hourlyRate,
        });
        repoAnalysisPairs.push({
          repository: repo,
          analysis: {
            summary: {
              overallDebtScore: repo.isDemo ? 68 : 42,
              totalFiles: 14,
              criticalHotspots: repo.isDemo ? 3 : 1,
            },
          },
          financialData: finIntel,
        });
      }
    }

    return PortfolioPrioritizationService.buildPortfolio(
      repoAnalysisPairs,
      currency || 'INR',
      hourlyRate || 2000
    );
  }

  /**
   * Cancels a running analysis job safely.
   */
  static cancelAnalysis(analysisId: string): boolean {
    const job = activeJobs.get(analysisId);
    if (job && job.status !== 'completed' && job.status !== 'failed') {
      cancellationTokens.add(analysisId);
      job.status = 'cancelled';
      job.currentStage = 'Analysis cancelled by user.';
      return true;
    }
    return false;
  }

  /**
   * Main Orchestrator entrypoint: Ingests, analyzes, scores, and persists a repository.
   */
  static async runAnalysis(params: {
    analysisId: string;
    repositoryId: string;
    repoUrl: string;
    branch?: string;
    hourlyRate?: number;
  }): Promise<AnalysisJobStatus> {
    const { analysisId, repositoryId, repoUrl, branch } = params;
    const hourlyRate = params.hourlyRate || 95;
    const startTime = new Date();

    const job: AnalysisJobStatus = {
      analysisId,
      repositoryId,
      status: 'queued',
      progress: 5,
      currentStage: 'Validating repository URL...',
      startedAt: startTime,
      filesDiscovered: 0,
      filesAnalyzed: 0,
      commitsAnalyzed: 0,
      isDemo: false,
    };
    activeJobs.set(analysisId, job);

    let clonePath = '';

    const updateStage = async (
      status: AnalysisJobStatus['status'],
      progress: number,
      currentStage: string
    ) => {
      job.status = status;
      job.progress = progress;
      job.currentStage = currentStage;
      activeJobs.set(analysisId, { ...job });

      const dbStatus = getDatabaseStatus();
      if (dbStatus.isConnected && Types.ObjectId.isValid(analysisId)) {
        await Analysis.findByIdAndUpdate(analysisId, {
          status,
          progress,
          currentStage,
          filesDiscovered: job.filesDiscovered,
          filesAnalyzed: job.filesAnalyzed,
          commitsAnalyzed: job.commitsAnalyzed,
        }).catch(() => {});
      }
    };

    try {
      // 1. URL Validation
      await updateStage('cloning', 10, 'Validating URL & Cloning repository...');
      if (cancellationTokens.has(analysisId)) throw new Error('Analysis was cancelled.');

      const validation = RepositorySecurityService.validateUrl(repoUrl, config.allowLocalFixtureRepos);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid repository URL.');
      }

      // 2. Secure Git Clone
      const cloneResult = await RepositoryCloneService.cloneRepository(
        repoUrl,
        analysisId,
        branch
      );

      if (!cloneResult.success || !cloneResult.clonePath) {
        throw new Error(cloneResult.error || 'Failed to clone repository.');
      }
      clonePath = cloneResult.clonePath;

      if (cancellationTokens.has(analysisId)) throw new Error('Analysis was cancelled.');

      // 3. Extract Metadata
      await updateStage('analyzing', 20, 'Extracting Git metadata and commit headers...');
      const metadata = await RepositoryMetadataService.extractMetadata(clonePath);
      job.commitSha = metadata.headCommitSha;

      // 4. Git History Analysis
      await updateStage('analyzing', 30, 'Reading Git history and calculating file churn...');
      const historyResult = await RealGitHistoryAnalyzer.analyzeHistory(
        clonePath,
        config.maxCommits
      );
      job.commitsAnalyzed = historyResult.totalCommits;

      if (cancellationTokens.has(analysisId)) throw new Error('Analysis was cancelled.');

      // 5. Source File Discovery
      await updateStage('analyzing', 45, 'Discovering source code files...');
      const discoveredPaths = RealSourceCodeAnalyzer.discoverFiles(
        clonePath,
        config.maxAnalysisFiles,
        config.maxFileSizeMb * 1024 * 1024
      );
      job.filesDiscovered = discoveredPaths.length;

      // 6. AST & Complexity Analysis (Batch Processing)
      await updateStage('analyzing', 55, `Analyzing ${discoveredPaths.length} source code files...`);
      const analyzedFiles: DiscoveredSourceFile[] = [];

      // Controlled concurrency to avoid memory spikes
      const BATCH_SIZE = 25;
      for (let i = 0; i < discoveredPaths.length; i += BATCH_SIZE) {
        if (cancellationTokens.has(analysisId)) throw new Error('Analysis was cancelled.');
        const batch = discoveredPaths.slice(i, i + BATCH_SIZE);
        for (const relPath of batch) {
          const fileAnalysis = RealSourceCodeAnalyzer.analyzeFile(clonePath, relPath);
          analyzedFiles.push(fileAnalysis);
          job.filesAnalyzed++;
        }
        const progress = Math.min(68, 55 + Math.round((i / discoveredPaths.length) * 13));
        job.progress = progress;
      }

      // 7. Multi-Dimensional Scoring
      await updateStage('calculating', 70, 'Calculating technical debt & legacy indicators...');
      const fileDebtScores: FileDebtScore[] = [];
      const enrichedMetrics: {
        file: DiscoveredSourceFile;
        gitStats?: FileGitStats;
        score: FileDebtScore;
        legacyInfo: { isLegacy: boolean; legacyScore: number; reason: string };
      }[] = [];

      for (const file of analyzedFiles) {
        const gitStats = historyResult.fileStatsMap.get(file.relativePath);
        const commitCount = gitStats?.commitCount || 1;
        const defectCount = gitStats?.defectFixCommitCount || 0;
        const changesPerMonth = gitStats?.changesPerMonth || 0.5;

        const legacyInfo = RealLegacyAnalyzer.evaluateLegacyRisk({
          ageInDays: gitStats?.ageInDays || 30,
          daysSinceLastChange: gitStats?.daysSinceLastChange || 5,
          cyclomaticComplexity: file.cyclomaticComplexity,
          churnCount: commitCount,
          ownershipPercentage: gitStats?.ownershipPercentage || 100,
        });

        // Compute technical debt score
        const score = await this.debtEngine.computeFileDebt(
          {
            cyclomaticComplexity: file.cyclomaticComplexity,
            cognitiveComplexity: file.cognitiveComplexity,
            linesOfCode: file.linesOfCode,
            logicalLinesOfCode: file.codeLines,
            nestingDepthMax: file.nestingDepthMax,
            functionCount: file.functionCount,
            commentRatio: file.linesOfCode > 0 ? file.commentLines / file.linesOfCode : 0,
            duplicationPercentage: 0,
          },
          {
            commitCount,
            changeFrequencyPerMonth: changesPerMonth,
            reworkCommitCount: defectCount,
            linesAddedTotal: gitStats?.linesAdded || 0,
            linesDeletedTotal: gitStats?.linesDeleted || 0,
          },
          {
            totalDefects: defectCount,
            criticalDefects: 0,
            reworkHoursSpent: defectCount * 4,
            defectDensityPerKLoC:
              file.linesOfCode > 0 ? (defectCount / file.linesOfCode) * 1000 : 0,
            defectHistory: [],
          },
          {
            primaryOwner: gitStats?.primaryContributor || 'Developer',
            primaryOwnerPercentage: gitStats?.ownershipPercentage || 100,
            totalContributors: gitStats?.contributors.size || 1,
            ownershipEntropy: gitStats?.ownershipEntropy || 0,
            isKnowledgeSilo: gitStats?.isKnowledgeSilo || false,
            topContributors: [],
          },
          {
            isLegacy: legacyInfo.isLegacy,
            monthsSinceLastModified: Math.round((gitStats?.daysSinceLastChange || 0) / 30),
            dependencyFreshnessScore: 85,
            deprecatedApiCount: 0,
            frameworkVersionLagMonths: 0,
          }
        );

        score.filePath = file.relativePath;
        fileDebtScores.push(score);
        enrichedMetrics.push({ file, gitStats, score, legacyInfo });
      }

      // 8. Hotspots Identification
      await updateStage('calculating', 78, 'Ranking code hotspots...');
      const hotspotItems = await this.hotspotAnalyzer.identifyHotspots(fileDebtScores, {
        hourlyRate,
      });

      // 9. Recommendations Generation
      await updateStage('calculating', 82, 'Generating ROI refactoring proposals...');
      const recommendations = await this.recommendationEngine.generateRecommendations(
        hotspotItems,
        fileDebtScores,
        hourlyRate
      );

      // 10. Financial Valuation
      await updateStage('calculating', 88, 'Calculating 4-quadrant financial cost valuation...');
      const valuation = await this.financialEngine.calculateValuation(fileDebtScores, hourlyRate);

      // Summary statistics
      const totalLoC = analyzedFiles.reduce((acc, f) => acc + f.linesOfCode, 0);
      const totalDebtHours = fileDebtScores.reduce((acc, s) => acc + s.debtHours, 0);
      const criticalHotspots = hotspotItems.filter((h) => h.riskLevel === 'critical').length;
      const avgComplexity =
        analyzedFiles.length > 0
          ? Number(
              (
                analyzedFiles.reduce((acc, f) => acc + f.cyclomaticComplexity, 0) /
                analyzedFiles.length
              ).toFixed(1)
            )
          : 0;

      // Health Score Calculation: 100 - average debt score penalty
      const avgDebtScore =
        fileDebtScores.length > 0
          ? fileDebtScores.reduce((acc, s) => acc + s.overallDebtScore, 0) / fileDebtScores.length
          : 10;
      const overallHealthScore = Math.max(10, Math.min(100, Math.round(100 - avgDebtScore)));

      // Build summary object
      const summary = {
        totalFiles: analyzedFiles.length,
        totalLinesOfCode: totalLoC,
        totalDebtHours,
        estimatedRemediationCost: valuation.estimatedRemediationInvestment.totalCost,
        annualAvoidableCost: valuation.estimatedFutureAvoidableCost.projectedAnnualCost,
        historicalReworkCost: valuation.historicalMaintenanceReworkBurden.totalCost,
        potentialRefactoringBenefit: valuation.potentialRefactoringBenefit.netSavings,
        overallHealthScore,
        averageComplexity: avgComplexity,
        hotspotCount: hotspotItems.length,
        criticalHotspots,
        filesAnalyzed: job.filesAnalyzed,
        commitsAnalyzed: job.commitsAnalyzed,
      };

      // Build FileMetrics docs
      const metricDocs = enrichedMetrics.map((item) => ({
        _id: item.file.relativePath,
        analysisId,
        repositoryId,
        filePath: item.file.relativePath,
        directory: path.dirname(item.file.relativePath).replace(/\\/g, '/'),
        language: item.file.language,
        linesOfCode: item.file.linesOfCode,
        blankLines: item.file.blankLines,
        commentLines: item.file.commentLines,
        codeLines: item.file.codeLines,
        functionCount: item.file.functionCount,
        classCount: item.file.classCount,
        importCount: item.file.importCount,
        exportCount: item.file.exportCount,
        cyclomaticComplexity: item.file.cyclomaticComplexity,
        cognitiveComplexity: item.file.cognitiveComplexity,
        nestingDepthMax: item.file.nestingDepthMax,
        churnCount: item.gitStats?.commitCount || 1,
        linesAdded: item.gitStats?.linesAdded || 0,
        linesDeleted: item.gitStats?.linesDeleted || 0,
        totalChurn: item.gitStats?.totalChurn || 0,
        changesPerMonth: item.gitStats?.changesPerMonth || 0.5,
        defectCount: item.gitStats?.defectFixCommitCount || 0,
        defectFixCommitCount: item.gitStats?.defectFixCommitCount || 0,
        defectFixFrequency: item.gitStats?.defectFixFrequency || 0,
        contributorCount: item.gitStats?.contributors.size || 1,
        ownershipEntropy: item.gitStats?.ownershipEntropy || 0,
        primaryContributor: item.gitStats?.primaryContributor || 'Developer',
        ownershipPercentage: item.gitStats?.ownershipPercentage || 100,
        firstSeenAt: item.gitStats?.firstSeenAt,
        lastModifiedAt: item.gitStats?.lastModifiedAt || new Date(),
        ageInDays: item.gitStats?.ageInDays || 30,
        daysSinceLastChange: item.gitStats?.daysSinceLastChange || 5,
        isLegacy: item.legacyInfo.isLegacy,
        debtScore: item.score.overallDebtScore,
        debtHours: item.score.debtHours,
        estimatedRemediationCost: Math.round(item.score.debtHours * hourlyRate),
        riskCategory: item.score.riskCategory as RiskLevel,
        analysisStatus: item.file.analysisStatus,
        reason: item.score.debtDrivers.join(', ') || item.legacyInfo.reason,
        isDemo: false,
      }));

      // Build Hotspot docs
      const hotspotDocs = hotspotItems.map((h) => ({
        _id: h.filePath,
        analysisId,
        repositoryId,
        filePath: h.filePath,
        rank: h.rank,
        riskLevel: h.riskLevel,
        complexityScore: h.complexityScore,
        churnScore: h.churnScore,
        defectDensity: 0,
        defectFixCount: historyResult.fileStatsMap.get(h.filePath)?.defectFixCommitCount || 0,
        changeFrequency: historyResult.fileStatsMap.get(h.filePath)?.changesPerMonth || 0,
        debtScore: h.debtScore,
        estimatedRemediationHours: h.estimatedRemediationHours,
        estimatedRemediationCost: h.estimatedRemediationCost,
        historicalReworkCost: h.historicalReworkCost,
        futureAvoidableCost: h.futureAvoidableCost,
        potentialBenefit: h.potentialBenefit,
        primaryDebtDrivers: h.primaryDebtDrivers,
        reason: h.primaryDebtDrivers.join(' + ') || 'High complexity and churn',
        isDemo: false,
      }));

      // Build Recommendations docs
      const recDocs = recommendations.map((r) => ({
        _id: `rec-${r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        analysisId,
        repositoryId,
        title: r.title,
        category: r.category,
        priority: r.priority,
        targetFiles: r.targetFiles,
        rationale: r.rationale,
        actionPlan: r.actionPlan,
        estimatedEffortHours: r.estimatedEffortHours,
        estimatedCost: r.estimatedCost,
        projectedAnnualSavings: r.projectedAnnualSavings,
        roiRatio: r.roiRatio,
        paybackPeriodMonths: r.paybackPeriodMonths,
        isDemo: false,
      }));

      // Build TrendPoint doc
      const trendDoc = {
        _id: `trend-${analysisId}`,
        repositoryId,
        analysisId,
        date: new Date(),
        commitHash: metadata.headCommitSha.substring(0, 7),
        totalDebtHours,
        healthScore: overallHealthScore,
        remediationCost: valuation.estimatedRemediationInvestment.totalCost,
        reworkHours: valuation.historicalMaintenanceReworkBurden.totalHours,
        avoidableAnnualCost: valuation.estimatedFutureAvoidableCost.projectedAnnualCost,
        linesOfCode: totalLoC,
        hotspotCount: hotspotItems.length,
        criticalHotspots,
        isDemo: false,
      };

      // Calculate Financial Intelligence & Prioritization
      const finIntel = FinancialIntelligenceEngine.generateIntelligence({
        analysisId,
        repositoryId,
        fileMetrics: metricDocs,
        hotspots: hotspotDocs,
        overallDebtScore: overallHealthScore ? 100 - overallHealthScore : 50,
        totalCommits: job.commitsAnalyzed,
        isDemo: false,
        overrides: { hourlyRate },
      });

      const priorities = DebtPrioritizationEngine.prioritize({
        analysisId,
        fileMetrics: metricDocs,
        hotspots: hotspotDocs,
        currency: finIntel.currency,
        hourlyRate,
        confidence: finIntel.confidence,
      });

      // --- PHASE 4 CONTINUOUS INTELLIGENCE PIPELINE ---
      // 10a. Match or create resilient DebtItems from hotspots & priorities
      await updateStage('calculating', 89, 'Tracking persistent technical debt lifecycle...');
      const debtItems = await DebtIdentityService.matchOrCreateDebtItems(
        repositoryId,
        hotspotDocs,
        metricDocs,
        priorities.priorities,
        hourlyRate
      );

      // 10b. Automated Before/After Verification of resolved items
      const verificationResults = await VerificationEngine.verifyRepositoryResolvedItems(
        repositoryId,
        metricDocs,
        hotspotDocs,
        analysisId
      );

      // 10c. Get previous snapshot for delta calculation
      const previousSnapshot = await AnalysisSnapshotService.getLatestPreviousSnapshot(
        repositoryId,
        analysisId
      );

      // 10d. Create point-in-time Analysis Snapshot
      const priorityDist = {
        critical: priorities.priorities.filter((p: any) => p.priority === 'CRITICAL').length,
        high: priorities.priorities.filter((p: any) => p.priority === 'HIGH').length,
        medium: priorities.priorities.filter((p: any) => p.priority === 'MEDIUM').length,
        low: priorities.priorities.filter((p: any) => p.priority === 'LOW').length,
        monitor: priorities.priorities.filter((p: any) => p.priority === 'MONITOR').length,
      };

      const currentSnapshot = await AnalysisSnapshotService.createSnapshot({
        analysisId,
        repositoryId,
        commitSha: metadata.headCommitSha,
        branch: metadata.defaultBranch,
        linesOfCode: totalLoC,
        commitCount: job.commitsAnalyzed,
        totalChurn: historyResult.totalCommits * 15,
        codeAge: 30,
        complexity: avgComplexity,
        maxNesting: analyzedFiles.reduce((acc, f) => Math.max(acc, f.nestingDepthMax || 0), 0),
        hotspotCount: hotspotItems.length,
        criticalHotspotCount: criticalHotspots,
        technicalDebtScore: overallHealthScore ? 100 - overallHealthScore : 50,
        financialExposure: finIntel.summary.totalAnnualExposure,
        maintenanceFriction: finIntel.costDrivers.drivers.maintenanceFriction.estimatedCost,
        defectFixBurden: finIntel.costDrivers.drivers.defectFixBurden.estimatedCost,
        changeFriction: finIntel.costDrivers.drivers.changeFriction.estimatedCost,
        legacyRisk: finIntel.costDrivers.drivers.legacyRisk.estimatedCost,
        priorityDistribution: priorityDist,
        telemetryConfidence: finIntel.confidence,
      });

      // 10e. Snapshot Comparison & Threshold Alerting
      let comparisonResult = null;
      if (previousSnapshot) {
        comparisonResult = SnapshotComparisonEngine.compareSnapshots(previousSnapshot, currentSnapshot);

        if (comparisonResult.deltas.criticalHotspots.delta > 0) {
          await AlertEngine.createAlert({
            repositoryId,
            type: 'CRITICAL_HOTSPOT_INCREASED',
            severity: 'CRITICAL',
            title: 'Critical Hotspots Increased',
            message: `Critical hotspots increased by ${comparisonResult.deltas.criticalHotspots.delta} (from ${previousSnapshot.criticalHotspotCount} to ${currentSnapshot.criticalHotspotCount}).`,
            metric: 'criticalHotspots',
            previousValue: previousSnapshot.criticalHotspotCount,
            currentValue: currentSnapshot.criticalHotspotCount,
          });
        }

        if (comparisonResult.deltas.debtScore.delta > 5) {
          await AlertEngine.createAlert({
            repositoryId,
            type: 'DEBT_SCORE_INCREASED',
            severity: 'HIGH',
            title: 'Technical Debt Score Regressed',
            message: `Technical debt score worsened by ${comparisonResult.deltas.debtScore.delta} points.`,
            metric: 'technicalDebtScore',
            previousValue: previousSnapshot.technicalDebtScore,
            currentValue: currentSnapshot.technicalDebtScore,
          });
        }
      }

      // 10f. Evaluate Engineering Goals Progress
      await GoalProgressEngine.evaluateGoals(repositoryId, {
        criticalHotspots,
        technicalDebtScore: currentSnapshot.technicalDebtScore,
        annualExposure: currentSnapshot.financialExposure,
        highPriorityDebt: priorityDist.critical + priorityDist.high,
        averageComplexity: avgComplexity,
      });

      // 10g. Audit event for analysis completion
      await AuditTrailService.logEvent({
        repositoryId,
        action: 'ANALYSIS_COMPLETED',
        targetId: analysisId,
        targetType: 'ANALYSIS',
        description: `Analysis completed for branch ${metadata.defaultBranch} (${metadata.headCommitSha.substring(0, 7)}). Identified ${hotspotItems.length} hotspots, ${debtItems.length} tracked debt items.`,
        metadata: {
          hotspots: hotspotItems.length,
          criticalHotspots,
          overallHealthScore,
          financialExposure: finIntel.summary.totalAnnualExposure,
        },
      });

      // 10h. Phase 5: Predictive Intelligence & Forecast Evaluation
      try {
        await PredictiveOrchestrator.onNewAnalysisArrived(repositoryId, currentSnapshot);
      } catch (predErr) {
        console.warn('[AnalysisOrchestrator] Predictive assessment generation warning:', predErr);
      }

      // Store in memory for instant API queries / offline fallback
      completedAnalyses.set(analysisId, {
        analysis: {
          _id: analysisId,
          id: analysisId,
          repositoryId,
          branch: metadata.defaultBranch,
          commitHash: metadata.headCommitSha.substring(0, 7),
          status: 'completed',
          progress: 100,
          currentStage: 'Analysis completed successfully.',
          filesDiscovered: job.filesDiscovered,
          filesAnalyzed: job.filesAnalyzed,
          commitsAnalyzed: job.commitsAnalyzed,
          startedAt: job.startedAt,
          completedAt: new Date(),
          isDemo: false,
          summary,
        },
        fileMetrics: metricDocs,
        hotspots: hotspotDocs,
        recommendations: recDocs,
        trends: [trendDoc],
        valuation,
        metadata,
        summary,
        financialIntelligence: finIntel,
        priorities,
        debtItems,
        verificationResults,
        snapshot: currentSnapshot,
        comparison: comparisonResult,
      });

      // 11. Database Persistence
      await updateStage('persisting', 92, 'Persisting real telemetry into MongoDB...');
      const dbStatus = getDatabaseStatus();

      if (dbStatus.isConnected && Types.ObjectId.isValid(repositoryId)) {
        const repoObjId = new Types.ObjectId(repositoryId);
        const analysisObjId = Types.ObjectId.isValid(analysisId)
          ? new Types.ObjectId(analysisId)
          : new Types.ObjectId();

        // Update Repository metadata
        await Repository.findByIdAndUpdate(repoObjId, {
          defaultBranch: metadata.defaultBranch,
          totalCommits: metadata.totalCommits,
          firstCommitAt: metadata.firstCommitDate,
          lastCommitAt: metadata.latestCommitDate,
          activeBranches: metadata.branches,
          lastAnalyzedAt: new Date(),
          status: 'completed',
          isDemo: false,
        });

        // Save FileMetrics
        const mongoMetricDocs = metricDocs.map((doc) => ({
          ...doc,
          _id: undefined,
          analysisId: analysisObjId,
          repositoryId: repoObjId,
        }));
        await FileMetric.deleteMany({ analysisId: analysisObjId });
        if (mongoMetricDocs.length > 0) {
          await FileMetric.insertMany(mongoMetricDocs);
        }

        // Save Hotspots
        const mongoHotspotDocs = hotspotDocs.map((doc) => ({
          ...doc,
          _id: undefined,
          analysisId: analysisObjId,
          repositoryId: repoObjId,
        }));
        await Hotspot.deleteMany({ analysisId: analysisObjId });
        if (mongoHotspotDocs.length > 0) {
          await Hotspot.insertMany(mongoHotspotDocs);
        }

        // Save Recommendations
        const mongoRecDocs = recDocs.map((doc) => ({
          ...doc,
          _id: undefined,
          analysisId: analysisObjId,
          repositoryId: repoObjId,
        }));
        await Recommendation.deleteMany({ analysisId: analysisObjId });
        if (mongoRecDocs.length > 0) {
          await Recommendation.insertMany(mongoRecDocs);
        }

        // Save Contributors
        const contribDocs = metadata.contributors.map((c) => ({
          repositoryId: repoObjId,
          authorName: c.name,
          authorEmail: c.email,
          totalCommits: c.commitCount,
          linesAdded: 0,
          linesDeleted: 0,
          ownedFilesCount: 0,
          primaryLanguages: ['TypeScript'],
          firstCommitAt: metadata.firstCommitDate,
          lastCommitAt: metadata.latestCommitDate,
          isDemo: false,
        }));
        await Contributor.deleteMany({ repositoryId: repoObjId });
        if (contribDocs.length > 0) {
          await Contributor.insertMany(contribDocs, { ordered: false }).catch(() => {});
        }

        // Save Commits
        const commitDocs = historyResult.commits.slice(0, 100).map((c) => ({
          repositoryId: repoObjId,
          commitHash: c.hash,
          authorName: c.authorName,
          authorEmail: c.authorEmail,
          message: c.message,
          committedAt: c.timestamp,
          filesChanged: c.filesChanged.map((fc) => ({
            filePath: fc.path,
            additions: fc.additions,
            deletions: fc.deletions,
          })),
          isFixCommit: c.isFixCommit,
          isDemo: false,
        }));
        await Commit.deleteMany({ repositoryId: repoObjId });
        if (commitDocs.length > 0) {
          await Commit.insertMany(commitDocs, { ordered: false }).catch(() => {});
        }

        // Save TrendPoint
        await TrendPoint.create({
          repositoryId: repoObjId,
          analysisId: analysisObjId,
          date: trendDoc.date,
          commitHash: trendDoc.commitHash,
          totalDebtHours,
          healthScore: overallHealthScore,
          remediationCost: valuation.estimatedRemediationInvestment.totalCost,
          reworkHours: valuation.historicalMaintenanceReworkBurden.totalHours,
          avoidableAnnualCost: valuation.estimatedFutureAvoidableCost.projectedAnnualCost,
          linesOfCode: totalLoC,
          hotspotCount: hotspotItems.length,
          criticalHotspots,
          isDemo: false,
        });

        // Update Analysis record
        await Analysis.findByIdAndUpdate(analysisObjId, {
          branch: metadata.defaultBranch,
          commitHash: metadata.headCommitSha.substring(0, 7),
          status: 'completed',
          progress: 100,
          currentStage: 'Analysis completed successfully.',
          filesDiscovered: job.filesDiscovered,
          filesAnalyzed: job.filesAnalyzed,
          commitsAnalyzed: job.commitsAnalyzed,
          completedAt: new Date(),
          isDemo: false,
          summary,
        });
      }

      // 12. Cleanup Workspace
      await updateStage('completed', 100, 'Analysis completed. Workspace cleaned.');
      job.completedAt = new Date();
      await RepositoryCleanupService.cleanupWorkspace(clonePath);

      console.log(`[AnalysisOrchestrator] Job ${analysisId} completed successfully.`);
      return job;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[AnalysisOrchestrator] Job ${analysisId} failed: ${errorMsg}`);

      job.status = 'failed';
      job.error = errorMsg;
      job.currentStage = `Failed: ${errorMsg}`;
      job.completedAt = new Date();
      activeJobs.set(analysisId, { ...job });

      await AuditTrailService.logEvent({
        repositoryId,
        action: 'ANALYSIS_FAILED',
        targetId: analysisId,
        targetType: 'ANALYSIS',
        description: `Analysis job failed: ${errorMsg}`,
      }).catch(() => {});

      if (clonePath) {
        await RepositoryCleanupService.cleanupWorkspace(clonePath);
      }

      const dbStatus = getDatabaseStatus();
      if (dbStatus.isConnected && Types.ObjectId.isValid(analysisId)) {
        await Analysis.findByIdAndUpdate(analysisId, {
          status: 'failed',
          error: errorMsg,
          currentStage: `Failed: ${errorMsg}`,
          completedAt: new Date(),
        }).catch(() => {});

        if (Types.ObjectId.isValid(repositoryId)) {
          await Repository.findByIdAndUpdate(repositoryId, {
            status: 'failed',
          }).catch(() => {});
        }
      }

      return job;
    } finally {
      cancellationTokens.delete(analysisId);
    }
  }
}
