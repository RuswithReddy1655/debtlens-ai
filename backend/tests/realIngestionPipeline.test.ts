import fs from 'fs';
import path from 'path';
import { setupSampleRepository, SAMPLE_REPO_DIR } from './fixtures/setupSampleRepo';
import { AnalysisOrchestrator } from '../src/services/analysis/AnalysisOrchestrator';

describe('Real Repository Ingestion & Analysis Orchestrator Pipeline', () => {
  let fixtureRepoPath: string;

  beforeAll(() => {
    fixtureRepoPath = setupSampleRepository();
  });

  it('should execute end-to-end analysis on the deterministic fixture repository', async () => {
    const analysisId = `analysis-integration-${Date.now()}`;
    const repositoryId = 'repo-fixture-01';

    // Execute full pipeline
    const job = await AnalysisOrchestrator.runAnalysis({
      analysisId,
      repositoryId,
      repoUrl: fixtureRepoPath,
      branch: 'main',
      hourlyRate: 110,
    });

    // 1. Verify Job Status
    expect(job.status).toBe('completed');
    expect(job.progress).toBe(100);
    expect(job.filesDiscovered).toBeGreaterThanOrEqual(4);
    expect(job.filesAnalyzed).toBeGreaterThanOrEqual(4);
    expect(job.commitsAnalyzed).toBeGreaterThanOrEqual(5);
    expect(job.isDemo).toBe(false);
    expect(job.error).toBeUndefined();

    // 2. Verify Completed Data in Memory/Store
    const completed = AnalysisOrchestrator.getCompletedData(analysisId);
    expect(completed).not.toBeNull();
    expect(completed!.analysis.status).toBe('completed');
    expect(completed!.analysis.isDemo).toBe(false);

    // 3. Verify Hotspots
    const hotspots = AnalysisOrchestrator.getHotspots(analysisId);
    expect(hotspots).not.toBeNull();
    expect(Array.isArray(hotspots)).toBe(true);
    expect(hotspots!.length).toBeGreaterThan(0);

    // Top hotspot should have high complexity or churn
    const topHotspot = hotspots![0];
    expect(topHotspot.filePath).toBeDefined();
    expect(topHotspot.debtScore).toBeGreaterThan(0);
    expect(topHotspot.estimatedRemediationCost).toBeGreaterThan(0);
    expect(topHotspot.isDemo).toBe(false);

    // 4. Verify File Metrics
    const metrics = AnalysisOrchestrator.getFileMetrics(analysisId);
    expect(metrics).not.toBeNull();
    expect(metrics!.length).toBeGreaterThanOrEqual(4);

    const paymentFile = metrics!.find((m: any) => m.filePath.includes('paymentProcessor.ts'));
    expect(paymentFile).toBeDefined();
    expect(paymentFile.cyclomaticComplexity).toBeGreaterThanOrEqual(10);
    expect(paymentFile.isDemo).toBe(false);
    expect(paymentFile.analysisStatus).toBe('SUPPORTED');

    // 5. Verify Recommendations
    const recs = AnalysisOrchestrator.getRecommendations(analysisId);
    expect(recs).not.toBeNull();
    expect(Array.isArray(recs)).toBe(true);
    if (recs!.length > 0) {
      expect(recs![0].title).toBeDefined();
      expect(recs![0].roiRatio).toBeGreaterThan(0);
      expect(recs![0].isDemo).toBe(false);
    }

    // 6. Verify Financial Valuation
    const valuation = await AnalysisOrchestrator.getValuation(analysisId, 110);
    expect(valuation).not.toBeNull();
    expect(valuation.estimatedRemediationInvestment.totalCost).toBeGreaterThan(0);
    expect(valuation.estimatedFutureAvoidableCost.projectedAnnualCost).toBeGreaterThan(0);
    expect(valuation.potentialRefactoringBenefit.netSavings).toBeDefined();

    // 7. Verify Workspace Cleanup (temp cloned repo must NOT remain)
    const expectedWorkspaceDir = path.resolve(
      process.cwd(),
      '.analysis-workspaces',
      `analysis-${analysisId}`
    );
    expect(fs.existsSync(expectedWorkspaceDir)).toBe(false);
  }, 30000);

  it('should support cancellation of a running analysis', async () => {
    const analysisId = `analysis-cancel-${Date.now()}`;

    // Test cancellation
    const cancelled = AnalysisOrchestrator.cancelAnalysis(analysisId);
    // Non-existent active job should return false
    expect(cancelled).toBe(false);
  });
});
