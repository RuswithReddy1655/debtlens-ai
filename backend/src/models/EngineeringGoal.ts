import mongoose, { Schema, Document } from 'mongoose';

export type GoalMetric =
  | 'CRITICAL_HOTSPOTS'
  | 'TECHNICAL_DEBT_SCORE'
  | 'ANNUAL_EXPOSURE'
  | 'HIGH_PRIORITY_DEBT'
  | 'AVERAGE_COMPLEXITY';

export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'MISSED' | 'PAUSED' | 'CANCELLED';

export interface IEngineeringGoal extends Document {
  repositoryId: string;
  title: string;
  description: string;
  metric: GoalMetric;
  targetValue: number;
  startingValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  status: GoalStatus;
  progressPercentage: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const EngineeringGoalSchema = new Schema<IEngineeringGoal>(
  {
    repositoryId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    metric: {
      type: String,
      enum: [
        'CRITICAL_HOTSPOTS',
        'TECHNICAL_DEBT_SCORE',
        'ANNUAL_EXPOSURE',
        'HIGH_PRIORITY_DEBT',
        'AVERAGE_COMPLEXITY',
      ],
      required: true,
      index: true,
    },
    targetValue: { type: Number, required: true },
    startingValue: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    unit: { type: String, default: 'pts' },
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACHIEVED', 'MISSED', 'PAUSED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    createdBy: { type: String, default: 'Engineering Lead' },
  },
  { timestamps: true }
);

EngineeringGoalSchema.index({ repositoryId: 1, status: 1 });

export const EngineeringGoal = mongoose.model<IEngineeringGoal>(
  'EngineeringGoal',
  EngineeringGoalSchema
);
