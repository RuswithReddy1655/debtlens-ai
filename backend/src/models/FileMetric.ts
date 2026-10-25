import mongoose, { Schema, Document, Types } from 'mongoose';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type FileAnalysisStatus = 'SUPPORTED' | 'PARTIAL' | 'UNSUPPORTED';

export interface IFileMetric extends Document {
  analysisId: Types.ObjectId;
  repositoryId: Types.ObjectId;
  filePath: string;
  directory: string;
  language: string;

  // Code volume metrics
  linesOfCode: number;
  blankLines: number;
  commentLines: number;
  codeLines: number;

  // AST / structure metrics
  functionCount: number;
  classCount: number;
  importCount: number;
  exportCount: number;

  // Complexity metrics
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepthMax: number;

  // Churn metrics
  churnCount: number;
  linesAdded: number;
  linesDeleted: number;
  totalChurn: number;
  changesPerMonth: number;

  // Defect metrics
  defectCount: number;
  defectFixCommitCount: number;
  defectFixFrequency: number;

  // Ownership metrics
  contributorCount: number;
  ownershipEntropy: number; // 0 - 1
  primaryContributor: string;
  ownershipPercentage: number;

  // Age metrics
  firstSeenAt?: Date;
  lastModifiedAt: Date;
  ageInDays: number;
  daysSinceLastChange: number;
  isLegacy: boolean;

  // Debt & Risk scoring
  duplicationPercentage: number;
  testCoveragePercentage: number;
  debtScore: number; // 0 - 100
  debtHours: number;
  estimatedRemediationCost: number;
  riskCategory: RiskLevel;
  analysisStatus: FileAnalysisStatus;
  reason?: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileMetricSchema = new Schema<IFileMetric>(
  {
    analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis', required: true, index: true },
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    filePath: { type: String, required: true, index: true },
    directory: { type: String, required: true, index: true },
    language: { type: String, default: 'TypeScript' },

    linesOfCode: { type: Number, default: 0 },
    blankLines: { type: Number, default: 0 },
    commentLines: { type: Number, default: 0 },
    codeLines: { type: Number, default: 0 },

    functionCount: { type: Number, default: 0 },
    classCount: { type: Number, default: 0 },
    importCount: { type: Number, default: 0 },
    exportCount: { type: Number, default: 0 },

    cyclomaticComplexity: { type: Number, default: 0 },
    cognitiveComplexity: { type: Number, default: 0 },
    nestingDepthMax: { type: Number, default: 0 },

    churnCount: { type: Number, default: 0 },
    linesAdded: { type: Number, default: 0 },
    linesDeleted: { type: Number, default: 0 },
    totalChurn: { type: Number, default: 0 },
    changesPerMonth: { type: Number, default: 0 },

    defectCount: { type: Number, default: 0 },
    defectFixCommitCount: { type: Number, default: 0 },
    defectFixFrequency: { type: Number, default: 0 },

    contributorCount: { type: Number, default: 1 },
    ownershipEntropy: { type: Number, default: 0 },
    primaryContributor: { type: String, default: 'Unknown' },
    ownershipPercentage: { type: Number, default: 100 },

    firstSeenAt: { type: Date },
    lastModifiedAt: { type: Date, default: Date.now },
    ageInDays: { type: Number, default: 0 },
    daysSinceLastChange: { type: Number, default: 0 },
    isLegacy: { type: Boolean, default: false },

    duplicationPercentage: { type: Number, default: 0 },
    testCoveragePercentage: { type: Number, default: 0 },
    debtScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    debtHours: { type: Number, default: 0 },
    estimatedRemediationCost: { type: Number, default: 0 },
    riskCategory: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    analysisStatus: {
      type: String,
      enum: ['SUPPORTED', 'PARTIAL', 'UNSUPPORTED'],
      default: 'SUPPORTED',
    },
    reason: { type: String },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

FileMetricSchema.index({ analysisId: 1, debtScore: -1 });
FileMetricSchema.index({ analysisId: 1, filePath: 1 });
FileMetricSchema.index({ analysisId: 1, riskCategory: 1 });

export const FileMetric = mongoose.model<IFileMetric>('FileMetric', FileMetricSchema);
