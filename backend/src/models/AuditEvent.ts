import mongoose, { Schema, Document } from 'mongoose';

export type AuditAction =
  | 'DEBT_DETECTED'
  | 'PRIORITY_CHANGED'
  | 'STATUS_CHANGED'
  | 'ASSIGNMENT_CHANGED'
  | 'GOAL_CREATED'
  | 'GOAL_UPDATED'
  | 'GOAL_ACHIEVED'
  | 'DEBT_RESOLVED'
  | 'DEBT_VERIFIED'
  | 'DEBT_REOPENED'
  | 'REPO_CONNECTED'
  | 'REPO_DISCONNECTED'
  | 'ANALYSIS_TRIGGERED'
  | 'ANALYSIS_COMPLETED'
  | 'ANALYSIS_FAILED';

export interface IAuditEvent extends Document {
  repositoryId: string;
  actorId: string;
  actorType: 'USER' | 'SYSTEM' | 'WEBHOOK' | 'SCHEDULER';
  action: AuditAction;
  targetId: string;
  targetType: 'DEBT_ITEM' | 'GOAL' | 'REPOSITORY' | 'ANALYSIS' | 'CONNECTION';
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    repositoryId: { type: String, required: true, index: true },
    actorId: { type: String, default: 'system' },
    actorType: {
      type: String,
      enum: ['USER', 'SYSTEM', 'WEBHOOK', 'SCHEDULER'],
      default: 'SYSTEM',
    },
    action: {
      type: String,
      enum: [
        'DEBT_DETECTED',
        'PRIORITY_CHANGED',
        'STATUS_CHANGED',
        'ASSIGNMENT_CHANGED',
        'GOAL_CREATED',
        'GOAL_UPDATED',
        'GOAL_ACHIEVED',
        'DEBT_RESOLVED',
        'DEBT_VERIFIED',
        'DEBT_REOPENED',
        'REPO_CONNECTED',
        'REPO_DISCONNECTED',
        'ANALYSIS_TRIGGERED',
        'ANALYSIS_COMPLETED',
        'ANALYSIS_FAILED',
      ],
      required: true,
      index: true,
    },
    targetId: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['DEBT_ITEM', 'GOAL', 'REPOSITORY', 'ANALYSIS', 'CONNECTION'],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AuditEventSchema.index({ repositoryId: 1, timestamp: -1 });

export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);
