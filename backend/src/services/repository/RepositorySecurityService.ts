import { URL } from 'url';

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
  isLocalFixture?: boolean;
}

export class RepositorySecurityService {
  /**
   * Private IPv4 and IPv6 CIDR/Regex patterns for SSRF prevention
   */
  private static readonly BLOCKED_HOST_PATTERNS = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^0\.0\.0\.0$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/, // Link-local & Cloud Metadata (AWS/GCP/Azure)
    /^\[?::1\]?$/,
    /^\[?(fc|fd)[0-9a-f]{2}:/i,
    /^\[?fe80:/i,
    /metadata\.google\.internal/i,
    /metadata/i,
    /instance-data/i,
  ];

  /**
   * Prohibited shell injection characters
   */
  private static readonly UNSAFE_CHARS = /[;&|`$><"'\n\r\t]/;

  /**
   * Validates Git repository URLs against SSRF, command injection, and invalid schemes.
   */
  static validateUrl(rawUrl: string, allowLocalFixture: boolean = false): UrlValidationResult {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { isValid: false, error: 'Repository URL is required.' };
    }

    const trimmed = rawUrl.trim();

    // Check maximum length
    if (trimmed.length > 2048) {
      return {
        isValid: false,
        error: 'Repository URL exceeds maximum allowed length of 2048 characters.',
      };
    }

    // Check for dangerous shell injection characters
    if (this.UNSAFE_CHARS.test(trimmed)) {
      return {
        isValid: false,
        error: 'Repository URL contains prohibited characters.',
      };
    }

    // Allow deterministic local fixture repository during tests
    if (allowLocalFixture && (trimmed.startsWith('file://') || trimmed.startsWith('/'))) {
      return {
        isValid: true,
        sanitizedUrl: trimmed.replace(/^file:\/\//, ''),
        isLocalFixture: true,
      };
    }

    // Must be HTTPS (or SSH format if implemented; Phase 2 specifies HTTPS initially)
    if (!trimmed.startsWith('https://')) {
      return {
        isValid: false,
        error: 'Only secure HTTPS repository URLs are supported (e.g. https://github.com/org/repo.git).',
      };
    }

    try {
      const parsed = new URL(trimmed);

      // Verify protocol
      if (parsed.protocol !== 'https:') {
        return {
          isValid: false,
          error: 'Only HTTPS protocol is permitted.',
        };
      }

      const rawHostname = parsed.hostname.toLowerCase();
      const hostname = rawHostname.replace(/^\[|\]$/g, '');

      // Check SSRF blocked hostnames and IP ranges
      for (const pattern of this.BLOCKED_HOST_PATTERNS) {
        if (pattern.test(rawHostname) || pattern.test(hostname)) {
          return {
            isValid: false,
            error: 'Repository URL targets a restricted local or internal network host (SSRF protection).',
          };
        }
      }

      // Check for port restrictions (only standard 443 or default HTTPS allowed)
      if (parsed.port && parsed.port !== '443') {
        return {
          isValid: false,
          error: 'Custom non-standard ports are prohibited for repository cloning.',
        };
      }

      // Ensure pathname is valid and not empty
      if (!parsed.pathname || parsed.pathname === '/' || parsed.pathname.length < 3) {
        return {
          isValid: false,
          error: 'Invalid repository path.',
        };
      }

      // Strip any credentials embedded in URL userinfo (e.g. https://user:pass@host/repo)
      parsed.username = '';
      parsed.password = '';

      return {
        isValid: true,
        sanitizedUrl: parsed.toString(),
        isLocalFixture: false,
      };
    } catch {
      return {
        isValid: false,
        error: 'Malformed repository URL format.',
      };
    }
  }

  /**
   * Sanitizes file paths to prevent directory traversal outside workspaces
   */
  static isPathSafe(baseDir: string, relativePath: string): boolean {
    const fullPath = require('path').resolve(baseDir, relativePath);
    return fullPath.startsWith(require('path').resolve(baseDir));
  }

  /**
   * Validates whether a target path is strictly contained within the base directory.
   */
  static isSafeWorkspacePath(baseDir: string, targetPath: string): boolean {
    const resolvedBase = require('path').resolve(baseDir);
    const resolvedTarget = require('path').resolve(targetPath);
    return (
      resolvedTarget.startsWith(resolvedBase + require('path').sep) ||
      resolvedTarget === resolvedBase
    );
  }
}
