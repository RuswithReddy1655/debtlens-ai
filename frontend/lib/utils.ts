import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskLevel } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function getRiskColor(risk: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (risk) {
    case 'critical':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        badge: 'bg-rose-950/80 text-rose-300 border-rose-800',
      };
    case 'high':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-800',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
        badge: 'bg-yellow-950/80 text-yellow-300 border-yellow-800',
      };
    case 'low':
    default:
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      };
  }
}

export function getHealthColor(score: number): {
  text: string;
  badge: string;
  label: string;
} {
  if (score >= 85) {
    return { text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: 'Healthy' };
  } else if (score >= 70) {
    return { text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', label: 'Moderate' };
  } else if (score >= 50) {
    return { text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', label: 'Degraded' };
  } else {
    return { text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', label: 'Severe Debt' };
  }
}
