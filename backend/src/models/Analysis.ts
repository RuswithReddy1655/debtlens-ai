import mongoose, { Schema, Document, Types } from 'mongoose';

export type AnalysisStatus =
  | 'queued'
  | 'cloning'
  | 'analyzing'
  | 'calculating'
  | 'persisting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface IAnalysisSummary {
  totalFiles: number;
  totalLinesOfCode: number;
  totalDebtHours: number;
  estimatedRemediationCost: number;
  annualAvoidableCost: number;
  historicalReworkCost: number;
  potentialRefactoringBenefit: number;
  overallHealthScore: number; // 0 - 100
  averageComplexity: number;
  hotspotCount: number;
  criticalHotspots: number;
  filesAnalyzed?: number;
  commitsAnalyzed?: number;
}

export interface IAnalysis extends Document {
  repositoryId: Types.ObjectId;
  branch: string;
  commitHash: string;
  status: AnalysisStatus;
  progress: number; // 0 to 100
  currentStage: string;
  isDemo: boolean;
  summary: IAnalysisSummary;
  filesDiscovered: number;
  filesAnalyzed: number;
  commitsAnalyzed: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSummarySchema = new Schema<IAnalysisSummary>(
  {
    totalFiles: { type: Number, default: 0 },
    totalLinesOfCode: { type: Number, default: 0 },
    totalDebtHours: { type: Number, default: 0 },
    estimatedRemediationCost: { type: Number, default: 0 },
    annualAvoidableCost: { type: Number, default: 0 },
    historicalReworkCost: { type: Number, default: 0 },
    potentialRefactoringBenefit: { type: Number, default: 0 },
    overallHealthScore: { type: Number, default: 75, min: 0, max: 100 },
    averageComplexity: { type: Number, default: 0 },
    hotspotCount: { type: Number, default: 0 },
    criticalHotspots: { type: Number, default: 0 },
    filesAnalyzed: { type: Number, default: 0 },
    commitsAnalyzed: { type: Number, default: 0 },
  },
  { _id: false }
);

const AnalysisSchema = new Schema<IAnalysis>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    branch: { type: String, required: true },
    commitHash: { type: String, required: true, default: 'HEAD' },
    status: {
      type: String,
      enum: ['queued', 'cloning', 'analyzing', 'calculating', 'persisting', 'completed', 'failed', 'cancelled'],
      default: 'queued',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    currentStage: { type: String, default: 'Queued' },
    isDemo: { type: Boolean, default: false, index: true },
    summary: { type: AnalysisSummarySchema, default: () => ({}) },
    filesDiscovered: { type: Number, default: 0 },
    filesAnalyzed: { type: Number, default: 0 },
    commitsAnalyzed: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

AnalysisSchema.index({ repositoryId: 1, createdAt: -1 });
AnalysisSchema.index({ status: 1 });

export const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
