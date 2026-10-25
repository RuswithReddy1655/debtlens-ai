import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContributor extends Document {
  repositoryId: Types.ObjectId;
  authorName: string;
  authorEmail: string;
  totalCommits: number;
  linesAdded: number;
  linesDeleted: number;
  ownedFilesCount: number;
  primaryLanguages: string[];
  firstCommitAt: Date;
  lastCommitAt: Date;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContributorSchema = new Schema<IContributor>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },
    totalCommits: { type: Number, default: 0 },
    linesAdded: { type: Number, default: 0 },
    linesDeleted: { type: Number, default: 0 },
    ownedFilesCount: { type: Number, default: 0 },
    primaryLanguages: [{ type: String }],
    firstCommitAt: { type: Date },
    lastCommitAt: { type: Date },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ContributorSchema.index({ repositoryId: 1, authorEmail: 1 }, { unique: true });

export const Contributor = mongoose.model<IContributor>('Contributor', ContributorSchema);
