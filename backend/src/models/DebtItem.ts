import mongoose, { Schema, Document } from 'mongoose';

export type DebtItemStatus =
  | 'DETECTED'
  | 'PRIORITIZED'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'WONT_FIX'
  | 'ACCEPTED_RISK'
  | 'REOPENED';

export type DebtPriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MONITOR';

export type VerificationResultStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'NOT_VERIFIED'
  | 'INSUFFICIENT_DATA';

export interface IDebtItem extends Document {
  repositoryId: string;
  debtItemId: string;
  filePath: string;
  symbolName: string;
  category: 'COMPLEXITY' | 'CHURN' | 'DEFECT' | 'LEGACY' | 'ARCHITECTURE';
  firstDetectedAt: Date;
  lastDetectedAt: Date;
  currentStatus: DebtItemStatus;
  priority: DebtPriorityTier;
  priorityScore: number;
  technicalRisk: number;
  financialImpact: number;
  changeFrequency: number;
  defectActivity: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';
  estimatedCost: number;
  estimatedEffort: {
    lowHours: number;
    expectedHours: number;
    highHours: number;
    formattedRange: string;
  };
  assignedTo?: string;
  targetDate?: Date;
  notes?: string;
  externalIssueUrl?: string;
  pullRequestUrl?: string;
  resolutionCommitSha?: string;
  resolutionDate?: Date;
  baselineMetrics?: {
    complexity: number;
    churn: number;
    defectFixCount: number;
    debtScore: number;
  };
  resolvedMetrics?: {
    complexity: number;
    churn: number;
    defectFixCount: number;
    debtScore: number;
  };
  verificationAnalysisId?: string;
  verificationStatus: VerificationResultStatus;
  verificationDetails?: {
    complexityReductionPct: number;
    hotspotScoreDelta: number;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DebtItemSchema = new Schema<IDebtItem>(
  {
    repositoryId: { type: String, required: true, index: true },
    debtItemId: { type: String, required: true, index: true },
    filePath: { type: String, required: true, index: true },
    symbolName: { type: String, default: 'module' },
    category: {
      type: String,
      enum: ['COMPLEXITY', 'CHURN', 'DEFECT', 'LEGACY', 'ARCHITECTURE'],
      default: 'COMPLEXITY',
    },
    firstDetectedAt: { type: Date, default: Date.now },
    lastDetectedAt: { type: Date, default: Date.now },
    currentStatus: {
      type: String,
      enum: [
        'DETECTED',
        'PRIORITIZED',
        'PLANNED',
        'IN_PROGRESS',
        'RESOLVED',
        'VERIFIED',
        'WONT_FIX',
        'ACCEPTED_RISK',
        'REOPENED',
      ],
      default: 'DETECTED',
      index: true,
    },
    priority: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MONITOR'],
      default: 'MEDIUM',
      index: true,
    },
    priorityScore: { type: Number, default: 50 },
    technicalRisk: { type: Number, default: 50 },
    financialImpact: { type: Number, default: 0 },
    changeFrequency: { type: Number, default: 0 },
    defectActivity: { type: Number, default: 0 },
    confidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT DATA'],
      default: 'MEDIUM',
    },
    estimatedCost: { type: Number, default: 0 },
    estimatedEffort: {
      lowHours: { type: Number, default: 8 },
      expectedHours: { type: Number, default: 16 },
      highHours: { type: Number, default: 24 },
      formattedRange: { type: String, default: '8–24 hrs' },
    },
    assignedTo: { type: String },
    targetDate: { type: Date },
    notes: { type: String },
    externalIssueUrl: { type: String },
    pullRequestUrl: { type: String },
    resolutionCommitSha: { type: String },
    resolutionDate: { type: Date },
    baselineMetrics: {
      complexity: { type: Number, default: 0 },
      churn: { type: Number, default: 0 },
      defectFixCount: { type: Number, default: 0 },
      debtScore: { type: Number, default: 0 },
    },
    resolvedMetrics: {
      complexity: { type: Number },
      churn: { type: Number },
      defectFixCount: { type: Number },
      debtScore: { type: Number },
    },
    verificationAnalysisId: { type: String },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'PARTIALLY_VERIFIED', 'NOT_VERIFIED', 'INSUFFICIENT_DATA'],
      default: 'PENDING',
      index: true,
    },
    verificationDetails: {
      complexityReductionPct: { type: Number },
      hotspotScoreDelta: { type: Number },
      message: { type: String },
    },
  },
  { timestamps: true }
);

DebtItemSchema.index({ repositoryId: 1, debtItemId: 1 }, { unique: true });
DebtItemSchema.index({ repositoryId: 1, currentStatus: 1 });
DebtItemSchema.index({ repositoryId: 1, priority: 1 });

export const DebtItem = mongoose.model<IDebtItem>('DebtItem', DebtItemSchema);
