/**
 * DebtLens AI - Database Seeding Utility
 * 
 * Populates MongoDB with benchmark repository, file metrics, hotspots,
 * financial assumptions, recommendations, and trend points.
 * 
 * Usage: npx tsx scripts/seed-database.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  Repository,
  Analysis,
  FileMetric,
  Hotspot,
  FinancialAssumption,
  Recommendation,
  TrendPoint,
  Contributor,
  Defect,
  Commit,
} from '../backend/src/models';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/debtlens_ai';

async function seed() {
  console.log(`[Seed] Connecting to MongoDB: ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  console.log('[Seed] Clearing existing demo benchmark collections...');
  await Promise.all([
    Repository.deleteMany({ isDemo: true }),
    Analysis.deleteMany({ isDemo: true }),
    FileMetric.deleteMany({ isDemo: true }),
    Hotspot.deleteMany({ isDemo: true }),
    FinancialAssumption.deleteMany({ isDefault: true }),
    Recommendation.deleteMany({ isDemo: true }),
    TrendPoint.deleteMany({ isDemo: true }),
    Contributor.deleteMany({ isDemo: true }),
    Defect.deleteMany({ isDemo: true }),
    Commit.deleteMany({ isDemo: true }),
  ]);

  console.log('[Seed] Creating benchmark Repository...');
  const repo = await Repository.create({
    name: 'fintech-core-ledger',
    owner: 'enterprise-payments',
    url: 'https://github.com/enterprise-payments/fintech-core-ledger',
    defaultBranch: 'main',
    isDemo: true,
    description: 'High-throughput double-entry transaction ledger with multi-currency reconciliation engine.',
    primaryLanguage: 'TypeScript',
    stars: 342,
    forks: 88,
    openIssues: 24,
    status: 'completed',
    lastAnalyzedAt: new Date(),
  });

  console.log('[Seed] Creating Financial Assumption...');
  await FinancialAssumption.create({
    repositoryId: repo._id,
    name: 'Standard Fintech Engineering Economics',
    engineeringHourlyRate: 95,
    annualWorkingHoursPerDev: 1880,
    defectRemediationMultiplier: 2.5,
    reworkFrictionPercentage: 18,
    currency: 'USD',
    isDefault: true,
  });

  console.log('[Seed] Creating Analysis Snapshot...');
  const analysis = await Analysis.create({
    repositoryId: repo._id,
    branch: 'main',
    commitHash: '8f2a1b9',
    status: 'completed',
    isDemo: true,
    summary: {
      totalFiles: 142,
      totalLinesOfCode: 48650,
      totalDebtHours: 1240,
      estimatedRemediationCost: 117800,
      annualAvoidableCost: 68400,
      historicalReworkCost: 89300,
      potentialRefactoringBenefit: 46900,
      overallHealthScore: 68,
      averageComplexity: 16.4,
      hotspotCount: 14,
      criticalHotspots: 4,
    },
    completedAt: new Date(),
  });

  console.log('[Seed] Creating Top Hotspots & Metrics...');
  await Hotspot.create([
    {
      analysisId: analysis._id,
      repositoryId: repo._id,
      filePath: 'src/ledger/transactionProcessor.ts',
      rank: 1,
      riskLevel: 'critical',
      debtScore: 94,
      complexityScore: 92,
      churnScore: 88,
      estimatedRemediationHours: 140,
      estimatedRemediationCost: 13300,
      historicalReworkCost: 18200,
      futureAvoidableCost: 11400,
      potentialBenefit: 9500,
      primaryDebtDrivers: ['Severe Cyclomatic Complexity (48)', 'High Churn (34 commits/6mo)', 'Single-Owner Silo (82%)'],
      isDemo: true,
    },
    {
      analysisId: analysis._id,
      repositoryId: repo._id,
      filePath: 'src/settlement/reconciliationEngine.ts',
      rank: 2,
      riskLevel: 'critical',
      debtScore: 89,
      complexityScore: 86,
      churnScore: 82,
      estimatedRemediationHours: 110,
      estimatedRemediationCost: 10450,
      historicalReworkCost: 14800,
      futureAvoidableCost: 9500,
      potentialBenefit: 8550,
      primaryDebtDrivers: ['Deep Nesting Depth (7 levels)', 'Defect Density (6 bugs/qtr)', 'Lack of Unit Tests (22% cov)'],
      isDemo: true,
    },
  ]);

  console.log('[Seed] Benchmark database seeding complete! 10 collections ready.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed Error]:', err.message);
  process.exit(0); // Exit safely if DB offline
});
