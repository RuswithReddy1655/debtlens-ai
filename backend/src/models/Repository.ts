import mongoose, { Schema, Document } from 'mongoose';

export interface IRepository extends Document {
  name: string;
  owner: string;
  url: string;
  defaultBranch: string;
  isDemo: boolean;
  description?: string;
  primaryLanguage?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  totalCommits?: number;
  firstCommitAt?: Date;
  lastCommitAt?: Date;
  activeBranches?: string[];
  lastAnalyzedAt?: Date;
  status: 'idle' | 'analyzing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const RepositorySchema = new Schema<IRepository>(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    defaultBranch: { type: String, default: 'main' },
    isDemo: { type: Boolean, default: false, index: true },
    description: { type: String, default: '' },
    primaryLanguage: { type: String, default: 'TypeScript' },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    openIssues: { type: Number, default: 0 },
    totalCommits: { type: Number, default: 0 },
    firstCommitAt: { type: Date },
    lastCommitAt: { type: Date },
    activeBranches: [{ type: String }],
    lastAnalyzedAt: { type: Date },
    status: {
      type: String,
      enum: ['idle', 'analyzing', 'completed', 'failed'],
      default: 'idle',
      index: true,
    },
  },
  { timestamps: true }
);

RepositorySchema.index({ owner: 1, name: 1 }, { unique: true });

export const Repository = mongoose.model<IRepository>('Repository', RepositorySchema);
