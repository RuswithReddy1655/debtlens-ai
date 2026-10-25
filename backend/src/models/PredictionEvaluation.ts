import mongoose, { Schema, Document } from 'mongoose';

export type PredictionEvaluationMetric =
  | 'technicalDebtScore'
  | 'financialExposure'
  | 'criticalHotspots';

export interface IPredictionEvaluation extends Document {
  repositoryId: string;
  assessmentId: string;
  predictionAnalysisId: string;
  actualAnalysisId: string;
  metricName: PredictionEvaluationMetric;
  predictedValue: number;
  predictedRange: {
    low: number;
    expected: number;
    high: number;
  };
  actualValue: number;
  predictionError: number;
  absoluteError: number;
  percentageError: number;
  withinRange: boolean;
  evaluatedAt: Date;
  horizon: string;
  status: 'EVALUATED' | 'INSUFFICIENT_DATA';
  createdAt: Date;
  updatedAt: Date;
}

const PredictionEvaluationSchema = new Schema<IPredictionEvaluation>(
  {
    repositoryId: { type: String, required: true },
    assessmentId: { type: String, required: true },
    predictionAnalysisId: { type: String, required: true },
    actualAnalysisId: { type: String, required: true },
    metricName: {
      type: String,
      enum: ['technicalDebtScore', 'financialExposure', 'criticalHotspots'],
      required: true,
    },
    predictedValue: { type: Number, required: true },
    predictedRange: {
      low: { type: Number, required: true },
      expected: { type: Number, required: true },
      high: { type: Number, required: true },
    },
    actualValue: { type: Number, required: true },
    predictionError: { type: Number, required: true },
    absoluteError: { type: Number, required: true },
    percentageError: { type: Number, required: true },
    withinRange: { type: Boolean, required: true },
    evaluatedAt: { type: Date, default: Date.now },
    horizon: { type: String, default: 'NEXT_ANALYSIS' },
    status: {
      type: String,
      enum: ['EVALUATED', 'INSUFFICIENT_DATA'],
      default: 'EVALUATED',
    },
  },
  { timestamps: true }
);

PredictionEvaluationSchema.index({ repositoryId: 1, evaluatedAt: -1 });
PredictionEvaluationSchema.index({ repositoryId: 1, metricName: 1 });
PredictionEvaluationSchema.index({ assessmentId: 1 });

export const PredictionEvaluation = mongoose.model<IPredictionEvaluation>(
  'PredictionEvaluation',
  PredictionEvaluationSchema
);
