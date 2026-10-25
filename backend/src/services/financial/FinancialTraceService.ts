import { ConfidenceLevel, CostRange } from './CostModel';

export interface TraceInputItem {
  name: string;
  value: number | string;
  unit?: string;
  source?: string;
}

export interface FinancialTrace {
  metric: string;
  category: 'remediation' | 'historical_burden' | 'avoidable_cost' | 'refactoring_benefit' | 'cost_driver';
  inputs: TraceInputItem[];
  formula: string;
  estimatedValue: number;
  range: CostRange;
  currency: string;
  confidence: ConfidenceLevel;
  explanation: string;
}

export class FinancialTraceService {
  /**
   * Generates a fully audit-traceable financial trace item.
   */
  static createTrace(params: {
    metric: string;
    category: 'remediation' | 'historical_burden' | 'avoidable_cost' | 'refactoring_benefit' | 'cost_driver';
    inputs: TraceInputItem[];
    formula: string;
    estimatedValue: number;
    range: CostRange;
    currency: string;
    confidence: ConfidenceLevel;
    explanation: string;
  }): FinancialTrace {
    return {
      metric: params.metric,
      category: params.category,
      inputs: params.inputs,
      formula: params.formula,
      estimatedValue: Math.round(params.estimatedValue),
      range: params.range,
      currency: params.currency,
      confidence: params.confidence,
      explanation: params.explanation,
    };
  }
}
