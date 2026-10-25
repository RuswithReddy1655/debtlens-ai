import React from 'react';
import {
  ShieldAlert,
  RotateCw,
  Check,
  Sparkles,
  ShieldCheck,
  Bell,
} from 'lucide-react';

interface AlertCenterHeaderProps {
  unreadCount: number;
  criticalHighCount: number;
  predictiveCount: number;
  verificationCount: number;
  loading: boolean;
  onRefresh: () => void;
  onDismissAll: () => void;
}

export const AlertCenterHeader: React.FC<AlertCenterHeaderProps> = ({
  unreadCount,
  criticalHighCount,
  predictiveCount,
  verificationCount,
  loading,
  onRefresh,
  onDismissAll,
}) => {
  return (
    <div className="space-y-5 pb-6 border-b border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-full bg-rose-950/80 text-rose-400 border border-rose-800">
              EARLY WARNING SYSTEM
            </span>
            <span className="text-zinc-500 text-xs font-mono">CONTINUOUS TELEMETRY AUDIT</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
            Engineering Alerts Center
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Detect emerging engineering risk before it becomes expensive. Meaningful alerts generated from
            repository telemetry, predictive signals, debt verification, and engineering health changes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onDismissAll}
            disabled={loading || unreadCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 text-xs font-medium transition disabled:opacity-40"
            title="Mark all unread alerts as dismissed"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Dismiss All</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/80 text-xs font-semibold transition disabled:opacity-40"
            title="Refresh alerts"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Compact Leadership Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Unread</span>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-100">{unreadCount}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase">High Risk</span>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400">{criticalHighCount}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Predictive</span>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-300">{predictiveCount}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Verification</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-300">{verificationCount}</span>
        </div>
      </div>
    </div>
  );
};
