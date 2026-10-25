export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  defaultHourlyRate: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    defaultHourlyRate: 2000,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    defaultHourlyRate: 95,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    defaultHourlyRate: 88,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    defaultHourlyRate: 75,
  },
};

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';

export interface CostRange {
  low: number;
  expected: number;
  high: number;
}

export interface FinancialAssumptions {
  currency: CurrencyCode;
  hourlyRate: number;
  annualWorkingHoursPerDev: number;
  averageMaintenanceHoursCritical: number;
  averageMaintenanceHoursHigh: number;
  averageMaintenanceHoursMedium: number;
  defectFixHoursHeuristic: number;
  defectRemediationMultiplier: number;
  changeFrictionMultiplier: number;
  legacyRiskMultiplier: number;
  defaultRemediationEffectiveness: number; // e.g. 0.65 (65% friction reduction post-remediation)
  evaluationWindowYears: number;
  modelVersion: string;
}

export const DEFAULT_FINANCIAL_ASSUMPTIONS: FinancialAssumptions = {
  currency: 'INR',
  hourlyRate: 2000,
  annualWorkingHoursPerDev: 1880,
  averageMaintenanceHoursCritical: 38,
  averageMaintenanceHoursHigh: 18,
  averageMaintenanceHoursMedium: 6,
  defectFixHoursHeuristic: 8,
  defectRemediationMultiplier: 2.2,
  changeFrictionMultiplier: 1.3,
  legacyRiskMultiplier: 1.15,
  defaultRemediationEffectiveness: 0.65,
  evaluationWindowYears: 2,
  modelVersion: 'Financial Model v1.0',
};

export class CostModel {
  /**
   * Resolves effective assumptions using defaults and overrides.
   */
  static resolveAssumptions(overrides?: Partial<FinancialAssumptions>): FinancialAssumptions {
    const currency = (overrides?.currency && SUPPORTED_CURRENCIES[overrides.currency])
      ? overrides.currency
      : DEFAULT_FINANCIAL_ASSUMPTIONS.currency;

    const defaultRate = SUPPORTED_CURRENCIES[currency].defaultHourlyRate;
    const hourlyRate = (overrides?.hourlyRate && overrides.hourlyRate > 0)
      ? overrides.hourlyRate
      : defaultRate;

    return {
      ...DEFAULT_FINANCIAL_ASSUMPTIONS,
      ...overrides,
      currency,
      hourlyRate,
    };
  }

  /**
   * Calculates a range based on variance factor around an expected value.
   */
  static calculateRange(expected: number, varianceFactor: number = 0.15): CostRange {
    const safeExpected = Math.max(0, Math.round(expected));
    const low = Math.max(0, Math.round(safeExpected * (1 - varianceFactor)));
    const high = Math.round(safeExpected * (1 + varianceFactor));
    return { low, expected: safeExpected, high };
  }

  /**
   * Evaluates confidence based on telemetry density.
   */
  static evaluateConfidence(metrics: {
    totalCommits?: number;
    totalFiles?: number;
    astSupportedCount?: number;
    defectSignalsFound?: boolean;
    isDemo?: boolean;
  }): ConfidenceLevel {
    if (metrics.isDemo) {
      return 'MEDIUM';
    }

    const commits = metrics.totalCommits ?? 0;
    const files = metrics.totalFiles ?? 0;
    const astCount = metrics.astSupportedCount ?? 0;

    if (commits === 0 || files === 0) {
      return 'INSUFFICIENT DATA';
    }

    if (commits >= 10 && files >= 3 && astCount >= 1) {
      return 'HIGH';
    }

    if (commits >= 3 && files >= 1) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Formats a number with Indian Lakhs/Crores or Western Millions/K format.
   */
  static formatCurrencyRange(range: CostRange, currency: CurrencyCode): string {
    const symbol = SUPPORTED_CURRENCIES[currency]?.symbol || '₹';
    if (currency === 'INR') {
      const formatInr = (val: number): string => {
        if (val >= 10000000) {
          return `${(val / 10000000).toFixed(1)}Cr`;
        }
        if (val >= 100000) {
          return `${(val / 100000).toFixed(1)}L`;
        }
        if (val >= 1000) {
          return `${(val / 1000).toFixed(0)}k`;
        }
        return `${val}`;
      };
      return `${symbol}${formatInr(range.low)} – ${symbol}${formatInr(range.high)}`;
    }

    const formatWestern = (val: number): string => {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(0)}k`;
      }
      return `${val}`;
    };
    return `${symbol}${formatWestern(range.low)} – ${symbol}${formatWestern(range.high)}`;
  }
}
