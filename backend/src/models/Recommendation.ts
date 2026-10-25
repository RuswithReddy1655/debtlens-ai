import mongoose, { Schema, Document, Types } from 'mongoose';

export type RecommendationCategory = 'architecture' | 'refactoring' | 'testing' | 'ownership' | 'dependency';
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface IRecommendation extends Document {
  analysisId: Types.ObjectId;
  repositoryId: Types.ObjectId;
  title: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  targetFiles: string[];
  rationale: string;
  actionPlan: string[];
  estimatedEffortHours: number;
  estimatedCost: number;
  projectedAnnualSavings: number;
  roiRatio: number;
  paybackPeriodMonths: number;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis', required: true, index: true },
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['architecture', 'refactoring', 'testing', 'ownership', 'dependency'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
      index: true,
    },
    targetFiles: [{ type: String }],
    rationale: { type: String, required: true },
    actionPlan: [{ type: String }],
    estimatedEffortHours: { type: Number, required: true },
    estimatedCost: { type: Number, required: true },
    projectedAnnualSavings: { type: Number, required: true },
    roiRatio: { type: Number, required: true },
    paybackPeriodMonths: { type: Number, required: true },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

RecommendationSchema.index({ analysisId: 1, priority: 1 });
RecommendationSchema.index({ analysisId: 1, roiRatio: -1 });

export const Recommendation = mongoose.model<IRecommendation>(
  'Recommendation',
  RecommendationSchema
);
