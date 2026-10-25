'use client';

import React, { useState, useEffect } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { TrendPoint } from '../../types';
import { RepositoryStatus } from '../../components/RepositoryStatus';
import { TrendCharts } from '../../components/TrendCharts';
import { LoadingState, ErrorState } from '../../components/States';
import { LineChart, History, Calendar, GitCommit } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/utils';

export default function TrendsPage() {
  const { selectedRepo, selectedRepoId, setSelectedRepoId, repositories, analysis } =
    useRepository();

  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getTrends(selectedRepoId);
        setTrends(res.data);
      } catch (err) {
        console.warn('Trends fetch error:', err);
        setError('Failed to fetch historical trends from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [selectedRepoId]);

  if (loading) {
    return <LoadingState message="Reconstructing historical technical debt telemetry..." />;
  }

  return (
    <div className="space-y-6">
      <RepositoryStatus
        repository={selectedRepo}
        analysis={analysis}
        repositories={repositories}
        onSelectRepo={setSelectedRepoId}
      />

      {error && <ErrorState message={error} />}

      {/* Intro Header */}
      <div className="flex items-center space-x-2 pb-2">
        <LineChart className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-zinc-100">Historical Telemetry Evolution</h2>
      </div>

      {/* Trend Charts */}
      {trends.length > 0 && <TrendCharts trends={trends} />}

      {/* Historical Milestones Table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Telemetry Snapshot Log</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">Monthly Milestones</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/50 text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Commit Hash</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4">Debt Hours</th>
                <th className="py-3 px-4">Avoidable Cost</th>
                <th className="py-3 px-4">Hotspot Count</th>
                <th className="py-3 px-4">Lines of Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {trends.map((item) => (
                <tr key={item._id || item.id} className="hover:bg-zinc-850 transition-colors">
                  <td className="py-3 px-4 font-mono text-zinc-200">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400">
                    {item.commitHash}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-zinc-100">
                    {item.healthScore}/100
                  </td>
                  <td className="py-3 px-4 font-mono text-rose-300">
                    {item.totalDebtHours} hrs
                  </td>
                  <td className="py-3 px-4 font-mono text-amber-300">
                    {formatCurrency(item.avoidableAnnualCost)}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-300">
                    {item.hotspotCount} ({item.criticalHotspots} critical)
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-300">
                    {formatNumber(item.linesOfCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
