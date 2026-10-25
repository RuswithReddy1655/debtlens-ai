import {
  GitRepositoryService,
  GitHistoryAnalyzer,
  SourceCodeAnalyzer,
  ComplexityAnalyzer,
  DefectAnalyzer,
  OwnershipAnalyzer,
  LegacyAnalyzer,
  RepositoryMetadata,
  CommitInfo,
  FileAnalysisTarget,
  ComplexityMetrics,
  DefectMetrics,
  OwnershipMetrics,
  LegacyMetrics,
  ChurnMetrics,
} from './interfaces';

export class DefaultGitRepositoryService implements GitRepositoryService {
  async validateRepository(url: string): Promise<{ isValid: boolean; defaultBranch?: string; error?: string }> {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'Repository URL is required.' };
    }
    const clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('git@')) {
      return { isValid: false, error: 'Invalid repository URL protocol. Must use HTTPS or SSH.' };
    }
    return { isValid: true, defaultBranch: 'main' };
  }

  async fetchMetadata(repoId: string): Promise<RepositoryMetadata> {
    return {
      id: repoId,
      name: 'sample-enterprise-service',
      owner: 'acme-corp',
      url: 'https://github.com/acme-corp/sample-enterprise-service',
      defaultBranch: 'main',
      isDemo: true,
    };
  }

  async listBranches(repoId: string): Promise<string[]> {
    return ['main', 'develop', 'release/v2.1', 'feature/refactor-pipeline'];
  }
}

export class DefaultGitHistoryAnalyzer implements GitHistoryAnalyzer {
  async analyzeHistory(
    repoId: string,
    branch: string,
    maxCommits: number = 100
  ): Promise<{ commits: CommitInfo[]; fileChurnMap: Map<string, ChurnMetrics> }> {
    const commits: CommitInfo[] = [];
    const fileChurnMap = new Map<string, ChurnMetrics>();
    return { commits, fileChurnMap };
  }
}

export class DefaultSourceCodeAnalyzer implements SourceCodeAnalyzer {
  async enumerateFiles(repoId: string, branch: string): Promise<FileAnalysisTarget[]> {
    return [];
  }
}

export class DefaultComplexityAnalyzer implements ComplexityAnalyzer {
  async calculateComplexity(target: FileAnalysisTarget): Promise<ComplexityMetrics> {
    const loc = target.sizeBytes > 0 ? Math.round(target.sizeBytes / 35) : 120;
    return {
      cyclomaticComplexity: 12,
      cognitiveComplexity: 14,
      linesOfCode: loc,
      logicalLinesOfCode: Math.round(loc * 0.7),
      nestingDepthMax: 3,
      functionCount: Math.max(1, Math.round(loc / 40)),
      commentRatio: 0.15,
      duplicationPercentage: 4.5,
    };
  }
}

export class DefaultDefectAnalyzer implements DefectAnalyzer {
  async analyzeDefects(repoId: string, filePath: string): Promise<DefectMetrics> {
    return {
      totalDefects: 2,
      criticalDefects: 0,
      reworkHoursSpent: 8,
      defectDensityPerKLoC: 3.2,
      defectHistory: [
        {
          id: 'BUG-101',
          severity: 'minor',
          resolvedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
          reworkHours: 4,
        },
      ],
    };
  }
}

export class DefaultOwnershipAnalyzer implements OwnershipAnalyzer {
  async analyzeOwnership(commits: CommitInfo[], filePath: string): Promise<OwnershipMetrics> {
    return {
      primaryOwner: 'Sarah Lin (Lead Architect)',
      primaryOwnerPercentage: 68,
      totalContributors: 3,
      ownershipEntropy: 0.52,
      isKnowledgeSilo: false,
      topContributors: [
        { name: 'Sarah Lin', email: 'sarah@acme.internal', commitCount: 34, sharePercentage: 68 },
        { name: 'Alex Rivera', email: 'alex@acme.internal', commitCount: 11, sharePercentage: 22 },
        { name: 'Jordan Patel', email: 'jordan@acme.internal', commitCount: 5, sharePercentage: 10 },
      ],
    };
  }
}

export class DefaultLegacyAnalyzer implements LegacyAnalyzer {
  async analyzeLegacy(filePath: string, lastModified: Date): Promise<LegacyMetrics> {
    const diffMs = Date.now() - lastModified.getTime();
    const months = Math.max(0, Math.round(diffMs / (30 * 24 * 3600 * 1000)));
    return {
      isLegacy: months > 18,
      monthsSinceLastModified: months,
      dependencyFreshnessScore: 82,
      deprecatedApiCount: 1,
      frameworkVersionLagMonths: 6,
    };
  }
}
