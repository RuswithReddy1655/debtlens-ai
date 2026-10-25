'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { PrioritizationResult, PriorityItem, MatrixQuadrant, PriorityTier, CurrencyCode } from '../../types';
import {
  Target,
  Zap,
  Layers,
  Clock,
  AlertCircle,
  Filter,
  ArrowRight,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { LoadingState, ErrorState } from '../../components/States';
import { FileDetailPanel } from '../../components/FileDetailPanel';

export default function PrioritiesPage() {
  const { selectedAnalysis, isDemoMode } = useRepository();
  const [data, setData] = useState<PrioritizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [activeItem, setActiveItem] = useState<PriorityItem | null>(null);
  const [inspectingItem, setInspectingItem] = useState<any | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<PriorityItem | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');

  const analysisId = selectedAnalysis?._id || selectedAnalysis?.id || 'analysis-demo-fintech-01';

  const loadData = async (curr: CurrencyCode) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPriorities(analysisId, curr);
      setData(res.data);
      if (res.data.priorities.length > 0) {
        setActiveItem(res.data.priorities[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load prioritization intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currency);
  }, [analysisId, currency]);

  const { priorities = [], quadrantDistribution = { quickWinsCount: 0, strategicCount: 0, opportunisticCount: 0, deferCount: 0 }, tierDistribution = { criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, monitorCount: 0 } } = data || {};

  const filteredItems = useMemo(() => {
    return priorities.filter((item) => {
      const quadrantMatch = selectedQuadrant === 'ALL' || item.matrixQuadrant === selectedQuadrant;
      const tierMatch = selectedTier === 'ALL' || item.priorityTier === selectedTier;
      return quadrantMatch && tierMatch;
    });
  }, [priorities, selectedQuadrant, selectedTier]);

  // Compute scale boundaries for 2D Matrix
  const { maxEffort, maxImpact } = useMemo(() => {
    let eff = 40;
    let imp = 50000;
    priorities.forEach((p) => {
      const h = p.estimatedRefactoringEffort?.highHours || 20;
      if (h > eff) eff = h;
      if (p.estimatedFinancialImpact > imp) imp = p.estimatedFinancialImpact;
    });
    return { maxEffort: eff * 1.15, maxImpact: imp * 1.15 };
  }, [priorities]);

  const getTierBadge = (tier: PriorityTier) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'MEDIUM':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'LOW':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getTierDotColor = (tier: PriorityTier) => {
    switch (tier) {
      case 'CRITICAL':
        return '#f43f5e';
      case 'HIGH':
        return '#f59e0b';
      case 'MEDIUM':
        return '#06b6d4';
      case 'LOW':
        return '#3b82f6';
      default:
        return '#71717a';
    }
  };

  const getQuadrantColor = (quadrant: MatrixQuadrant) => {
    switch (quadrant) {
      case 'QUICK WINS':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
      case 'STRATEGIC':
        return 'text-indigo-400 bg-indigo-950/40 border-indigo-800';
      case 'OPPORTUNISTIC':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-800';
      case 'DEFER':
        return 'text-zinc-400 bg-zinc-900 border-zinc-700';
    }
  };

  if (loading && !data) {
    return <LoadingState message="Calculating multi-signal prioritization and Impact vs Effort matrix..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'No priority items available.'} onRetry={() => loadData(currency)} />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-bold">
              Engineering Decision Support &bull; Priority Center
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              DATA CLASSIFICATION: DERIVED
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" />
            What Should We Fix First?
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Deterministic prioritization ranking combining AST cyclomatic branching, code churn velocity, bug-fix commit telemetry, and modeled financial drag.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium">Currency:</span>
          {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                currency === c ? 'bg-cyan-500 text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Section 13: Priority Model Breakdown */}
      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Priority Score Model & Weight Breakdown
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5 font-sans">
              Composite score from 0 ─── 100 derived from 5 objective engineering telemetry vectors:
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-zinc-400">Score Range:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-950 text-cyan-400 border border-zinc-800 font-bold">
              0 ─── 100
            </span>
          </div>
        </div>

        {/* Factors Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Technical Risk</span>
              <span className="font-mono font-bold text-rose-400">30%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: '30%' }} />
            </div>
            <div className="text-[10px] text-zinc-500 mt-1.5 font-mono">AST depth & complexity</div>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Financial Impact</span>
              <span className="font-mono font-bold text-amber-400">25%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '25%' }} />
            </div>
            <div className="text-[10px] text-zinc-500 mt-1.5 font-mono">Modeled annual drag</div>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Change Velocity</span>
              <span className="font-mono font-bold text-indigo-400">20%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '20%' }} />
            </div>
            <div className="text-[10px] text-zinc-500 mt-1.5 font-mono">Git commit revisions</div>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Defect Activity</span>
              <span className="font-mono font-bold text-cyan-400">15%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: '15%' }} />
            </div>
            <div className="text-[10px] text-zinc-500 mt-1.5 font-mono">Bug-fix commit frequency</div>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Confidence</span>
              <span className="font-mono font-bold text-emerald-400">10%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '10%' }} />
            </div>
            <div className="text-[10px] text-zinc-500 mt-1.5 font-mono">Sample completeness</div>
          </div>
        </div>

        {/* Priority Tiers Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/80 text-xs font-mono">
          <span className="text-zinc-400 font-sans text-xs">Priority Tiers:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MONITOR'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                selectedTier === t
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-bold'
                  : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {t} {t !== 'ALL' && `(${tierDistribution[`${t.toLowerCase()}Count` as keyof typeof tierDistribution] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Section 14: Interactive Impact vs Effort 2D Scatter Matrix */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Impact vs Effort Remediation Matrix
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Interactive 2D decision landscape. Click any hotspot node to inspect remediation analysis.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Low</span>
          </div>
        </div>

        {/* Matrix Canvas Container */}
        <div className="relative w-full h-80 sm:h-96 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-4 select-none">
          
          {/* Quadrant Background Dividers & Watermarks */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
            {/* Top-Left: QUICK WINS */}
            <div className="border-r border-b border-zinc-800/80 bg-emerald-950/10 p-3 flex flex-col justify-between">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-emerald-400/80 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Quick Wins (High Impact &bull; Low Effort)
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">Immediate priority &bull; Rapid ROI</span>
            </div>

            {/* Top-Right: STRATEGIC */}
            <div className="border-b border-zinc-800/80 bg-indigo-950/10 p-3 flex flex-col justify-between text-right">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-indigo-400/80 flex items-center justify-end gap-1">
                <Layers className="w-3.5 h-3.5" /> Strategic (High Impact &bull; High Effort)
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">Requires architectural planning</span>
            </div>

            {/* Bottom-Left: OPPORTUNISTIC */}
            <div className="border-r border-zinc-800/80 bg-cyan-950/10 p-3 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-600 font-mono">Fix during routine feature touches</span>
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-400/80 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Opportunistic (Low Impact &bull; Low Effort)
              </span>
            </div>

            {/* Bottom-Right: DEFER */}
            <div className="bg-zinc-900/10 p-3 flex flex-col justify-between text-right">
              <span className="text-[10px] text-zinc-600 font-mono">Unfavorable refactoring ROI &bull; Monitor</span>
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-zinc-500 flex items-center justify-end gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Defer (Low Impact &bull; High Effort)
              </span>
            </div>
          </div>

          {/* Plotted Hotspot Nodes */}
          {filteredItems.map((item) => {
            const effort = item.estimatedRefactoringEffort?.highHours || 15;
            const impact = item.estimatedFinancialImpact || 10000;
            // X-coord %: 0% to 100% based on effort
            const xPercent = Math.min(94, Math.max(6, (effort / maxEffort) * 100));
            // Y-coord %: 100% to 0% based on impact (top is high impact)
            const yPercent = Math.min(92, Math.max(8, 100 - (impact / maxImpact) * 100));

            const isHovered = hoveredPoint?.filePath === item.filePath;
            const isSelected = activeItem?.filePath === item.filePath;

            return (
              <button
                key={item.filePath}
                onClick={() => {
                  setActiveItem(item);
                  setInspectingItem({
                    filePath: item.filePath,
                    debtScore: item.priorityScore,
                    riskLevel: item.priorityTier.toLowerCase(),
                    debtHours: effort,
                    annualExposure: item.estimatedFinancialImpact,
                    complexityScore: item.cyclomaticComplexity,
                    churnScore: item.changeCount,
                    defectFixCount: item.defectFixCommitCount,
                    reason: item.reason,
                    recommendedAction: item.suggestedAction,
                  });
                }}
                onMouseEnter={() => setHoveredPoint(item)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-transform focus:outline-none ${
                  isHovered || isSelected ? 'scale-150 z-30 ring-4 ring-cyan-400/50' : 'hover:scale-125 z-10'
                }`}
                aria-label={`Hotspot ${item.filePath}`}
              >
                <span
                  className="w-full h-full rounded-full block border-2 border-zinc-950 shadow-md"
                  style={{ backgroundColor: getTierDotColor(item.priorityTier) }}
                />
              </button>
            );
          })}

          {/* Interactive Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-40 bg-zinc-900 border border-zinc-700/90 shadow-2xl rounded-xl p-3 max-w-xs text-xs pointer-events-none transform -translate-y-full mb-3"
              style={{
                left: `${Math.min(80, Math.max(20, (hoveredPoint.estimatedRefactoringEffort?.highHours || 15) / maxEffort * 100))}%`,
                top: `${Math.min(80, Math.max(20, 100 - ((hoveredPoint.estimatedFinancialImpact || 10000) / maxImpact * 100)))}%`,
              }}
            >
              <div className="font-mono font-bold text-zinc-100 truncate">{hoveredPoint.filePath}</div>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                <div>
                  <span className="text-zinc-500">Impact: </span>
                  <span className="text-amber-400 font-bold">{hoveredPoint.formattedFinancialImpact}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Effort: </span>
                  <span className="text-cyan-300 font-bold">{hoveredPoint.estimatedRefactoringEffort?.formattedRange}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Priority: </span>
                  <span className="text-rose-400 font-bold">{hoveredPoint.priorityTier}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Quadrant: </span>
                  <span className="text-emerald-400 font-bold">{hoveredPoint.matrixQuadrant}</span>
                </div>
              </div>
              <div className="text-[10px] text-cyan-400 font-mono mt-2 pt-1 border-t border-zinc-800">
                Click to open detailed analysis drawer &rarr;
              </div>
            </div>
          )}

          {/* Axes labels */}
          <div className="absolute bottom-1 right-3 text-[10px] font-mono text-zinc-500 tracking-wider">
            REMEDIATION EFFORT (HOURS) &rarr;
          </div>
          <div className="absolute top-2 left-2 text-[10px] font-mono text-zinc-500 tracking-wider">
            &uarr; POTENTIAL IMPACT (EXPOSURE)
          </div>
        </div>

        {/* 4 Quadrants Summary Quick Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'QUICK WINS' ? 'ALL' : 'QUICK WINS')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedQuadrant === 'QUICK WINS'
                ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="text-[11px] font-mono font-bold text-emerald-400 flex items-center justify-between">
              <span>Quick Wins</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-[10px]">
                {quadrantDistribution.quickWinsCount}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">High Impact, Low Effort</div>
          </button>

          <button
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'STRATEGIC' ? 'ALL' : 'STRATEGIC')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedQuadrant === 'STRATEGIC'
                ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="text-[11px] font-mono font-bold text-indigo-400 flex items-center justify-between">
              <span>Strategic</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-[10px]">
                {quadrantDistribution.strategicCount}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">High Impact, High Effort</div>
          </button>

          <button
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'OPPORTUNISTIC' ? 'ALL' : 'OPPORTUNISTIC')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedQuadrant === 'OPPORTUNISTIC'
                ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="text-[11px] font-mono font-bold text-cyan-400 flex items-center justify-between">
              <span>Opportunistic</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[10px]">
                {quadrantDistribution.opportunisticCount}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Low Impact, Low Effort</div>
          </button>

          <button
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'DEFER' ? 'ALL' : 'DEFER')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedQuadrant === 'DEFER'
                ? 'bg-zinc-800/60 border-zinc-500 ring-1 ring-zinc-500/50'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="text-[11px] font-mono font-bold text-zinc-400 flex items-center justify-between">
              <span>Defer</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[10px]">
                {quadrantDistribution.deferCount}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Low Impact, High Effort</div>
          </button>
        </div>
      </div>

      {/* Main Content Area: Priorities Table + Decision Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Priority Queue Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-300 font-semibold">Priority Queue ({filteredItems.length} items)</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Ordered by composite multi-signal priority
            </div>
          </div>

          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-3 text-center">Rank</th>
                    <th className="py-3 px-4">File Path & Guidance</th>
                    <th className="py-3 px-3">Quadrant</th>
                    <th className="py-3 px-3">Tier</th>
                    <th className="py-3 px-3">Effort</th>
                    <th className="py-3 px-4 text-right">Exposure</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.filePath}
                      onClick={() => setActiveItem(item)}
                      className={`cursor-pointer transition-colors ${
                        activeItem?.filePath === item.filePath
                          ? 'bg-cyan-950/30 border-l-2 border-cyan-400'
                          : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center font-bold text-zinc-400">
                        #{item.rank}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-zinc-100 truncate max-w-xs">{item.filePath}</div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5">
                          {item.suggestedAction}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getQuadrantColor(
                            item.matrixQuadrant
                          )}`}
                        >
                          {item.matrixQuadrant}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTierBadge(
                            item.priorityTier
                          )}`}
                        >
                          {item.priorityTier}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-300 font-semibold">
                        {item.estimatedRefactoringEffort?.formattedRange}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-300">
                        {item.formattedFinancialImpact}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingItem({
                              filePath: item.filePath,
                              debtScore: item.priorityScore,
                              riskLevel: item.priorityTier.toLowerCase(),
                              debtHours: item.estimatedRefactoringEffort?.highHours || 20,
                              annualExposure: item.estimatedFinancialImpact,
                              complexityScore: item.cyclomaticComplexity,
                              churnScore: item.changeCount,
                              defectFixCount: item.defectFixCommitCount,
                              reason: item.reason,
                              recommendedAction: item.suggestedAction,
                            });
                          }}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] rounded border border-zinc-700 hover:border-zinc-600 transition-colors"
                        >
                          View Analysis
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Active Item Detail & Why Fix First Card */}
        <div className="space-y-4">
          {activeItem ? (
            <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 space-y-5 sticky top-20 shadow-xl">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                  <span>Priority Rank #{activeItem.rank}</span>
                  <span className={`px-2 py-0.5 rounded font-bold border ${getTierBadge(activeItem.priorityTier)}`}>
                    {activeItem.priorityTier}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-100 font-mono break-all">{activeItem.filePath}</h3>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border font-mono">
                  Matrix: {activeItem.matrixQuadrant}
                </div>
              </div>

              {/* Financial & Effort Telemetry */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 font-mono text-xs">
                <div>
                  <div className="text-zinc-500 text-[10px]">ANNUAL DRAG:</div>
                  <div className="text-rose-300 font-bold text-sm mt-0.5">
                    {activeItem.formattedFinancialImpact}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px]">POTENTIAL SAVINGS:</div>
                  <div className="text-emerald-300 font-bold text-sm mt-0.5">
                    {activeItem.formattedSavings}
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-zinc-500 text-[10px]">EST. REFACTOR EFFORT:</div>
                  <div className="text-cyan-300 font-bold text-sm mt-0.5">
                    {activeItem.estimatedRefactoringEffort?.formattedRange}
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-zinc-500 text-[10px]">AST COMPLEXITY:</div>
                  <div className="text-zinc-200 font-bold text-sm mt-0.5">
                    {activeItem.cyclomaticComplexity}
                  </div>
                </div>
              </div>

              {/* Why Should Engineering Fix This First? */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Why Should We Fix This First?
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800">
                  {activeItem.reason}
                </p>
              </div>

              {/* Suggested Action */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  Recommended Action
                </div>
                <p className="text-xs text-cyan-300/90 leading-relaxed bg-cyan-950/30 p-3 rounded-lg border border-cyan-800/50">
                  {activeItem.suggestedAction}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setInspectingItem({
                    filePath: activeItem.filePath,
                    debtScore: activeItem.priorityScore,
                    riskLevel: activeItem.priorityTier.toLowerCase(),
                    debtHours: activeItem.estimatedRefactoringEffort?.highHours || 20,
                    annualExposure: activeItem.estimatedFinancialImpact,
                    complexityScore: activeItem.cyclomaticComplexity,
                    churnScore: activeItem.changeCount,
                    defectFixCount: activeItem.defectFixCommitCount,
                    reason: activeItem.reason,
                    recommendedAction: activeItem.suggestedAction,
                  });
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
              >
                <span>Inspect Detailed Risk Explanation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
              Select an item from the table or matrix to inspect decision guidance.
            </div>
          )}
        </div>
      </div>

      {/* File Detail Drawer */}
      {inspectingItem && (
        <FileDetailPanel
          file={inspectingItem}
          onClose={() => setInspectingItem(null)}
        />
      )}
    </div>
  );
}

