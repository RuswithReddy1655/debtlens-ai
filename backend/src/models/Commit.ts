import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICommitFileChange {
  filePath: string;
  additions: number;
  deletions: number;
}

export interface ICommit extends Document {
  repositoryId: Types.ObjectId;
  commitHash: string;
  authorName: string;
  authorEmail: string;
  message: string;
  committedAt: Date;
  filesChanged: ICommitFileChange[];
  isFixCommit: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommitFileChangeSchema = new Schema<ICommitFileChange>(
  {
    filePath: { type: String, required: true },
    additions: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
  },
  { _id: false }
);

const CommitSchema = new Schema<ICommit>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    commitHash: { type: String, required: true, trim: true },
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },
    message: { type: String, required: true },
    committedAt: { type: Date, required: true, index: true },
    filesChanged: [CommitFileChangeSchema],
    isFixCommit: { type: Boolean, default: false, index: true },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

CommitSchema.index({ repositoryId: 1, commitHash: 1 }, { unique: true });
CommitSchema.index({ repositoryId: 1, committedAt: -1 });

export const Commit = mongoose.model<ICommit>('Commit', CommitSchema);
