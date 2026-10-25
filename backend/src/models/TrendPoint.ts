import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITrendPoint extends Document {
  repositoryId: Types.ObjectId;
  analysisId?: Types.ObjectId;
  date: Date;
  commitHash: string;
  totalDebtHours: number;
  healthScore: number;
  remediationCost: number;
  reworkHours: number;
  avoidableAnnualCost: number;
  linesOfCode: number;
  hotspotCount: number;
  criticalHotspots: number;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrendPointSchema = new Schema<ITrendPoint>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis' },
    date: { type: Date, required: true, index: true },
    commitHash: { type: String, required: true },
    totalDebtHours: { type: Number, required: true },
    healthScore: { type: Number, required: true },
    remediationCost: { type: Number, required: true },
    reworkHours: { type: Number, required: true },
    avoidableAnnualCost: { type: Number, default: 0 },
    linesOfCode: { type: Number, required: true },
    hotspotCount: { type: Number, required: true },
    criticalHotspots: { type: Number, required: true },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

TrendPointSchema.index({ repositoryId: 1, date: 1 });

export const TrendPoint = mongoose.model<ITrendPoint>('TrendPoint', TrendPointSchema);
