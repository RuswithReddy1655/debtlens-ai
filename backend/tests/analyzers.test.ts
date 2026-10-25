import path from 'path';
import { setupSampleRepository, SAMPLE_REPO_DIR } from './fixtures/setupSampleRepo';
import { RealGitHistoryAnalyzer } from '../src/analyzers/realGitHistoryAnalyzer';
import { RealSourceCodeAnalyzer } from '../src/analyzers/realSourceCodeAnalyzer';
import { RealLegacyAnalyzer } from '../src/analyzers/realLegacyAnalyzer';

describe('Phase 2 Analyzers (Git History, Source Code AST & Legacy Risk)', () => {
  let fixtureRepoPath: string;

  beforeAll(() => {
    fixtureRepoPath = setupSampleRepository();
  });

  describe('RealGitHistoryAnalyzer', () => {
    it('should extract commits, authors, and detect defect-fix commit messages', async () => {
      const history = await RealGitHistoryAnalyzer.analyzeHistory(fixtureRepoPath, 100);

      expect(history.totalCommits).toBeGreaterThanOrEqual(5);
      expect(history.commits.length).toBeGreaterThanOrEqual(5);

      // Verify authors
      const authors = new Set(history.commits.map((c) => c.authorName));
      expect(authors.has('Alice Dev')).toBe(true);
      expect(authors.has('Bob Engineer')).toBe(true);

      // Verify defect-fix detection heuristic ("fix: ...", "hotfix: ...")
      expect(history.defectFixCommitCount).toBeGreaterThanOrEqual(2);
      const fixCommits = history.commits.filter((c) => c.isFixCommit);
      expect(fixCommits.length).toBeGreaterThanOrEqual(2);
      expect(fixCommits.some((c) => c.message.includes('fix:'))).toBe(true);
      expect(fixCommits.some((c) => c.message.includes('hotfix:'))).toBe(true);
    });

    it('should compute file-level churn metrics and change frequency correctly', async () => {
      const history = await RealGitHistoryAnalyzer.analyzeHistory(fixtureRepoPath, 100);

      // Check tokenValidator.ts stats (modified in commits 3, 4, 5)
      const tokenStats = Array.from(history.fileStatsMap.values()).find((s) =>
        s.filePath.includes('tokenValidator.ts')
      );

      expect(tokenStats).toBeDefined();
      expect(tokenStats!.commitCount).toBeGreaterThanOrEqual(3);
      expect(tokenStats!.totalChurn).toBe(tokenStats!.linesAdded + tokenStats!.linesDeleted);
      expect(tokenStats!.totalChurn).toBeGreaterThan(0);
      expect(tokenStats!.defectFixCommitCount).toBeGreaterThanOrEqual(2);
      expect(tokenStats!.defectFixFrequency).toBeGreaterThan(0);
      expect(tokenStats!.changesPerMonth).toBeGreaterThan(0);
    });

    it('should compute ownership concentration and contributors correctly', async () => {
      const history = await RealGitHistoryAnalyzer.analyzeHistory(fixtureRepoPath, 100);

      const tokenStats = Array.from(history.fileStatsMap.values()).find((s) =>
        s.filePath.includes('tokenValidator.ts')
      );

      expect(tokenStats).toBeDefined();
      expect(tokenStats!.contributors.size).toBeGreaterThanOrEqual(1);
      expect(tokenStats!.primaryContributor).toBeDefined();
      expect(tokenStats!.ownershipPercentage).toBeGreaterThan(0);
      expect(tokenStats!.ownershipEntropy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('RealSourceCodeAnalyzer', () => {
    it('should discover source files and exclude .git and binary files', async () => {
      const discovered = await RealSourceCodeAnalyzer.discoverAndAnalyzeFiles(fixtureRepoPath);

      expect(discovered.length).toBeGreaterThanOrEqual(4);

      // Ensure no .git files were discovered
      expect(discovered.some((f) => f.relativePath.includes('.git'))).toBe(false);

      // Ensure recognized languages
      const languages = new Set(discovered.map((f) => f.language));
      expect(languages.has('TypeScript')).toBe(true);
      expect(languages.has('JavaScript')).toBe(true);
    });

    it('should calculate accurate AST cyclomatic complexity and nesting depth for TypeScript', async () => {
      const discovered = await RealSourceCodeAnalyzer.discoverAndAnalyzeFiles(fixtureRepoPath);

      const mathFile = discovered.find((f) => f.relativePath.includes('math.ts'));
      const paymentFile = discovered.find((f) => f.relativePath.includes('paymentProcessor.ts'));

      expect(mathFile).toBeDefined();
      expect(paymentFile).toBeDefined();

      // Math utils has low cyclomatic complexity (2 basic return statements = complexity 2)
      expect(mathFile!.cyclomaticComplexity).toBeLessThanOrEqual(3);
      expect(mathFile!.functionCount).toBe(2);
      expect(mathFile!.nestingDepthMax).toBeLessThanOrEqual(2);

      // Payment processor has multiple nested conditionals and switches
      expect(paymentFile!.cyclomaticComplexity).toBeGreaterThanOrEqual(10);
      expect(paymentFile!.nestingDepthMax).toBeGreaterThanOrEqual(4);
      expect(paymentFile!.classCount).toBe(1);
    });

    it('should extract correct lines of code breakdown (blank, comment, code lines)', async () => {
      const discovered = await RealSourceCodeAnalyzer.discoverAndAnalyzeFiles(fixtureRepoPath);

      const legacyFile = discovered.find((f) => f.relativePath.includes('legacyConfig.js'));
      expect(legacyFile).toBeDefined();

      expect(legacyFile!.linesOfCode).toBeGreaterThan(0);
      expect(legacyFile!.commentLines).toBeGreaterThanOrEqual(1);
      expect(legacyFile!.codeLines).toBeGreaterThan(0);
      expect(legacyFile!.linesOfCode).toBe(
        legacyFile!.codeLines + legacyFile!.commentLines + legacyFile!.blankLines
      );
    });
  });

  describe('RealLegacyAnalyzer', () => {
    it('should not flag low-churn, low-complexity stable utilities as legacy risk', () => {
      const stableResult = RealLegacyAnalyzer.evaluateLegacyRisk({
        ageInDays: 700,
        daysSinceLastChange: 650,
        cyclomaticComplexity: 2,
        churnCount: 1,
        ownershipPercentage: 100,
      });

      expect(stableResult.isLegacy).toBe(false);
      expect(stableResult.legacyScore).toBeLessThan(50);
    });

    it('should identify aging high-complexity code with abandoned ownership as legacy risk', () => {
      const legacyResult = RealLegacyAnalyzer.evaluateLegacyRisk({
        ageInDays: 900,
        daysSinceLastChange: 400,
        cyclomaticComplexity: 35,
        churnCount: 8,
        ownershipPercentage: 30, // fragmented ownership
      });

      expect(legacyResult.isLegacy).toBe(true);
      expect(legacyResult.legacyScore).toBeGreaterThanOrEqual(60);
      expect(legacyResult.reason).toMatch(/legacy/i);
    });
  });
});
