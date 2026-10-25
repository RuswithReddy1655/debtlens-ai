import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import path from 'path';
import fs from 'fs';
import { config } from '../../config/env';
import { RepositoryCleanupService } from './RepositoryCleanupService';
import { RepositorySecurityService } from './RepositorySecurityService';

export interface CloneResult {
  success: boolean;
  clonePath: string;
  error?: string;
  errorCode?: string;
  sizeBytes?: number;
}

export class RepositoryCloneService {
  /**
   * Safely clones a remote Git repository into an isolated temporary workspace.
   */
  static async cloneRepository(
    url: string,
    analysisId: string,
    branch?: string
  ): Promise<CloneResult> {
    const validation = RepositorySecurityService.validateUrl(url, config.allowLocalFixtureRepos);
    if (!validation.isValid || !validation.sanitizedUrl) {
      return {
        success: false,
        clonePath: '',
        error: validation.error || 'Invalid repository URL.',
        errorCode: 'INVALID_URL',
      };
    }

    const sanitizedUrl = validation.sanitizedUrl;
    RepositoryCleanupService.ensureBaseDirectory(config.analysisWorkspaceDir);

    const workspacePath = path.join(
      config.analysisWorkspaceDir,
      `analysis-${analysisId}-${Date.now()}`
    );

    // If local fixture during test
    if (validation.isLocalFixture) {
      try {
        if (!fs.existsSync(sanitizedUrl)) {
          return {
            success: false,
            clonePath: '',
            error: `Local fixture repository does not exist at ${sanitizedUrl}`,
            errorCode: 'FIXTURE_NOT_FOUND',
          };
        }
        // Clone from local fixture path to workspace
        const git = simpleGit({ timeout: { block: config.gitCloneTimeoutMs } });
        const cloneArgs = ['--depth', '100'];
        if (branch) cloneArgs.push('--branch', branch);
        await git.clone(sanitizedUrl, workspacePath, cloneArgs);

        return {
          success: true,
          clonePath: workspacePath,
          sizeBytes: this.getDirectorySize(workspacePath),
        };
      } catch (err: unknown) {
        await RepositoryCleanupService.cleanupWorkspace(workspacePath);
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          clonePath: '',
          error: `Failed to clone local test fixture: ${msg}`,
          errorCode: 'CLONE_FAILED',
        };
      }
    }

    // Remote HTTPS cloning with safe arguments and timeout
    const gitOptions: Partial<SimpleGitOptions> = {
      baseDir: config.analysisWorkspaceDir,
      binary: 'git',
      maxConcurrentProcesses: 2,
      timeout: { block: config.gitCloneTimeoutMs },
    };

    const git: SimpleGit = simpleGit(gitOptions);

    try {
      const cloneArgs = ['--single-branch', '--depth', String(config.maxCommits)];
      if (branch) {
        cloneArgs.push('--branch', branch);
      }

      console.log(`[CloneService] Cloning ${sanitizedUrl} into ${workspacePath}...`);

      // Execute clone safely without shell interpolation
      await git.clone(sanitizedUrl, workspacePath, cloneArgs);

      // Verify repository size limit
      const sizeBytes = this.getDirectorySize(workspacePath);
      const sizeMb = sizeBytes / (1024 * 1024);

      if (sizeMb > config.maxRepoSizeMb) {
        await RepositoryCleanupService.cleanupWorkspace(workspacePath);
        return {
          success: false,
          clonePath: '',
          error: `Repository size (${sizeMb.toFixed(1)}MB) exceeds maximum allowed limit (${config.maxRepoSizeMb}MB).`,
          errorCode: 'REPOSITORY_TOO_LARGE',
        };
      }

      return {
        success: true,
        clonePath: workspacePath,
        sizeBytes,
      };
    } catch (err: unknown) {
      await RepositoryCleanupService.cleanupWorkspace(workspacePath);
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('timed out')) {
        return {
          success: false,
          clonePath: '',
          error: 'Repository cloning timed out. Please check repository size and network availability.',
          errorCode: 'CLONE_TIMEOUT',
        };
      }

      if (msg.includes('Authentication failed') || msg.includes('could not read Username') || msg.includes('Repository not found')) {
        return {
          success: false,
          clonePath: '',
          error: 'Repository could not be accessed. Please check URL and public visibility.',
          errorCode: 'REPOSITORY_INACCESSIBLE',
        };
      }

      return {
        success: false,
        clonePath: '',
        error: `Git clone failed: ${msg}`,
        errorCode: 'CLONE_FAILED',
      };
    }
  }

  /**
   * Computes approximate directory size in bytes.
   */
  static getDirectorySize(dirPath: string): number {
    let total = 0;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          total += this.getDirectorySize(fullPath);
        } else if (entry.isFile()) {
          const stat = fs.statSync(fullPath);
          total += stat.size;
        }
      }
    } catch {
      // Ignore read errors
    }
    return total;
  }
}
