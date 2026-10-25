import fs from 'fs';
import path from 'path';

export class RepositoryCleanupService {
  /**
   * Safely and recursively removes an isolated analysis workspace directory.
   */
  static async cleanupWorkspace(workspacePath: string): Promise<boolean> {
    if (!workspacePath) return true;

    try {
      if (fs.existsSync(workspacePath)) {
        // Enforce write permissions on all files to prevent git read-only permission issues
        this.grantWritePermissionsRecursively(workspacePath);
        fs.rmSync(workspacePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
        console.log(`[CleanupService] Successfully removed workspace: ${workspacePath}`);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[CleanupService] Warning: Failed to clean workspace ${workspacePath}: ${msg}`);
      return false;
    }
  }

  /**
   * Helper to ensure files in .git/objects have write permissions before deletion
   */
  private static grantWritePermissionsRecursively(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        try {
          fs.chmodSync(fullPath, 0o777);
        } catch {
          // Ignore individual permission errors
        }
        if (entry.isDirectory()) {
          this.grantWritePermissionsRecursively(fullPath);
        }
      }
    } catch {
      // Ignore directory scan errors during cleanup
    }
  }

  /**
   * Prepares and ensures the base analysis workspaces directory exists.
   */
  static ensureBaseDirectory(baseDir: string): void {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true, mode: 0o700 });
    }
  }
}
