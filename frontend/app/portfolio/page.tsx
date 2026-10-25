'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { PortfolioSummary, RepositoryPortfolioItem, CurrencyCode } from '../../types';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Flame,
  ShieldCheck,
  ArrowRight,
  Layers,
  GitBranch,
  Sparkles,
  Activity,
} from 'lucide-react';
import { LoadingState, ErrorState } from '../../components/States';

export default function PortfolioPage() {
  const router = useRouter();
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'STANDARD' | 'PREDICTIVE'>('STANDARD');
  const [sortBy, setSortBy] = useState<'EXPOSURE' | 'PREDICTIVE_RISK' | 'ACCELERATION'>('EXPOSURE');

  const loadPortfolio = async (curr: CurrencyCode) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPortfolio(curr);
      setData(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load organizational debt portfolio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio(currency);
  }, [currency]);

  if (loading && !data) {
    return <LoadingState message="Aggregating organizational technical debt portfolio and financial exposure..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'No portfolio data found.'} onRetry={() => loadPortfolio(currency)} />;
  }

  const {
    totalRepositories,
    totalExposureRange,
    formattedTotalExposure,
    formattedTotalSavings,
    averageDebtScore,
    highestRiskRepository,
    highestOpportunityRepository,
    repositories,
  } = data;

  const filteredRepos = repositories.filter((r) => {
    if (filterTier === 'ALL') return true;
    return r.opportunityTier === filterTier;
  });

  const sortedRepos = [...filteredRepos].sort((a, b) => {
    if (sortBy === 'PREDICTIVE_RISK') {
      return (b.predictiveRiskScore || 0) - (a.predictiveRiskScore || 0);
    }
    if (sortBy === 'ACCELERATION') {
      const getTrendRank = (t?: string) => (t === 'ACCELERATING' ? 3 : t === 'WORSENING' ? 2 : t === 'STABLE' ? 1 : 0);
      return getTrendRank(b.riskTrend) - getTrendRank(a.riskTrend);
    }
    return b.annualFinancialExposure - a.annualFinancialExposure;
  });

  const getTierColor = (tier: RepositoryPortfolioItem['opportunityTier']) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'MODERATE':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'LOW':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Enterprise Decision Support
            </span>
            <span className="text-xs text-zinc-500 font-mono">Portfolio Engine v1.0</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            Engineering Debt Portfolio
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Cross-repository financial exposure, technical-debt accumulation, and refactoring opportunity ranking
            across all connected organization services.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex items-center gap-1 shadow-inner">
            {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
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

      {/* Portfolio Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Portfolio Exposure */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Portfolio Annual Exposure</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono tracking-tight">
            {formattedTotalExposure || totalExposureRange?.formatted || 'N/A'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span>Across</span>
            <span className="font-semibold text-zinc-200">{totalRepositories} repositories</span>
          </div>
        </div>

        {/* Total Modeled Savings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Modeled Annual Opportunity</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
            {formattedTotalSavings}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span>Potential recovery with 65% remediation</span>
          </div>
        </div>

        {/* Highest Risk Service */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Highest Risk Repository</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-zinc-100 truncate">
            {highestRiskRepository?.name ?? 'None'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span>Debt Score:</span>
            <span className="font-bold text-rose-400">{highestRiskRepository?.debtScore ?? 'N/A'}/100</span>
          </div>
        </div>

        {/* Portfolio Average Debt */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Average Portfolio Health</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono tracking-tight">
            {averageDebtScore}
            <span className="text-xs font-normal text-zinc-500"> / 100</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span>Highest ROI:</span>
            <span className="font-medium text-emerald-400 truncate">
              {highestOpportunityRepository?.name ?? 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Relative Exposure Distribution */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Financial Impact Distribution Across Repositories
          </h2>
          <span className="text-xs text-zinc-400">Relative contribution to annual maintenance friction</span>
        </div>

        <div className="space-y-3 pt-2">
          {repositories.map((repo) => {
            const pct = data.totalDebtExposure > 0
              ? Math.round((repo.annualFinancialExposure / data.totalDebtExposure) * 100)
              : 0;
            return (
              <div key={repo.repositoryId} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200">{repo.name}</span>
                    <span className="text-[11px] text-zinc-500 font-mono">({repo.owner})</span>
                    {repo.isDemo && (
                      <span className="text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800/60 px-1.5 py-0.2 rounded">
                        DEMO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-300 font-semibold">{repo.formattedExposure}</span>
                    <span className="font-mono text-zinc-500 w-10 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      repo.opportunityTier === 'CRITICAL'
                        ? 'bg-rose-500'
                        : repo.opportunityTier === 'HIGH'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Repository Portfolio Detailed Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Repository Comparative Intelligence
              </h2>
              <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setViewMode('STANDARD')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    viewMode === 'STANDARD'
                      ? 'bg-zinc-800 text-zinc-100 shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Financial Position
                </button>
                <button
                  onClick={() => setViewMode('PREDICTIVE')}
                  className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === 'PREDICTIVE'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Predictive Trajectory
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {viewMode === 'PREDICTIVE'
                ? 'Forecasted engineering risk trajectory, modeled exposure drift, and emerging hotspot outlook.'
                : 'Ranked overview of technical debt severity, modeled annual exposure, and refactoring returns by service.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Options */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-zinc-500">Rank By:</span>
              <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setSortBy('EXPOSURE')}
                  className={`px-2 py-0.5 text-[11px] rounded ${
                    sortBy === 'EXPOSURE' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  Exposure
                </button>
                <button
                  onClick={() => setSortBy('PREDICTIVE_RISK')}
                  className={`px-2 py-0.5 text-[11px] rounded ${
                    sortBy === 'PREDICTIVE_RISK' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  Risk Score
                </button>
                <button
                  onClick={() => setSortBy('ACCELERATION')}
                  className={`px-2 py-0.5 text-[11px] rounded ${
                    sortBy === 'ACCELERATION' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  Acceleration
                </button>
              </div>
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 font-medium">Tier:</span>
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTier(t)}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      filterTier === t
                        ? 'bg-zinc-800 text-zinc-100 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
              {viewMode === 'PREDICTIVE' ? (
                <tr>
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-3 text-center">Debt Score</th>
                  <th className="py-3 px-3 text-center">Predictive Risk</th>
                  <th className="py-3 px-3 text-center">Forecast Tier</th>
                  <th className="py-3 px-3 text-center">Risk Trend</th>
                  <th className="py-3 px-3 text-right">Current Exposure</th>
                  <th className="py-3 px-3 text-right">Forecasted Exposure</th>
                  <th className="py-3 px-3 text-center">Emerging Hotspots</th>
                  <th className="py-3 px-3 text-center">Goal Outlook</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-3 text-center">Debt Score</th>
                  <th className="py-3 px-3 text-center">Critical Hotspots</th>
                  <th className="py-3 px-3 text-right">Annual Impact</th>
                  <th className="py-3 px-3 text-right">Potential Savings</th>
                  <th className="py-3 px-3">Primary Cost Driver</th>
                  <th className="py-3 px-3 text-center">ROI</th>
                  <th className="py-3 px-3 text-center">Opportunity Tier</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
              {sortedRepos.map((r) => (
                <tr key={r.repositoryId} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-zinc-200">{r.name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                          <GitBranch className="w-3 h-3" />
                          {r.defaultBranch || 'main'} • {r.totalFiles} files
                        </p>
                      </div>
                      {r.isDemo && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
                          DEMO
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`font-mono font-bold text-sm ${
                        r.debtScore >= 75
                          ? 'text-rose-400'
                          : r.debtScore >= 50
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {r.debtScore}
                    </span>
                    <span className="text-[10px] text-zinc-500"> /100</span>
                  </td>

                  {viewMode === 'PREDICTIVE' ? (
                    <>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-sm ${
                            (r.predictiveRiskScore || 0) >= 75
                              ? 'text-rose-400'
                              : (r.predictiveRiskScore || 0) >= 50
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {r.predictiveRiskScore ?? 65}
                        </span>
                        <span className="text-[10px] text-zinc-500"> /100</span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            r.predictiveRiskLevel === 'CRITICAL'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                              : r.predictiveRiskLevel === 'HIGH'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {r.predictiveRiskLevel || 'HIGH'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-[11px]">
                        {r.riskTrend === 'ACCELERATING' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800 font-bold">
                            ↑↑ ACCELERATING
                          </span>
                        ) : r.riskTrend === 'WORSENING' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800 font-semibold">
                            ↑ WORSENING
                          </span>
                        ) : r.riskTrend === 'IMPROVING' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800 font-semibold">
                            ↓ IMPROVING
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            → STABLE
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-zinc-300">
                        {r.formattedExposure}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-amber-300 font-bold">
                        {r.formattedForecastedExposure || r.formattedExposure}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-amber-400 font-bold">
                          {r.emergingCriticalHotspots ?? r.criticalHotspotsCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.goalOutlook === 'ON_TRACK'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {r.goalOutlook || 'AT RISK'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => router.push('/predictive-intelligence')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/70 transition-colors"
                        >
                          Forecast
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3.5 px-3 text-center font-mono text-zinc-300">
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-bold text-amber-400">
                          {r.criticalHotspotsCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-zinc-200 font-semibold">
                        {r.formattedExposure}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-bold">
                        {r.formattedSavings}
                      </td>

                      <td className="py-3.5 px-3 text-zinc-300">
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px]">
                          {r.primaryCostDriver}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-indigo-400 font-bold">
                        +{r.refactoringROI}%
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTierColor(r.opportunityTier)}`}>
                          {r.opportunityTier}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => router.push('/financial-intelligence')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/70 transition-colors"
                        >
                          Inspect
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Governance & Compliance Footer */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Portfolio Financial Intelligence Disclaimer
        </div>
        <p>
          Portfolio-level values aggregate financial estimates across all accessible repositories using standardized engineering
          friction models and configured compensation assumptions. Repositories marked DEMO utilize synthetic benchmark telemetry.
          Estimates are designed for prioritization and engineering sprint budgeting, not GAAP balance-sheet reporting.
        </p>
      </div>
    </div>
  );
}
