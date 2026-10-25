import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigin: string;
  mongoUri: string;
  mongoDebug: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  demoMode: boolean;

  // Real Git Ingestion & Analysis Resource Limits (Phase 2)
  maxRepoSizeMb: number;
  maxAnalysisFiles: number;
  maxFileSizeMb: number;
  maxCommits: number;
  gitCloneTimeoutMs: number;
  analysisTimeoutMs: number;
  analysisWorkspaceDir: string;
  allowLocalFixtureRepos: boolean;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/debtlens_ai',
  mongoDebug: process.env.MONGODB_DEBUG === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev_insecure_jwt_secret_change_in_production_32char',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  demoMode: process.env.NODE_ENV === 'production'
    ? process.env.DEMO_MODE === 'true'
    : process.env.DEMO_MODE !== 'false',

  maxRepoSizeMb: parseInt(process.env.MAX_REPOSITORY_SIZE_MB || '250', 10),
  maxAnalysisFiles: parseInt(process.env.MAX_ANALYSIS_FILES || '5000', 10),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '2', 10),
  maxCommits: parseInt(process.env.MAX_COMMITS || '1000', 10),
  gitCloneTimeoutMs: parseInt(process.env.GIT_CLONE_TIMEOUT_MS || '60000', 10),
  analysisTimeoutMs: parseInt(process.env.ANALYSIS_TIMEOUT_MS || '180000', 10),
  analysisWorkspaceDir: process.env.ANALYSIS_WORKSPACE_DIR
    ? path.resolve(process.env.ANALYSIS_WORKSPACE_DIR)
    : path.resolve(__dirname, '../../.analysis-workspaces'),
  allowLocalFixtureRepos: process.env.ALLOW_LOCAL_FIXTURE_REPOS === 'true' || process.env.NODE_ENV === 'test',
};

/**
 * Validates mandatory environment variables when operating in production mode.
 * Fails safely and immediately on startup if secrets are missing or insecure.
 */
export const validateProductionConfig = (): void => {
  if (config.nodeEnv !== 'production') return;

  const errors: string[] = [];

  // 1. Mandatory JWT Secret validation
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'dev_insecure_jwt_secret_change_in_production_32char' ||
    process.env.JWT_SECRET.length < 32
  ) {
    errors.push('JWT_SECRET must be configured with at least 32 characters of high-entropy randomness in production.');
  }

  // 2. Mandatory CORS Origin validation
  if (
    !process.env.CORS_ORIGIN ||
    process.env.CORS_ORIGIN.trim() === '*' ||
    process.env.CORS_ORIGIN.includes('localhost') ||
    process.env.CORS_ORIGIN.includes('127.0.0.1')
  ) {
    errors.push('CORS_ORIGIN must specify explicit production origin(s) without wildcards or localhost.');
  }

  // 3. Mandatory MongoDB URI validation
  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI must be provided in production.');
  }

  if (errors.length > 0) {
    console.error('================================================================');
    console.error('[FATAL CONFIGURATION ERROR] Production environment validation failed:');
    errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
    console.error('================================================================');
    throw new Error(`Production environment validation failed: ${errors.join('; ')}`);
  }
};

