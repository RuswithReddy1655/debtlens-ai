import mongoose, { Schema, Document } from 'mongoose';

export type ForecastHorizon = 'NEXT_ANALYSIS' | 'SHORT_TERM' | 'MEDIUM_TERM';
export type PredictiveRiskTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'STABLE' | 'INSUFFICIENT_DATA';
export type PredictiveTrend = 'IMPROVING' | 'STABLE' | 'WORSENING' | 'ACCELERATING' | 'DECELERATING' | 'INSUFFICIENT_DATA';
export type PredictionConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';

export interface NumericForecastRange {
  low: number;
  expected: number;
  high: number;
}

export interface FinancialForecastRange extends NumericForecastRange {
  currency: string;
  formattedRange: string;
}

export interface IPredictedHotspot {
  filePath: string;
  currentRisk: string;
  predictedRisk: string;
  riskTrend: string;
  confidence: string;
  primaryDrivers: string[];
  complexityGrowthPct: number;
  churnGrowthPct: number;
  defectActivityCount: number;
  financialExposure: number;
  recommendedAction: string;
}

export interface IFileRiskForecast {
  filePath: string;
  currentRisk: string;
  predictedRisk: string;
  riskDelta: number;
  confidence: string;
  isDeterioratingRapidly: boolean;
}

export interface IPredictiveRiskDriver {
  feature: string;
  value: string | number;
  weight: number;
  contribution: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
}

export interface IPredictiveAction {
  actionId: string;
  target: string;
  recommendation: string;
  why: string[];
  estimatedEffort: {
    lowHours: number;
    expectedHours: number;
    highHours: number;
    formatted: string;
  };
  expectedOutcome: string;
  confidence: string;
  riskDrivers: IPredictiveRiskDriver[];
  feedback?: 'HELPFUL' | 'NOT_HELPFUL' | 'NOT_APPLICABLE' | null;
}

export interface IGoalForecast {
  goalId: string;
  title: string;
  metric: string;
  currentProgress: number;
  requiredProgress: number;
  historicalVelocity: number;
  forecastedValue: number;
  status: 'ON TRACK' | 'AT RISK' | 'LIKELY TO MISS' | 'ACHIEVABLE' | 'ACHIEVED' | 'INSUFFICIENT DATA';
  rationale: string;
}

export interface IWhatIfForecastScenario {
  scenarioName: string;
  description: string;
  forecastedExposure: number;
  exposureRange: NumericForecastRange;
  modeledDifference: number;
  formattedDifference: string;
  modeledRiskLevel: string;
  remediationEffortHours: number;
}

export interface IPredictiveAssessment extends Document {
  repositoryId: string;
  analysisId: string;
  generatedAt: Date;
  forecastHorizon: ForecastHorizon;
  modelVersion: string;
  currentDebtScore: number;
  predictedDebtScore: NumericForecastRange;
  currentFinancialExposure: number;
  predictedFinancialExposure: FinancialForecastRange;
  currentCriticalHotspots: number;
  predictedCriticalHotspots: NumericForecastRange;
  riskLevel: PredictiveRiskTier;
  riskScore: number;
  riskTrend: PredictiveTrend;
  confidence: PredictionConfidenceLevel;
  confidenceFactors: {
    historicalSnapshotsCount: number;
    dataCompleteness: number;
    metricStability: number;
    gitHistoryQuality: string;
    reasons: string[];
  };
  costOfDoingNothing: {
    currentAnnualExposure: number;
    forecastedAnnualExposure: number;
    potentialIncrease: number;
    currency: string;
    formattedPotentialIncrease: string;
    rationale: string;
  };
  featureSnapshot: Record<string, any>;
  predictionTrace: {
    modelVersion: string;
    inputSnapshotIds: string[];
    featureValues: Record<string, number | string>;
    calculationMethod: string;
    weights: Record<string, number>;
    thresholds: Record<string, number>;
    confidence: string;
    generatedAt: Date;
  };
  predictedHotspots: IPredictedHotspot[];
  fileLevelRiskForecasts: IFileRiskForecast[];
  recommendedActions: IPredictiveAction[];
  goalForecasts: IGoalForecast[];
  whatIfScenarios: IWhatIfForecastScenario[];
  createdAt: Date;
  updatedAt: Date;
}

const PredictiveAssessmentSchema = new Schema<IPredictiveAssessment>(
  {
    repositoryId: { type: String, required: true },
    analysisId: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    forecastHorizon: {
      type: String,
      enum: ['NEXT_ANALYSIS', 'SHORT_TERM', 'MEDIUM_TERM'],
      default: 'NEXT_ANALYSIS',
    },
    modelVersion: { type: String, required: true, default: 'predictive-risk-v1' },
    currentDebtScore: { type: Number, default: 0 },
    predictedDebtScore: {
      low: { type: Number, default: 0 },
      expected: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
    },
    currentFinancialExposure: { type: Number, default: 0 },
    predictedFinancialExposure: {
      low: { type: Number, default: 0 },
      expected: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      formattedRange: { type: String, default: '₹0' },
    },
    currentCriticalHotspots: { type: Number, default: 0 },
    predictedCriticalHotspots: {
      low: { type: Number, default: 0 },
      expected: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
    },
    riskLevel: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'STABLE', 'INSUFFICIENT_DATA'],
      default: 'INSUFFICIENT_DATA',
    },
    riskScore: { type: Number, default: 0 },
    riskTrend: {
      type: String,
      enum: ['IMPROVING', 'STABLE', 'WORSENING', 'ACCELERATING', 'DECELERATING', 'INSUFFICIENT_DATA'],
      default: 'INSUFFICIENT_DATA',
    },
    confidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT DATA'],
      default: 'INSUFFICIENT DATA',
    },
    confidenceFactors: {
      historicalSnapshotsCount: { type: Number, default: 0 },
      dataCompleteness: { type: Number, default: 0 },
      metricStability: { type: Number, default: 0 },
      gitHistoryQuality: { type: String, default: 'UNKNOWN' },
      reasons: [{ type: String }],
    },
    costOfDoingNothing: {
      currentAnnualExposure: { type: Number, default: 0 },
      forecastedAnnualExposure: { type: Number, default: 0 },
      potentialIncrease: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      formattedPotentialIncrease: { type: String, default: '₹0' },
      rationale: { type: String, default: '' },
    },
    featureSnapshot: { type: Schema.Types.Mixed, default: {} },
    predictionTrace: {
      modelVersion: { type: String, default: 'predictive-risk-v1' },
      inputSnapshotIds: [{ type: String }],
      featureValues: { type: Schema.Types.Mixed, default: {} },
      calculationMethod: { type: String, default: 'Weighted Trend Extrapolation' },
      weights: { type: Schema.Types.Mixed, default: {} },
      thresholds: { type: Schema.Types.Mixed, default: {} },
      confidence: { type: String, default: 'LOW' },
      generatedAt: { type: Date, default: Date.now },
    },
    predictedHotspots: [
      {
        filePath: { type: String },
        currentRisk: { type: String },
        predictedRisk: { type: String },
        riskTrend: { type: String },
        confidence: { type: String },
        primaryDrivers: [{ type: String }],
        complexityGrowthPct: { type: Number },
        churnGrowthPct: { type: Number },
        defectActivityCount: { type: Number },
        financialExposure: { type: Number },
        recommendedAction: { type: String },
      },
    ],
    fileLevelRiskForecasts: [
      {
        filePath: { type: String },
        currentRisk: { type: String },
        predictedRisk: { type: String },
        riskDelta: { type: Number },
        confidence: { type: String },
        isDeterioratingRapidly: { type: Boolean },
      },
    ],
    recommendedActions: [
      {
        actionId: { type: String },
        target: { type: String },
        recommendation: { type: String },
        why: [{ type: String }],
        estimatedEffort: {
          lowHours: { type: Number },
          expectedHours: { type: Number },
          highHours: { type: Number },
          formatted: { type: String },
        },
        expectedOutcome: { type: String },
        confidence: { type: String },
        riskDrivers: [
          {
            feature: { type: String },
            value: { type: Schema.Types.Mixed },
            weight: { type: Number },
            contribution: { type: Number },
            direction: { type: String, enum: ['UP', 'DOWN', 'NEUTRAL'] },
          },
        ],
        feedback: {
          type: String,
          enum: ['HELPFUL', 'NOT_HELPFUL', 'NOT_APPLICABLE', null],
          default: null,
        },
      },
    ],
    goalForecasts: [
      {
        goalId: { type: String },
        title: { type: String },
        metric: { type: String },
        currentProgress: { type: Number },
        requiredProgress: { type: Number },
        historicalVelocity: { type: Number },
        forecastedValue: { type: Number },
        status: {
          type: String,
          enum: ['ON TRACK', 'AT RISK', 'LIKELY TO MISS', 'ACHIEVABLE', 'ACHIEVED', 'INSUFFICIENT DATA'],
        },
        rationale: { type: String },
      },
    ],
    whatIfScenarios: [
      {
        scenarioName: { type: String },
        description: { type: String },
        forecastedExposure: { type: Number },
        exposureRange: {
          low: { type: Number },
          expected: { type: Number },
          high: { type: Number },
        },
        modeledDifference: { type: Number },
        formattedDifference: { type: String },
        modeledRiskLevel: { type: String },
        remediationEffortHours: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
PredictiveAssessmentSchema.index({ repositoryId: 1, generatedAt: -1 });
PredictiveAssessmentSchema.index({ repositoryId: 1, analysisId: 1 });
PredictiveAssessmentSchema.index({ riskLevel: 1 });
PredictiveAssessmentSchema.index({ riskTrend: 1 });
PredictiveAssessmentSchema.index({ confidence: 1 });
PredictiveAssessmentSchema.index({ modelVersion: 1 });

export const PredictiveAssessment = mongoose.model<IPredictiveAssessment>(
  'PredictiveAssessment',
  PredictiveAssessmentSchema
);
