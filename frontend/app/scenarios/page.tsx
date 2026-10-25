'use client';

import React, { useEffect, useState } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import {
  ScenarioResult,
  ScenarioComparison,
  CurrencyCode,
  CostRange,
  FileMetric,
} from '../../types';
import {
  Sliders,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Layers,
  FileCode2,
  Info,
} from 'lucide-react';
import { LoadingState, ErrorState } from '../../components/States';

const formatCostRange = (range?: CostRange, curr: string = '₹') => {
  if (!range) return 'N/A';
  if (range.formatted) return range.formatted;
  return `${curr} ${range.low.toLocaleString()} – ${curr} ${range.high.toLocaleString()}`;
};

export default function ScenariosPage() {
  const { selectedAnalysis, isDemoMode } = useRepository();
  const analysisId = selectedAnalysis?._id || selectedAnalysis?.id || 'analysis-demo-fintech-01';

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Currency & Rate
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [hourlyRate, setHourlyRate] = useState<number>(2000);

  // Sliders & Controls
  const [effectiveness, setEffectiveness] = useState<number>(0.65);
  const [effortMultiplier, setEffortMultiplier] = useState<number>(1.0);
  const [selectedPreset, setSelectedPreset] = useState<'TOP_5' | 'TOP_10' | 'ALL' | 'CUSTOM'>('TOP_5');

  // File metrics for custom selection
  const [fileMetrics, setFileMetrics] = useState<FileMetric[]>([]);
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [fileFilter, setFileFilter] = useState('');

  // Scenario results
  const [activeResult, setActiveResult] = useState<ScenarioResult | null>(null);
  const [presetsComparison, setPresetsComparison] = useState<ScenarioComparison | null>(null);

  // Load initial presets comparison and metrics
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [presetsRes, metricsRes] = await Promise.all([
        api.comparePresets(analysisId, currency, hourlyRate),
        api.getMetrics(analysisId),
      ]);

      setPresetsComparison(presetsRes.data);
      setFileMetrics(metricsRes.data || []);

      // Default to top 5 files
      const top5Paths = (metricsRes.data || []).slice(0, 5).map((m) => m.filePath);
      setSelectedFilePaths(top5Paths);

      // Default active result is first preset (Top 5)
      if (presetsRes.data.scenarios && presetsRes.data.scenarios.length > 0) {
        setActiveResult(presetsRes.data.scenarios[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize What-If Scenario simulator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [analysisId]);

  // Adjust default rate on currency change
  const handleCurrencyChange = (c: CurrencyCode) => {
    setCurrency(c);
    let defaultRate = 2000;
    if (c === 'USD') defaultRate = 60;
    else if (c === 'EUR') defaultRate = 55;
    else if (c === 'GBP') defaultRate = 48;
    setHourlyRate(defaultRate);
    recompute(selectedFilePaths, defaultRate, effectiveness, effortMultiplier, c);
  };

  // Re-run scenario calculation
  const recompute = async (
    paths: string[],
    rate: number,
    eff: number,
    effort: number,
    curr: CurrencyCode
  ) => {
    try {
      setRunning(true);
      const res = await api.runScenario(analysisId, {
        scenarioName:
          selectedPreset === 'CUSTOM'
            ? `Custom Refactoring Scenario (${paths.length} files)`
            : selectedPreset === 'TOP_5'
            ? 'Scenario A: Top 5 Quick Wins'
            : selectedPreset === 'TOP_10'
            ? 'Scenario B: Top 10 High-Impact Hotspots'
            : 'Scenario C: Comprehensive Hotspot Remediation',
        selectedFilePaths: paths,
        hourlyRate: rate,
        remediationEffectiveness: eff,
        effortMultiplier: effort,
      });

      setActiveResult(res.data);

      // Also refresh preset matrix comparison with current rate
      const compareRes = await api.comparePresets(analysisId, curr, rate);
      setPresetsComparison(compareRes.data);
    } catch (err: any) {
      console.error('Failed to compute scenario:', err);
    } finally {
      setRunning(false);
    }
  };

  // Handle Preset Selection
  const handlePresetChange = (preset: 'TOP_5' | 'TOP_10' | 'ALL' | 'CUSTOM') => {
    setSelectedPreset(preset);
    let paths: string[] = [];
    if (preset === 'TOP_5') {
      paths = fileMetrics.slice(0, 5).map((m) => m.filePath);
    } else if (preset === 'TOP_10') {
      paths = fileMetrics.slice(0, 10).map((m) => m.filePath);
    } else if (preset === 'ALL') {
      paths = fileMetrics.map((m) => m.filePath);
    } else {
      paths = selectedFilePaths.length > 0 ? selectedFilePaths : fileMetrics.slice(0, 3).map((m) => m.filePath);
    }
    setSelectedFilePaths(paths);
    recompute(paths, hourlyRate, effectiveness, effortMultiplier, currency);
  };

  // Toggle single file selection
  const toggleFile = (filePath: string) => {
    setSelectedPreset('CUSTOM');
    const newPaths = selectedFilePaths.includes(filePath)
      ? selectedFilePaths.filter((p) => p !== filePath)
      : [...selectedFilePaths, filePath];
    setSelectedFilePaths(newPaths);
    recompute(newPaths, hourlyRate, effectiveness, effortMultiplier, currency);
  };

  if (loading && !activeResult) {
    return <LoadingState message="Loading What-If Scenario Engine and comparative models..." />;
  }

  if (error || !activeResult) {
    return <ErrorState message={error || 'Failed to load scenario data.'} onRetry={loadInitialData} />;
  }

  const filteredMetrics = fileMetrics.filter((m) =>
    m.filePath.toLowerCase().includes(fileFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Decision Support Layer
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                isDemoMode
                  ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                  : 'bg-indigo-950/70 text-indigo-300 border-indigo-800'
              }`}
            >
              {isDemoMode ? 'DEMO FINANCIAL MODEL' : 'ACTIVE REPOSITORY TELEMETRY'}
            </span>
            <span className="text-xs text-zinc-500 font-mono">Model v1.0</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-400" />
            What-If Scenario Simulator & ROI Engine
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Model engineering refactoring investments, test effectiveness assumptions, and forecast annual savings
            with payback horizons before allocating engineering sprint capacity.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex items-center gap-1 shadow-inner">
            {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map((c) => (
              <button
                key={c}
                onClick={() => handleCurrencyChange(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  currency === c
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {c === 'INR' ? '₹ INR' : c === 'USD' ? '$ USD' : c === 'EUR' ? '€ EUR' : '£ GBP'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Strategy Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => handlePresetChange('TOP_5')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedPreset === 'TOP_5'
              ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              Scenario A
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">Top 5 Quick Wins</h3>
          <p className="text-xs text-zinc-400 mt-1">High-impact files with lowest refactoring friction.</p>
        </button>

        <button
          onClick={() => handlePresetChange('TOP_10')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedPreset === 'TOP_10'
              ? 'bg-indigo-950/30 border-indigo-500/60 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/30'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
              Scenario B
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">Top 10 High-Impact</h3>
          <p className="text-xs text-zinc-400 mt-1">Strategic core architecture debt reduction.</p>
        </button>

        <button
          onClick={() => handlePresetChange('ALL')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedPreset === 'ALL'
              ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/30'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
              Scenario C
            </span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">Comprehensive Remediation</h3>
          <p className="text-xs text-zinc-400 mt-1">Remediates all identified repository hotspots.</p>
        </button>

        <button
          onClick={() => handlePresetChange('CUSTOM')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedPreset === 'CUSTOM'
              ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/30'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
              Custom
            </span>
            <FileCode2 className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">Targeted File Scope</h3>
          <p className="text-xs text-zinc-400 mt-1">{selectedFilePaths.length} files selected manually below.</p>
        </button>
      </div>

      {/* Simulator Inputs & Key Assumptions */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-base font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Interactive Modeling Assumptions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hourly Rate Slider */}
          <div className="space-y-2 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Loaded Engineering Cost
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {currency === 'INR' ? `₹${hourlyRate.toLocaleString()}` : `${currency} ${hourlyRate}`}
                <span className="text-zinc-500 text-xs font-normal"> /hr</span>
              </span>
            </div>
            <input
              type="range"
              min={currency === 'INR' ? 800 : 25}
              max={currency === 'INR' ? 5000 : 150}
              step={currency === 'INR' ? 100 : 5}
              value={hourlyRate}
              onChange={(e) => {
                const val = Number(e.target.value);
                setHourlyRate(val);
                recompute(selectedFilePaths, val, effectiveness, effortMultiplier, currency);
              }}
              className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>{currency === 'INR' ? '₹800' : '$25'}</span>
              <span>Baseline model assumption</span>
              <span>{currency === 'INR' ? '₹5,000' : '$150'}</span>
            </div>
          </div>

          {/* Remediation Effectiveness Slider */}
          <div className="space-y-2 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Refactoring Effectiveness
              </span>
              <span className="font-mono font-bold text-indigo-400 text-sm">
                {Math.round(effectiveness * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="0.9"
              step="0.05"
              value={effectiveness}
              onChange={(e) => {
                const val = Number(e.target.value);
                setEffectiveness(val);
                recompute(selectedFilePaths, hourlyRate, val, effortMultiplier, currency);
              }}
              className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>40% (Conservative)</span>
              <span>65% (Recommended)</span>
              <span>90% (Aggressive)</span>
            </div>
          </div>

          {/* Effort Multiplier Slider */}
          <div className="space-y-2 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Effort Friction Multiplier
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {effortMultiplier.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={effortMultiplier}
              onChange={(e) => {
                const val = Number(e.target.value);
                setEffortMultiplier(val);
                recompute(selectedFilePaths, hourlyRate, effectiveness, val, currency);
              }}
              className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>0.7x (Familiar code)</span>
              <span>1.0x (Standard)</span>
              <span>1.5x (High legacy risk)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Investment */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Estimated Investment</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono tracking-tight">
            {formatCostRange(activeResult.investmentRange, currency)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span className="font-mono font-semibold text-rose-300">
              {activeResult.estimatedRefactoringHours} hrs
            </span>
            <span>across {activeResult.selectedFilesCount} target files</span>
          </div>
        </div>

        {/* Annual Savings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Potential Annual Savings</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
            {formatCostRange(activeResult.savingsRange, currency)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span>Removes {Math.round(activeResult.remediationEffectiveness * 100)}% of target friction</span>
          </div>
        </div>

        {/* ROI % */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Modeled 2-Year ROI</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono tracking-tight">
            {activeResult.roiPercentage > 0 ? `+${activeResult.roiPercentage}%` : `${activeResult.roiPercentage}%`}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                activeResult.isViable
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {activeResult.isViable ? 'Strong Business Case' : 'Marginal ROI'}
            </span>
          </div>
        </div>

        {/* Payback Horizon */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Payback Horizon</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
            {activeResult.paybackPeriodMonths !== null ? `${activeResult.paybackPeriodMonths} mos` : 'N/A'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span>Debt Score: {selectedAnalysis?.technicalDebtScore ?? 78} → </span>
            <span className="font-bold text-emerald-400">{activeResult.projectedResidualDebtScore}</span>
            <span className="text-[11px] text-zinc-500">(-{activeResult.projectedDebtScoreReduction} pts)</span>
          </div>
        </div>
      </div>

      {/* Scenario Explanation Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-4 flex items-start gap-3 text-xs text-zinc-300">
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Model Decision Trace</span>
            {running && (
              <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
                Simulating model...
              </span>
            )}
          </div>
          <p className="mt-0.5 text-zinc-300">{activeResult.explanation}</p>
        </div>
      </div>

      {/* Comparative Scenario Matrix Table */}
      {presetsComparison && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Strategic Scenario Comparison Matrix
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Compare side-by-side investment requirements, modeled annual returns, and payback velocity across alternative engineering allocations.
              </p>
            </div>
            <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
              Baseline Exposure: {presetsComparison.currency}{' '}
              {presetsComparison.baselineAnnualImpact.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Scenario</th>
                  <th className="py-3 px-3">Scope</th>
                  <th className="py-3 px-3 text-right">Investment</th>
                  <th className="py-3 px-3 text-right">Annual Savings</th>
                  <th className="py-3 px-3 text-right">2-Year Net Benefit</th>
                  <th className="py-3 px-3 text-center">ROI</th>
                  <th className="py-3 px-3 text-center">Payback</th>
                  <th className="py-3 px-3 text-right">Residual Exposure</th>
                  <th className="py-3 px-4 text-center">Viability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                {presetsComparison.scenarios.map((sc, idx) => {
                  const isCurrent = sc.scenarioName === activeResult.scenarioName;
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        isCurrent ? 'bg-indigo-950/20 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-zinc-200">
                        <div className="flex items-center gap-2">
                          {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                          <span className={isCurrent ? 'text-indigo-300 font-bold' : ''}>
                            {sc.scenarioName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{sc.selectedFilesCount} files</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-200">
                        {formatCostRange(sc.investmentRange, presetsComparison?.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                        {formatCostRange(sc.savingsRange, presetsComparison?.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-300">
                        {formatCostRange(sc.netSavingsRange, presetsComparison?.currency)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className={sc.roiPercentage >= 100 ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
                          +{sc.roiPercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-400">
                        {sc.paybackPeriodMonths !== null ? `${sc.paybackPeriodMonths} mos` : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">
                        {formatCostRange(sc.residualCostRange, presetsComparison?.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            sc.isViable
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {sc.isViable ? 'Recommended' : 'Marginal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* File Target Picker for Custom Scenarios */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-emerald-400" />
              Target File Remediation Scope
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select or deselect specific source files to tailor custom remediation sprints and observe immediate ROI updates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search files..."
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => {
                const all = fileMetrics.map((m) => m.filePath);
                setSelectedFilePaths(all);
                setSelectedPreset('ALL');
                recompute(all, hourlyRate, effectiveness, effortMultiplier, currency);
              }}
              className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => {
                const top3 = fileMetrics.slice(0, 3).map((m) => m.filePath);
                setSelectedFilePaths(top3);
                setSelectedPreset('CUSTOM');
                recompute(top3, hourlyRate, effectiveness, effortMultiplier, currency);
              }}
              className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Reset Top 3
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-zinc-800 divide-y divide-zinc-800/60 bg-zinc-950/40">
          {filteredMetrics.map((file) => {
            const isSelected = selectedFilePaths.includes(file.filePath);
            return (
              <div
                key={file.filePath}
                onClick={() => toggleFile(file.filePath)}
                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/40 transition-colors ${
                  isSelected ? 'bg-emerald-950/15' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by parent div
                    className="w-4 h-4 rounded accent-emerald-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-medium text-zinc-200 truncate">
                      {file.filePath}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Complexity: {file.cyclomaticComplexity ?? 'N/A'} | Churn: {file.totalChurn ?? 0} | Defect Commits:{' '}
                      {file.defectFixCommitCount ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-mono text-zinc-400">
                    Debt Score: <span className="text-amber-400 font-semibold">{file.debtScore ?? 50}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      isSelected
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {isSelected ? 'In Scope' : 'Excluded'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assumptions & Governance Footer */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Financial Governance & Decision Safety Notice
        </div>
        <p>
          What-if calculations represent modeled engineering projections based on active Git repository telemetry and user-adjusted compensation rates.
          Remediation effectiveness assumes a target code-quality improvement factor ({Math.round(effectiveness * 100)}%) rather than 100% debt eradication.
          All estimates use ranges ({formatCostRange(activeResult.investmentRange, currency)} investment vs {formatCostRange(activeResult.savingsRange, currency)} annual savings)
          to reflect real-world sprint variance and legacy dependency friction.
        </p>
      </div>
    </div>
  );
}
