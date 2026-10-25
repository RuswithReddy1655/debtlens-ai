import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFinancialAssumption extends Document {
  repositoryId?: Types.ObjectId;
  name: string;
  engineeringHourlyRate: number; // e.g. 95 USD/hr
  annualWorkingHoursPerDev: number; // e.g. 1880 hrs/year
  defectRemediationMultiplier: number; // multiplier for defect remediation cost vs standard
  reworkFrictionPercentage: number; // % of time lost in high-churn/high-complexity files
  futureCostProjectionYears: number; // e.g. 1 year projection
  currency: string;
  isDefault: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialAssumptionSchema = new Schema<IFinancialAssumption>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', index: true },
    name: { type: String, required: true, default: 'Standard Engineering Economics' },
    engineeringHourlyRate: { type: Number, required: true, default: 95 },
    annualWorkingHoursPerDev: { type: Number, required: true, default: 1880 },
    defectRemediationMultiplier: { type: Number, required: true, default: 2.5 },
    reworkFrictionPercentage: { type: Number, required: true, default: 18 },
    futureCostProjectionYears: { type: Number, required: true, default: 1.0 },
    currency: { type: String, default: 'USD' },
    isDefault: { type: Boolean, default: true, index: true },
    notes: { type: String, default: 'Default calibrated financial assumptions for technical debt quantification.' },
  },
  { timestamps: true }
);

FinancialAssumptionSchema.index({ repositoryId: 1, isDefault: 1 });

export const FinancialAssumption = mongoose.model<IFinancialAssumption>(
  'FinancialAssumption',
  FinancialAssumptionSchema
);
