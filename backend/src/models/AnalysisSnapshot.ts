import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysisSnapshot extends Document {
  analysisId: string;
  repositoryId: string;
  commitSha: string;
  branch: string;
  timestamp: Date;
  linesOfCode: number;
  commitCount: number;
  totalChurn: number;
  codeAge: number;
  complexity: number;
  maxNesting: number;
  hotspotCount: number;
  criticalHotspotCount: number;
  technicalDebtScore: number;
  financialExposure: number;
  maintenanceFriction: number;
  defectFixBurden: number;
  changeFriction: number;
  legacyRisk: number;
  priorityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    monitor: number;
  };
  telemetryConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSnapshotSchema = new Schema<IAnalysisSnapshot>(
  {
    analysisId: { type: String, required: true, index: true },
    repositoryId: { type: String, required: true, index: true },
    commitSha: { type: String, required: true, default: 'HEAD' },
    branch: { type: String, default: 'main' },
    timestamp: { type: Date, default: Date.now, index: true },
    linesOfCode: { type: Number, default: 0 },
    commitCount: { type: Number, default: 0 },
    totalChurn: { type: Number, default: 0 },
    codeAge: { type: Number, default: 0 },
    complexity: { type: Number, default: 0 },
    maxNesting: { type: Number, default: 0 },
    hotspotCount: { type: Number, default: 0 },
    criticalHotspotCount: { type: Number, default: 0 },
    technicalDebtScore: { type: Number, default: 50 },
    financialExposure: { type: Number, default: 0 },
    maintenanceFriction: { type: Number, default: 0 },
    defectFixBurden: { type: Number, default: 0 },
    changeFriction: { type: Number, default: 0 },
    legacyRisk: { type: Number, default: 0 },
    priorityDistribution: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      monitor: { type: Number, default: 0 },
    },
    telemetryConfidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT DATA'],
      default: 'MEDIUM',
    },
  },
  { timestamps: true }
);

AnalysisSnapshotSchema.index({ repositoryId: 1, timestamp: -1 });

export const AnalysisSnapshot = mongoose.model<IAnalysisSnapshot>(
  'AnalysisSnapshot',
  AnalysisSnapshotSchema
);
