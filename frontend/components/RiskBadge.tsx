import React from 'react';
import { RiskLevel } from '../types';
import { getRiskColor } from '../lib/utils';

interface RiskBadgeProps {
  risk: RiskLevel;
  className?: string;
  showDot?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, className = '', showDot = true }) => {
  const styles = getRiskColor(risk);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles.badge} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            risk === 'critical'
              ? 'bg-rose-400 animate-pulse'
              : risk === 'high'
              ? 'bg-amber-400'
              : risk === 'medium'
              ? 'bg-yellow-400'
              : 'bg-emerald-400'
          }`}
        />
      )}
      <span className="capitalize">{risk}</span>
    </span>
  );
};
