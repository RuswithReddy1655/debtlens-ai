import mongoose, { Schema, Document, Types } from 'mongoose';

export type DefectSeverity = 'critical' | 'major' | 'minor' | 'trivial';

export interface IDefect extends Document {
  repositoryId: Types.ObjectId;
  analysisId?: Types.ObjectId;
  externalId: string; // e.g. "BUG-104" or "GH-42"
  title: string;
  affectedFiles: string[];
  severity: DefectSeverity;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reportedAt: Date;
  resolvedAt?: Date;
  reworkTimeHours: number;
  rootCauseCategory?: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DefectSchema = new Schema<IDefect>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis' },
    externalId: { type: String, required: true },
    title: { type: String, required: true },
    affectedFiles: [{ type: String }],
    severity: {
      type: String,
      enum: ['critical', 'major', 'minor', 'trivial'],
      default: 'minor',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'resolved',
      index: true,
    },
    reportedAt: { type: Date, default: Date.now, index: true },
    resolvedAt: { type: Date },
    reworkTimeHours: { type: Number, default: 4 },
    rootCauseCategory: { type: String, default: 'code_complexity' },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

DefectSchema.index({ repositoryId: 1, reportedAt: -1 });

export const Defect = mongoose.model<IDefect>('Defect', DefectSchema);
