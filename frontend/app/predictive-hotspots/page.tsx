'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Flame,
  Search,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useRepository } from '../../hooks/useRepositoryContext';
import { PredictedHotspot } from '../../types';

export default function PredictiveHotspotsPage() {
  const { selectedRepo } = useRepository();
  const repoId = selectedRepo?._id || selectedRepo?.id || 'demo-repo-fintech';

  const [hotspots, setHotspots] = useState<PredictedHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [trendFilter, setTrendFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'financial' | 'riskDelta' | 'complexity'>('financial');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getPredictiveHotspots(repoId, 'NEXT_ANALYSIS');
      if (res && res.data) {
        setHotspots(res.data.predictedHotspots || []);
      }
    } catch (err) {
      console.error('Failed to load predictive hotspots:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredHotspots = useMemo(() => {
    return hotspots
      .filter((h) => {
        const matchesSearch = h.filePath.toLowerCase().includes(search.toLowerCase());
        const matchesRisk = riskFilter === 'ALL' || h.predictedRisk === riskFilter;
        const matchesTrend = trendFilter === 'ALL' || h.riskTrend === trendFilter;
        return matchesSearch && matchesRisk && matchesTrend;
      })
      .sort((a, b) => {
        if (sortBy === 'financial') return b.financialExposure - a.financialExposure;
        if (sortBy === 'complexity') return b.complexityGrowthPct - a.complexityGrowthPct;
        return (b.churnGrowthPct || 0) - (a.churnGrowthPct || 0);
      });
  }, [hotspots, search, riskFilter, trendFilter, sortBy]);

  const getRiskBadge = (tier: string) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'ACCELERATING':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/80 font-bold';
      case 'WORSENING':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      case 'IMPROVING':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-800';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Predictive Hotspots & File-Level Risk
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60">
                  TRAJECTORY RANKING
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Prioritizes files with high current risk + rapid deterioration over stable legacy modules
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter files by path or module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Risk Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-mono text-[11px]">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Trend Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-mono text-[11px]">Trend:</span>
            <select
              value={trendFilter}
              onChange={(e) => setTrendFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Trends</option>
              <option value="ACCELERATING">Accelerating</option>
              <option value="WORSENING">Worsening</option>
              <option value="STABLE">Stable</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-mono text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'financial' | 'riskDelta' | 'complexity')}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="financial">Financial Impact</option>
              <option value="complexity">Complexity Growth</option>
              <option value="riskDelta">Churn Volatility</option>
            </select>
          </div>
        </div>
      </div>

      {/* Predictive Hotspots Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-[11px] font-mono text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Target File / Module</th>
                <th className="py-3.5 px-3 font-semibold">Current → Forecast</th>
                <th className="py-3.5 px-3 font-semibold">Risk Trend</th>
                <th className="py-3.5 px-3 font-semibold">Modeled Impact</th>
                <th className="py-3.5 px-3 font-semibold">Effort</th>
                <th className="py-3.5 px-3 font-semibold">Confidence</th>
                <th className="py-3.5 px-4 font-semibold">Primary Drivers & Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredHotspots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No predictive hotspots matched the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredHotspots.map((h, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                    {/* File Path */}
                    <td className="py-3.5 px-4 font-medium text-zinc-200">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400">{h.filePath.split('/').pop()}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate max-w-xs">{h.filePath}</div>
                    </td>

                    {/* Current -> Predicted */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded border ${getRiskBadge(h.currentRisk)}`}>
                          {h.currentRisk}
                        </span>
                        <ArrowRight className="w-3 h-3 text-zinc-500" />
                        <span className={`px-1.5 py-0.5 rounded border font-bold ${getRiskBadge(h.predictedRisk)}`}>
                          {h.predictedRisk}
                        </span>
                      </div>
                    </td>

                    {/* Trend */}
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${getTrendBadge(h.riskTrend)}`}>
                        {h.riskTrend}
                      </span>
                    </td>

                    {/* Modeled Financial Exposure */}
                    <td className="py-3.5 px-3 text-zinc-200 font-semibold">
                      ₹{(h.financialExposure / 100000).toFixed(1)}L
                      <div className="text-[10px] text-zinc-500 font-normal">/ year friction</div>
                    </td>

                    {/* Estimated Effort */}
                    <td className="py-3.5 px-3 text-zinc-300">
                      {h.predictedRisk === 'CRITICAL' ? '16–36 hrs' : h.predictedRisk === 'HIGH' ? '12–24 hrs' : '6–16 hrs'}
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {h.confidence}
                      </span>
                    </td>

                    {/* Primary Driver & Action */}
                    <td className="py-3.5 px-4 font-sans text-xs">
                      <div className="text-zinc-300 font-medium">
                        {h.primaryDrivers?.[0] || 'High churn volatility and rising cyclomatic complexity'}
                      </div>
                      <div className="text-[11px] text-cyan-400/90 font-mono mt-0.5">
                        ↳ {h.recommendedAction}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
