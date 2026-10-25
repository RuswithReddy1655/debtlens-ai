import { simpleGit, SimpleGit } from 'simple-git';

export interface ExtractedGitMetadata {
  headCommitSha: string;
  defaultBranch: string;
  totalCommits: number;
  firstCommitDate?: Date;
  latestCommitDate?: Date;
  branches: string[];
  tags: string[];
  contributors: { name: string; email: string; commitCount: number }[];
}

export class RepositoryMetadataService {
  /**
   * Extracts repository metadata from a local cloned Git workspace.
   */
  static async extractMetadata(clonePath: string): Promise<ExtractedGitMetadata> {
    const git: SimpleGit = simpleGit(clonePath);

    // HEAD commit SHA
    let headCommitSha = 'HEAD';
    try {
      headCommitSha = (await git.revparse(['HEAD'])).trim();
    } catch {
      // Empty repo fallback
    }

    // Default branch
    let defaultBranch = 'main';
    try {
      const branchSummary = await git.branchLocal();
      defaultBranch = branchSummary.current || 'main';
    } catch {
      // Fallback
    }

    // Branches
    let branches: string[] = ['main'];
    try {
      const branchSummary = await git.branchLocal();
      branches = branchSummary.all;
    } catch {
      // Fallback
    }

    // Tags
    let tags: string[] = [];
    try {
      const tagList = await git.tags();
      tags = tagList.all;
    } catch {
      // Fallback
    }

    // Log history overview
    let totalCommits = 0;
    let firstCommitDate: Date | undefined;
    let latestCommitDate: Date | undefined;
    const contributorMap = new Map<string, { name: string; email: string; commitCount: number }>();

    try {
      const log = await git.log({ maxCount: 1000 });
      totalCommits = log.total;

      if (log.all.length > 0) {
        latestCommitDate = new Date(log.all[0].date);
        firstCommitDate = new Date(log.all[log.all.length - 1].date);

        for (const commit of log.all) {
          const email = commit.author_email.toLowerCase();
          const existing = contributorMap.get(email);
          if (existing) {
            existing.commitCount += 1;
          } else {
            contributorMap.set(email, {
              name: commit.author_name,
              email: commit.author_email,
              commitCount: 1,
            });
          }
        }
      }
    } catch {
      // Handle zero commits
    }

    return {
      headCommitSha,
      defaultBranch,
      totalCommits,
      firstCommitDate,
      latestCommitDate,
      branches,
      tags,
      contributors: Array.from(contributorMap.values()),
    };
  }
}
