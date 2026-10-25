import mongoose, { Schema, Document } from 'mongoose';

export type AlertType =
  | 'CRITICAL_HOTSPOT_INCREASED'
  | 'DEBT_SCORE_INCREASED'
  | 'EXPOSURE_INCREASED'
  | 'NEW_CRITICAL_DEBT'
  | 'DEBT_REOPENED'
  | 'GOAL_AT_RISK'
  | 'GOAL_ACHIEVED'
  | 'ANALYSIS_FAILED'
  | 'CONNECTION_EXPIRED'
  | 'PREDICTED_CRITICAL_HOTSPOT'
  | 'ACCELERATING_DEBT'
  | 'FORECASTED_EXPOSURE_INCREASE'
  | 'PREDICTED_GOAL_MISS'
  | 'RISK_ESCALATION';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export type AlertStatus = 'UNREAD' | 'READ' | 'RESOLVED' | 'DISMISSED';

export interface IEngineeringAlert extends Document {
  repositoryId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metric?: string;
  previousValue?: number;
  currentValue?: number;
  threshold?: number;
  status: AlertStatus;
  createdAt: Date;
  resolvedAt?: Date;
  updatedAt: Date;
}

const EngineeringAlertSchema = new Schema<IEngineeringAlert>(
  {
    repositoryId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'CRITICAL_HOTSPOT_INCREASED',
        'DEBT_SCORE_INCREASED',
        'EXPOSURE_INCREASED',
        'NEW_CRITICAL_DEBT',
        'DEBT_REOPENED',
        'GOAL_AT_RISK',
        'GOAL_ACHIEVED',
        'ANALYSIS_FAILED',
        'CONNECTION_EXPIRED',
        'PREDICTED_CRITICAL_HOTSPOT',
        'ACCELERATING_DEBT',
        'FORECASTED_EXPOSURE_INCREASE',
        'PREDICTED_GOAL_MISS',
        'RISK_ESCALATION',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'],
      default: 'MEDIUM',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metric: { type: String },
    previousValue: { type: Number },
    currentValue: { type: Number },
    threshold: { type: Number },
    status: {
      type: String,
      enum: ['UNREAD', 'READ', 'RESOLVED', 'DISMISSED'],
      default: 'UNREAD',
      index: true,
    },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

EngineeringAlertSchema.index({ repositoryId: 1, status: 1, createdAt: -1 });

export const EngineeringAlert = mongoose.model<IEngineeringAlert>(
  'EngineeringAlert',
  EngineeringAlertSchema
);
