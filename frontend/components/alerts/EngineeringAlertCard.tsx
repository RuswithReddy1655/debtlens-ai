import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCode,
  AlertTriangle,
  ShieldAlert,
  Info,
  Bell,
  Sparkles,
  ShieldCheck,
  Target,
  ChevronDown,
  ChevronUp,
  Trash2,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { EngineeringAlert, AlertSeverity } from '../../types';
import { parseAlertIntelligence } from './alertUtils';

interface EngineeringAlertCardProps {
  alert: EngineeringAlert;
  onUpdateStatus: (alertId: string, status: 'READ' | 'RESOLVED' | 'DISMISSED') => void;
  onViewFileIntelligence: (filePath: string) => void;
}

const SEVERITY_THEMES: Record<
  AlertSeverity,
  {
    border: string;
    borderLeft: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    icon: any;
  }
> = {
  CRITICAL: {
    border: 'border-zinc-800',
    borderLeft: 'border-l-4 border-l-rose-500',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    icon: ShieldAlert,
  },
  HIGH: {
    border: 'border-zinc-800',
    borderLeft: 'border-l-4 border-l-amber-500',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    icon: AlertTriangle,
  },
  MEDIUM: {
    border: 'border-zinc-800',
    borderLeft: 'border-l-4 border-l-yellow-500',
    badgeBg: 'bg-yellow-500/10',
    badgeText: 'text-yellow-400',
    badgeBorder: 'border-yellow-500/30',
    icon: Info,
  },
  INFO: {
    border: 'border-zinc-800',
    borderLeft: 'border-l-4 border-l-cyan-500',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
    icon: Bell,
  },
};

export const EngineeringAlertCard: React.FC<EngineeringAlertCardProps> = ({
  alert,
  onUpdateStatus,
  onViewFileIntelligence,
}) => {
  const [chainExpanded, setChainExpanded] = useState(false);
  const intel = parseAlertIntelligence(alert);
  const theme = SEVERITY_THEMES[alert.severity] || SEVERITY_THEMES.INFO;
  const SeverityIcon = theme.icon;
  const isUnread = alert.status === 'UNREAD';
  const isResolved = alert.status === 'RESOLVED';

  // Format date deterministically
  const formattedDate = new Date(alert.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`rounded-2xl bg-zinc-900/60 border ${theme.border} ${theme.borderLeft} transition-all shadow-sm overflow-hidden ${
        isUnread ? 'ring-1 ring-zinc-700/80 shadow-md' : 'opacity-90'
      }`}
    >
      <div className="p-5 space-y-4">
        {/* Top Header Row: Category Badge, Type, Severity, and Time */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${intel.categoryBadge}`}
            >
              {intel.categoryLabel}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border flex items-center gap-1 ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
            >
              <SeverityIcon className="w-3 h-3" />
              <span>{alert.severity} SEVERITY</span>
            </span>
            {isUnread && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                NEW
              </span>
            )}
            {isResolved && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                RESOLVED
              </span>
            )}
          </div>

          <div className="text-[11px] font-mono text-zinc-500 shrink-0">
            {formattedDate}
          </div>
        </div>

        {/* Affected Engineering Asset */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-cyan-400 shrink-0 mt-0.5">
            <FileCode className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-zinc-100 font-mono tracking-tight flex items-center gap-2">
              <span className="truncate">{intel.assetName}</span>
            </h2>
            <div className="text-xs text-zinc-400 font-mono truncate mt-0.5">
              {intel.assetPath}
            </div>
          </div>
        </div>

        {/* 4-Column Evidence Signals Telemetry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono">
          {/* Churn */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase">
              <span>Code Churn</span>
              <span className="text-[9px] text-zinc-600">OBSERVED</span>
            </div>
            <div className="text-sm font-bold text-zinc-200">
              {intel.churn}
            </div>
          </div>

          {/* Complexity */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase">
              <span>Complexity</span>
              <span className="text-[9px] text-zinc-600">DERIVED</span>
            </div>
            <div className="text-sm font-bold text-zinc-200">
              {intel.complexity}
            </div>
          </div>

          {/* Forecast */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase">
              <span>Forecast</span>
              <span className="text-[9px] text-zinc-600">MODELED</span>
            </div>
            <div className="text-sm font-bold text-cyan-300">
              {intel.forecast}
            </div>
          </div>

          {/* Trajectory */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase">
              <span>Trajectory</span>
              <span className="text-[9px] text-zinc-600">DERIVED</span>
            </div>
            <div className="text-xs font-bold truncate">
              <span className={`px-2 py-0.5 rounded border ${intel.trajectoryBadge}`}>
                {intel.trajectory}
              </span>
            </div>
          </div>
        </div>

        {/* Why This Matters Section */}
        <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            WHY THIS MATTERS
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {intel.whyItMatters}
          </p>
        </div>

        {/* Recommended Action Section */}
        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RECOMMENDED ACTION</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
              MODELED GUIDANCE
            </span>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed">
            {intel.recommendedAction}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-zinc-400">
            <span>
              Estimated Effort:{' '}
              <span className="text-zinc-200 font-semibold">{intel.actionEffort}</span>
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              Confidence:{' '}
              <span className="text-emerald-400 font-semibold">HIGH</span>
            </span>
          </div>
        </div>

        {/* Expandable Intelligence Chain ("Why am I seeing this?") */}
        <div className="border-t border-zinc-800/80 pt-3">
          <button
            onClick={() => setChainExpanded(!chainExpanded)}
            className="flex items-center justify-between w-full text-left text-xs font-mono text-zinc-400 hover:text-cyan-300 transition-colors py-1"
          >
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold">
                Why am I seeing this? (Deterministic Intelligence Chain)
              </span>
            </div>
            {chainExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {chainExpanded && (
            <div className="mt-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in duration-150">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Telemetry Chain of Reason
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs font-mono">
                {/* Step 1: Signal */}
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase">
                    <span>1. {intel.chain.signal.title}</span>
                    <span className="text-zinc-600">{intel.chain.signal.classification}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-200 truncate">
                    {intel.chain.signal.value}
                  </div>
                </div>

                {/* Step 2: Complexity */}
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase">
                    <span>2. {intel.chain.complexity.title}</span>
                    <span className="text-zinc-600">{intel.chain.complexity.classification}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-200 truncate">
                    {intel.chain.complexity.value}
                  </div>
                </div>

                {/* Step 3: Forecast */}
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase">
                    <span>3. {intel.chain.forecast.title}</span>
                    <span className="text-cyan-600">{intel.chain.forecast.classification}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-cyan-300 truncate">
                    {intel.chain.forecast.value}
                  </div>
                </div>

                {/* Step 4: Risk */}
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase">
                    <span>4. {intel.chain.risk.title}</span>
                    <span className="text-zinc-600">{intel.chain.risk.classification}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-rose-300 truncate">
                    {intel.chain.risk.value}
                  </div>
                </div>

                {/* Step 5: Recommendation */}
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase">
                    <span>5. {intel.chain.recommendation.title}</span>
                    <span className="text-emerald-600">{intel.chain.recommendation.classification}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-300 truncate">
                    {intel.chain.recommendation.value}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-2">
            {intel.isFilePath && (
              <button
                onClick={() => onViewFileIntelligence(intel.assetPath)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800 text-xs font-semibold transition shadow-sm"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>View File Intelligence</span>
              </button>
            )}

            {intel.categoryLabel === 'PREDICTIVE SIGNAL' && (
              <Link
                href="/predictive-intelligence"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>View Prediction</span>
              </Link>
            )}

            {intel.categoryLabel === 'VERIFICATION AUDIT' && (
              <Link
                href="/verification"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Verification</span>
              </Link>
            )}

            {intel.categoryLabel === 'GOAL OUTLOOK' && (
              <Link
                href="/goals"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition"
              >
                <Target className="w-3.5 h-3.5 text-yellow-400" />
                <span>View Goals</span>
              </Link>
            )}

            {!intel.isFilePath && intel.categoryLabel !== 'PREDICTIVE SIGNAL' && (
              <Link
                href="/hotspots"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>View Hotspots</span>
              </Link>
            )}
          </div>

          {/* Workflow Status Buttons */}
          <div className="flex items-center gap-2">
            {isUnread && (
              <button
                onClick={() => onUpdateStatus(alert._id || alert.id!, 'READ')}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition border border-zinc-800"
              >
                Mark Read
              </button>
            )}
            {!isResolved && (
              <button
                onClick={() => onUpdateStatus(alert._id || alert.id!, 'RESOLVED')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 text-xs font-semibold transition"
              >
                Resolve
              </button>
            )}
            <button
              onClick={() => onUpdateStatus(alert._id || alert.id!, 'DISMISSED')}
              title="Dismiss Alert"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
