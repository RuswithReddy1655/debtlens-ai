import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export const SAMPLE_REPO_DIR = path.resolve(__dirname, 'sample-repository');

/**
 * Initializes a deterministic Git repository fixture for integration testing.
 * Sets up known commit history, multiple contributors, complexity differentials,
 * defect-fix commit messages, and varied file churn.
 */
export function setupSampleRepository(): string {
  // If repository already exists and has .git, return path
  if (fs.existsSync(path.join(SAMPLE_REPO_DIR, '.git'))) {
    return SAMPLE_REPO_DIR;
  }

  if (fs.existsSync(SAMPLE_REPO_DIR)) {
    fs.rmSync(SAMPLE_REPO_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(SAMPLE_REPO_DIR, { recursive: true });

  const runGit = (cmd: string) => {
    execSync(cmd, {
      cwd: SAMPLE_REPO_DIR,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'Alice Dev',
        GIT_AUTHOR_EMAIL: 'alice@example.com',
        GIT_COMMITTER_NAME: 'Alice Dev',
        GIT_COMMITTER_EMAIL: 'alice@example.com',
      },
    });
  };

  // 1. Initialize git
  runGit('git init -b main');
  runGit('git config user.name "Alice Dev"');
  runGit('git config user.email "alice@example.com"');

  // 2. Commit 1: Initial project setup with clean math utils and legacy config
  const srcDir = path.join(SAMPLE_REPO_DIR, 'src');
  const utilsDir = path.join(srcDir, 'utils');
  const legacyDir = path.join(srcDir, 'legacy');
  const authDir = path.join(srcDir, 'auth');
  const servicesDir = path.join(srcDir, 'services');

  fs.mkdirSync(utilsDir, { recursive: true });
  fs.mkdirSync(legacyDir, { recursive: true });
  fs.mkdirSync(authDir, { recursive: true });
  fs.mkdirSync(servicesDir, { recursive: true });

  fs.writeFileSync(
    path.join(SAMPLE_REPO_DIR, 'README.md'),
    '# Sample Deterministic Fixture Repository\nUsed for testing DebtLens AI Phase 2 git ingestion.\n'
  );

  // Low complexity file
  fs.writeFileSync(
    path.join(utilsDir, 'math.ts'),
    `export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}
`
  );

  // Legacy file
  fs.writeFileSync(
    path.join(legacyDir, 'legacyConfig.js'),
    `// Legacy configuration module
function parseOldConfig(raw) {
  var out = {};
  if (!raw) return out;
  var parts = raw.split(';');
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split('=');
    if (kv.length === 2) {
      out[kv[0].trim()] = kv[1].trim();
    }
  }
  return out;
}

module.exports = { parseOldConfig };
`
  );

  runGit('git add .');
  runGit('git commit -m "feat: initial commit with core setup" --date "2023-01-10T10:00:00Z"');

  // 3. Commit 2: Add High Complexity Payment Processor (by Bob Engineer)
  fs.writeFileSync(
    path.join(servicesDir, 'paymentProcessor.ts'),
    `export class PaymentProcessor {
  public process(order: any, method: string, currency: string, flags: any[]): boolean {
    if (!order) {
      throw new Error("Invalid order");
    }

    if (currency === "USD") {
      if (method === "CARD") {
        if (order.amount > 10000) {
          if (flags.includes("VIP")) {
            return true;
          } else if (flags.includes("FLAGGED")) {
            return false;
          } else {
            return order.verified === true;
          }
        } else {
          return true;
        }
      } else if (method === "CRYPTO") {
        for (let i = 0; i < flags.length; i++) {
          if (flags[i] === "KYC_VERIFIED") {
            return true;
          }
        }
        return false;
      } else {
        return false;
      }
    } else if (currency === "EUR") {
      switch (method) {
        case "SEPA":
          return order.amount < 50000;
        case "CARD":
          return order.amount > 0 && order.amount < 5000;
        default:
          return false;
      }
    } else {
      return false;
    }
  }
}
`
  );

  runGit('git add .');
  execSync('git commit -m "feat: implement multi-currency payment processor" --date "2023-05-15T14:30:00Z"', {
    cwd: SAMPLE_REPO_DIR,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Bob Engineer',
      GIT_AUTHOR_EMAIL: 'bob@example.com',
      GIT_COMMITTER_NAME: 'Bob Engineer',
      GIT_COMMITTER_EMAIL: 'bob@example.com',
    },
  });

  // 4. Commit 3: Introduce auth token validator with initial implementation
  fs.writeFileSync(
    path.join(authDir, 'tokenValidator.ts'),
    `export function validateToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  return parts[0].length > 5;
}
`
  );
  runGit('git add .');
  runGit('git commit -m "feat: add JWT token validation helper" --date "2023-08-01T09:00:00Z"');

  // 5. Commit 4: Defect fix on token validator
  fs.writeFileSync(
    path.join(authDir, 'tokenValidator.ts'),
    `export function validateToken(token: string, secret?: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  if (!secret) return parts[0].length > 5;
  return parts[0].length > 5 && parts[2].includes(secret);
}
`
  );
  runGit('git add .');
  execSync('git commit -m "fix: resolve crash on null token parameter" --date "2023-09-12T11:20:00Z"', {
    cwd: SAMPLE_REPO_DIR,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Bob Engineer',
      GIT_AUTHOR_EMAIL: 'bob@example.com',
      GIT_COMMITTER_NAME: 'Bob Engineer',
      GIT_COMMITTER_EMAIL: 'bob@example.com',
    },
  });

  // 6. Commit 5: Second defect fix on token validator + patch payment processor
  fs.writeFileSync(
    path.join(authDir, 'tokenValidator.ts'),
    `export function validateToken(token: string, secret?: string, maxAgeSeconds?: number): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  if (maxAgeSeconds && maxAgeSeconds <= 0) return false;
  if (!secret) return parts[0].length > 5;
  return parts[0].length > 5 && parts[2].includes(secret);
}
`
  );
  runGit('git add .');
  runGit('git commit -m "hotfix: handle token expiration defect and signature validation" --date "2024-02-20T16:45:00Z"');

  return SAMPLE_REPO_DIR;
}
