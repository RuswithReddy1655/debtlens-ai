'use client';

import React from 'react';
import { AlertTriangle, Info, ShieldCheck, GitBranch } from 'lucide-react';
import { useRepository } from '../hooks/useRepositoryContext';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, selectedRepo, analysis } = useRepository();

  if (!isDemoMode && selectedRepo) {
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="font-semibold text-emerald-200">REAL REPOSITORY ANALYSIS:</strong>{' '}
            Live Git history telemetry and AST parsing for{' '}
            <span className="font-mono text-white font-medium">
              {selectedRepo.owner}/{selectedRepo.name}
            </span>{' '}
            ({analysis?.branch || selectedRepo.defaultBranch || 'main'}@
            {analysis?.commitHash || 'HEAD'}).
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-3 text-emerald-400/90 font-mono text-[11px]">
          <span className="flex items-center space-x-1">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Real Git Telemetry</span>
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
            REAL DATA ACTIVE
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="font-semibold text-amber-200">DEMO DATA:</strong> Showing synthetic enterprise benchmark data for architectural validation. Not real repository metrics.
        </span>
      </div>
      <div className="hidden md:flex items-center space-x-3 text-amber-400/80">
        <span className="flex items-center space-x-1">
          <Info className="w-3.5 h-3.5" />
          <span>Formula Traceability Enabled</span>
        </span>
        <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono">
          BENCHMARK DEMO
        </span>
      </div>
    </div>
  );
};
