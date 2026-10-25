import { simpleGit, SimpleGit } from 'simple-git';
import {
  CommitInfo,
  ChurnMetrics,
  OwnershipMetrics,
} from './interfaces';

export interface FileGitStats {
  filePath: string;
  commitCount: number;
  linesAdded: number;
  linesDeleted: number;
  totalChurn: number;
  firstSeenAt: Date;
  lastModifiedAt: Date;
  ageInDays: number;
  daysSinceLastChange: number;
  changesPerMonth: number;
  defectFixCommitCount: number;
  defectFixFrequency: number;
  contributors: Map<string, { name: string; email: string; commitCount: number }>;
  primaryContributor: string;
  ownershipPercentage: number;
  ownershipEntropy: number;
  isKnowledgeSilo: boolean;
}

export class RealGitHistoryAnalyzer {
  /**
   * Bug-fix heuristic regex pattern for commit messages
   */
  private static readonly FIX_MESSAGE_REGEX =
    /\b(fix|bug|bugfix|hotfix|patch|issue|error|crash|regression|defect|failure)\b/i;

  /**
   * Analyzes the Git commit history of a cloned repository workspace.
   */
  static async analyzeHistory(
    clonePath: string,
    maxCommits: number = 1000
  ): Promise<{
    commits: CommitInfo[];
    fileStatsMap: Map<string, FileGitStats>;
    totalCommits: number;
    defectFixCommitCount: number;
  }> {
    const git: SimpleGit = simpleGit(clonePath);
    const commits: CommitInfo[] = [];
    const fileStatsMap = new Map<string, FileGitStats>();
    let defectFixCommitCount = 0;

    try {
      // Fetch detailed log with stat summary for changed files
      const log = await git.log({
        maxCount: maxCommits,
        '--stat': null,
      });

      const now = Date.now();

      for (const entry of log.all) {
        const message = entry.message || '';
        const isFixCommit = this.FIX_MESSAGE_REGEX.test(message);
        if (isFixCommit) {
          defectFixCommitCount++;
        }

        const commitDate = new Date(entry.date);
        const authorName = entry.author_name;
        const authorEmail = entry.author_email.toLowerCase();

        // Parse file diffs from entry.diff if present, or split stat lines
        const fileChanges: { path: string; additions: number; deletions: number }[] = [];

        if (entry.diff && entry.diff.files) {
          for (const f of entry.diff.files) {
            const additions = 'insertions' in f && typeof f.insertions === 'number' ? f.insertions : 0;
            const deletions = 'deletions' in f && typeof f.deletions === 'number' ? f.deletions : 0;
            fileChanges.push({
              path: f.file,
              additions,
              deletions,
            });
          }
        }

        const commitInfo: CommitInfo = {
          hash: entry.hash,
          authorName,
          authorEmail,
          timestamp: commitDate,
          message,
          filesChanged: fileChanges,
          isFixCommit,
        };
        commits.push(commitInfo);

        // Aggregate file-level telemetry
        for (const change of fileChanges) {
          const filePath = change.path.replace(/\\/g, '/');
          let stats = fileStatsMap.get(filePath);

          if (!stats) {
            stats = {
              filePath,
              commitCount: 0,
              linesAdded: 0,
              linesDeleted: 0,
              totalChurn: 0,
              firstSeenAt: commitDate,
              lastModifiedAt: commitDate,
              ageInDays: 0,
              daysSinceLastChange: 0,
              changesPerMonth: 0,
              defectFixCommitCount: 0,
              defectFixFrequency: 0,
              contributors: new Map(),
              primaryContributor: authorName,
              ownershipPercentage: 100,
              ownershipEntropy: 0,
              isKnowledgeSilo: false,
            };
            fileStatsMap.set(filePath, stats);
          }

          stats.commitCount += 1;
          stats.linesAdded += change.additions;
          stats.linesDeleted += change.deletions;
          stats.totalChurn = stats.linesAdded + stats.linesDeleted;

          if (commitDate < stats.firstSeenAt) {
            stats.firstSeenAt = commitDate;
          }
          if (commitDate > stats.lastModifiedAt) {
            stats.lastModifiedAt = commitDate;
          }

          if (isFixCommit) {
            stats.defectFixCommitCount += 1;
          }

          const existingContrib = stats.contributors.get(authorEmail);
          if (existingContrib) {
            existingContrib.commitCount += 1;
          } else {
            stats.contributors.set(authorEmail, {
              name: authorName,
              email: authorEmail,
              commitCount: 1,
            });
          }
        }
      }

      // Calculate finalized rates, entropy, and normalized frequencies
      for (const stats of fileStatsMap.values()) {
        const ageMs = Math.max(now - stats.firstSeenAt.getTime(), 1000 * 3600 * 24);
        stats.ageInDays = Math.round(ageMs / (1000 * 3600 * 24));
        const lastChangeMs = Math.max(0, now - stats.lastModifiedAt.getTime());
        stats.daysSinceLastChange = Math.round(lastChangeMs / (1000 * 3600 * 24));

        const ageMonths = Math.max(0.5, stats.ageInDays / 30);
        stats.changesPerMonth = Number((stats.commitCount / ageMonths).toFixed(2));
        stats.defectFixFrequency = Number(
          (stats.defectFixCommitCount / Math.max(1, stats.commitCount)).toFixed(2)
        );

        // Ownership & Shannon Entropy
        const contribArray = Array.from(stats.contributors.values());
        if (contribArray.length > 0) {
          contribArray.sort((a, b) => b.commitCount - a.commitCount);
          const top = contribArray[0];
          stats.primaryContributor = top.name;
          stats.ownershipPercentage = Math.round(
            (top.commitCount / Math.max(1, stats.commitCount)) * 100
          );
          stats.isKnowledgeSilo = stats.ownershipPercentage >= 80;

          // Normalized Shannon Entropy: -Sum(p_i * log2(p_i)) / log2(N)
          if (contribArray.length > 1) {
            let entropy = 0;
            const N = contribArray.length;
            for (const c of contribArray) {
              const p = c.commitCount / stats.commitCount;
              if (p > 0) entropy -= p * Math.log2(p);
            }
            stats.ownershipEntropy = Number(Math.min(1, entropy / Math.log2(N)).toFixed(2));
          } else {
            stats.ownershipEntropy = 0;
          }
        }
      }
    } catch (err: unknown) {
      console.warn(`[GitHistoryAnalyzer] Warning reading commit history:`, err);
    }

    return {
      commits,
      fileStatsMap,
      totalCommits: commits.length,
      defectFixCommitCount,
    };
  }
}
