import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialScenario extends Document {
  scenarioName: string;
  analysisId: string;
  repositoryId?: string;
  selectedFilePaths: string[];
  hourlyRate: number;
  currency: string;
  remediationEffectiveness: number;
  estimatedRefactoringHours: number;
  estimatedInvestment: number;
  estimatedAnnualSavings: number;
  twoYearNetSavings: number;
  roiPercentage: number;
  paybackPeriodMonths: number | null;
  residualAnnualImpact: number;
  projectedResidualDebtScore: number;
  isViable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialScenarioSchema = new Schema<IFinancialScenario>(
  {
    scenarioName: { type: String, required: true },
    analysisId: { type: String, required: true, index: true },
    repositoryId: { type: String, index: true },
    selectedFilePaths: [{ type: String }],
    hourlyRate: { type: Number, required: true, default: 2000 },
    currency: { type: String, default: 'INR' },
    remediationEffectiveness: { type: Number, default: 0.65 },
    estimatedRefactoringHours: { type: Number, default: 0 },
    estimatedInvestment: { type: Number, default: 0 },
    estimatedAnnualSavings: { type: Number, default: 0 },
    twoYearNetSavings: { type: Number, default: 0 },
    roiPercentage: { type: Number, default: 0 },
    paybackPeriodMonths: { type: Number, default: null },
    residualAnnualImpact: { type: Number, default: 0 },
    projectedResidualDebtScore: { type: Number, default: 50 },
    isViable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FinancialScenarioSchema.index({ analysisId: 1, createdAt: -1 });

export const FinancialScenario = mongoose.model<IFinancialScenario>(
  'FinancialScenario',
  FinancialScenarioSchema
);
