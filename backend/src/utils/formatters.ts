/**
 * DebtLens AI - Formatting and Math Utilities
 */

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, val));
};

export const roundTo = (val: number, decimals: number = 1): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
};
