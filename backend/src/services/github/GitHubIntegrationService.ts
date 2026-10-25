import crypto from 'crypto';

export interface GitHubRepoSummary {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  cloneUrl: string;
  description: string;
  updatedAt: string;
  language: string;
}

// In-memory active CSRF states
const activeStates = new Set<string>();

export class GitHubIntegrationService {
  private static readonly CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
  private static readonly CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
  private static readonly WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'debtlens-webhook-secret';

  /**
   * Generates a cryptographically secure CSRF state token and auth URL.
   */
  static getAuthorizationUrl(redirectUri: string): { authUrl: string; state: string } {
    const state = crypto.randomBytes(24).toString('hex');
    activeStates.add(state);

    // Keep memory clean
    setTimeout(() => activeStates.delete(state), 15 * 60 * 1000); // 15 mins expiry

    if (!this.CLIENT_ID) {
      // Mock mode auth URL for local/testing development
      return {
        authUrl: `/api/github/callback?code=mock_github_code_12345&state=${state}`,
        state,
      };
    }

    const scope = encodeURIComponent('repo,read:org,user:email');
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${this.CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&state=${state}`;

    return { authUrl, state };
  }

  /**
   * Validates state parameter and exchanges OAuth code for secure access token.
   */
  static async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<{ accessToken: string; tokenType: string; isMock: boolean }> {
    if (!state || !activeStates.has(state)) {
      throw new Error('Invalid or expired OAuth state parameter (CSRF protection failed).');
    }
    activeStates.delete(state);

    if (!this.CLIENT_ID || !this.CLIENT_SECRET || code.startsWith('mock_')) {
      // Deterministic mock token for zero-friction local/offline/demo operation
      return {
        accessToken: `gho_mock_${crypto.randomBytes(16).toString('hex')}`,
        tokenType: 'bearer',
        isMock: true,
      };
    }

    // Real GitHub OAuth exchange
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed: HTTP ${response.status}`);
    }

    const data: any = await response.json();
    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'bearer',
      isMock: false,
    };
  }

  /**
   * Retrieves accessible repositories for the authenticated GitHub user.
   */
  static async getUserRepositories(token?: string): Promise<GitHubRepoSummary[]> {
    if (!token || token.startsWith('gho_mock_') || !this.CLIENT_ID) {
      // Return high-fidelity benchmark repositories
      return [
        {
          id: 'repo-gh-01',
          name: 'payment-orchestrator',
          owner: 'enterprise-payments',
          fullName: 'enterprise-payments/payment-orchestrator',
          defaultBranch: 'main',
          isPrivate: true,
          cloneUrl: 'https://github.com/enterprise-payments/payment-orchestrator.git',
          description: 'High-throughput payment gateway settlement and routing router',
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          language: 'TypeScript',
        },
        {
          id: 'repo-gh-02',
          name: 'fintech-core-ledger',
          owner: 'enterprise-payments',
          fullName: 'enterprise-payments/fintech-core-ledger',
          defaultBranch: 'main',
          isPrivate: false,
          cloneUrl: 'https://github.com/enterprise-payments/fintech-core-ledger.git',
          description: 'Double-entry bookkeeping balance and ledger service',
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          language: 'TypeScript',
        },
        {
          id: 'repo-gh-03',
          name: 'risk-scoring-engine',
          owner: 'enterprise-payments',
          fullName: 'enterprise-payments/risk-scoring-engine',
          defaultBranch: 'master',
          isPrivate: true,
          cloneUrl: 'https://github.com/enterprise-payments/risk-scoring-engine.git',
          description: 'Real-time anti-fraud transaction risk classifier',
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          language: 'TypeScript',
        },
        {
          id: 'repo-gh-04',
          name: 'compliance-audit-vault',
          owner: 'enterprise-payments',
          fullName: 'enterprise-payments/compliance-audit-vault',
          defaultBranch: 'main',
          isPrivate: true,
          cloneUrl: 'https://github.com/enterprise-payments/compliance-audit-vault.git',
          description: 'PCI-DSS transaction log retention and integrity notary',
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          language: 'TypeScript',
        },
      ];
    }

    // Call real GitHub API
    const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DebtLens-AI',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch repositories from GitHub: HTTP ${response.status}`);
    }

    const repos: any[] = await response.json();
    return repos.map((r) => ({
      id: r.id.toString(),
      name: r.name,
      owner: r.owner.login,
      fullName: r.full_name,
      defaultBranch: r.default_branch || 'main',
      isPrivate: r.private,
      cloneUrl: r.clone_url,
      description: r.description || '',
      updatedAt: r.updated_at,
      language: r.language || 'TypeScript',
    }));
  }

  /**
   * Verifies the authenticity of incoming GitHub webhook payloads using HMAC-SHA256.
   */
  static verifyWebhookSignature(payloadRaw: string, signatureHeader?: string, customSecret?: string): boolean {
    const secret = customSecret || this.WEBHOOK_SECRET;
    if (!signatureHeader || !payloadRaw) return false;

    try {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = `sha256=${hmac.update(payloadRaw).digest('hex')}`;
      return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(digest));
    } catch {
      return false;
    }
  }
}
