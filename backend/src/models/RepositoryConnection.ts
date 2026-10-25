import mongoose, { Schema, Document } from 'mongoose';

export type ConnectionStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'AUTH_REQUIRED'
  | 'ERROR'
  | 'ANALYSIS_PENDING';

export type AnalysisFrequency =
  | 'MANUAL'
  | 'DAILY'
  | 'WEEKLY'
  | 'AFTER_PUSH'
  | 'AFTER_MERGE';

export interface IRepositoryConnection extends Document {
  userId: string;
  organizationId?: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'local';
  providerRepositoryId: string;
  repositoryId: Schema.Types.ObjectId;
  repositoryName: string;
  owner: string;
  defaultBranch: string;
  visibility: 'public' | 'private';
  installationId?: string;
  connectionStatus: ConnectionStatus;
  lastAnalysisId?: string;
  lastAnalysisAt?: Date;
  nextAnalysisAt?: Date;
  analysisFrequency: AnalysisFrequency;
  webhookEnabled: boolean;
  webhookSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RepositoryConnectionSchema = new Schema<IRepositoryConnection>(
  {
    userId: { type: String, required: true, default: 'system-user', index: true },
    organizationId: { type: String, index: true },
    provider: {
      type: String,
      enum: ['github', 'gitlab', 'bitbucket', 'local'],
      default: 'github',
      required: true,
    },
    providerRepositoryId: { type: String, required: true, index: true },
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    repositoryName: { type: String, required: true },
    owner: { type: String, required: true },
    defaultBranch: { type: String, default: 'main' },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    installationId: { type: String },
    connectionStatus: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED', 'AUTH_REQUIRED', 'ERROR', 'ANALYSIS_PENDING'],
      default: 'CONNECTED',
      index: true,
    },
    lastAnalysisId: { type: String },
    lastAnalysisAt: { type: Date },
    nextAnalysisAt: { type: Date },
    analysisFrequency: {
      type: String,
      enum: ['MANUAL', 'DAILY', 'WEEKLY', 'AFTER_PUSH', 'AFTER_MERGE'],
      default: 'MANUAL',
    },
    webhookEnabled: { type: Boolean, default: false },
    webhookSecret: { type: String, select: false },
  },
  { timestamps: true }
);

RepositoryConnectionSchema.index({ provider: 1, providerRepositoryId: 1 }, { unique: true });

export const RepositoryConnection = mongoose.model<IRepositoryConnection>(
  'RepositoryConnection',
  RepositoryConnectionSchema
);
