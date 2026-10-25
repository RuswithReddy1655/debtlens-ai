import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'cyan' | 'rose' | 'amber' | 'emerald' | 'indigo';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'cyan',
  onClick,
}) => {
  const accentGlow = {
    cyan: 'hover:border-cyan-500/40 hover:shadow-cyan-500/5',
    rose: 'hover:border-rose-500/40 hover:shadow-rose-500/5',
    amber: 'hover:border-amber-500/40 hover:shadow-amber-500/5',
    emerald: 'hover:border-emerald-500/40 hover:shadow-emerald-500/5',
    indigo: 'hover:border-indigo-500/40 hover:shadow-indigo-500/5',
  }[accentColor];

  const iconBg = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`relative bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 backdrop-blur-sm transition-all duration-200 shadow-sm ${accentGlow} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-zinc-400 tracking-wide uppercase">{title}</p>
        {icon && (
          <div className={`p-2 rounded-lg border ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-zinc-100">{value}</div>
        {subtitle && <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center space-x-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
          {trend.label && <span className="text-zinc-500">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
