import mongoose, { Schema, Document, Types } from 'mongoose';
import { RiskLevel } from './FileMetric';

export interface IHotspot extends Document {
  analysisId: Types.ObjectId;
  repositoryId: Types.ObjectId;
  fileMetricId?: Types.ObjectId;
  filePath: string;
  rank: number;
  riskLevel: RiskLevel;
  complexityScore: number;
  churnScore: number;
  defectDensity: number;
  defectFixCount: number;
  changeFrequency: number;
  debtScore: number;
  estimatedRemediationHours: number;
  estimatedRemediationCost: number;
  historicalReworkCost: number;
  futureAvoidableCost: number;
  potentialBenefit: number;
  primaryDebtDrivers: string[];
  reason: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HotspotSchema = new Schema<IHotspot>(
  {
    analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis', required: true, index: true },
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    fileMetricId: { type: Schema.Types.ObjectId, ref: 'FileMetric' },
    filePath: { type: String, required: true },
    rank: { type: Number, required: true, index: true },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    complexityScore: { type: Number, required: true },
    churnScore: { type: Number, required: true },
    defectDensity: { type: Number, default: 0 },
    defectFixCount: { type: Number, default: 0 },
    changeFrequency: { type: Number, default: 0 },
    debtScore: { type: Number, required: true },
    estimatedRemediationHours: { type: Number, required: true },
    estimatedRemediationCost: { type: Number, required: true },
    historicalReworkCost: { type: Number, required: true },
    futureAvoidableCost: { type: Number, required: true },
    potentialBenefit: { type: Number, default: 0 },
    primaryDebtDrivers: [{ type: String }],
    reason: { type: String, default: 'High complexity and modification churn intersection' },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

HotspotSchema.index({ analysisId: 1, rank: 1 });
HotspotSchema.index({ analysisId: 1, riskLevel: 1 });

export const Hotspot = mongoose.model<IHotspot>('Hotspot', HotspotSchema);
