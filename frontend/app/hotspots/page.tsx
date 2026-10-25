'use client';

import React, { useState, useEffect } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { Hotspot, FileMetric } from '../../types';
import { RepositoryStatus } from '../../components/RepositoryStatus';
import { HotspotTable } from '../../components/HotspotTable';
import { FileDetailPanel } from '../../components/FileDetailPanel';
import { LoadingState, ErrorState } from '../../components/States';
import { Flame, ShieldAlert, Cpu, GitCommit } from 'lucide-react';

export default function HotspotsPage() {
  const { selectedRepo, selectedRepoId, setSelectedRepoId, repositories, analysis, financialRate } =
    useRepository();

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedFile, setSelectedFile] = useState<Hotspot | FileMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotspots = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getHotspots(selectedRepoId);
        setHotspots(res.data);
      } catch (err) {
        console.warn('Hotspots fetch error:', err);
        setError('Failed to fetch hotspots from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchHotspots();
  }, [selectedRepoId]);

  if (loading) {
    return <LoadingState message="Ranking technical debt hotspots..." />;
  }

  const criticalCount = hotspots.filter((h) => h.riskLevel === 'critical').length;
  const highCount = hotspots.filter((h) => h.riskLevel === 'high').length;

  return (
    <div className="space-y-6">
      <RepositoryStatus
        repository={selectedRepo}
        analysis={analysis}
        repositories={repositories}
        onSelectRepo={setSelectedRepoId}
      />

      {error && <ErrorState message={error} />}

      {/* Explainer / Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400">Critical Priority Hotspots</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{criticalCount} files</div>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400">High Priority Hotspots</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{highCount} files</div>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400">Formula Intersect</div>
            <div className="text-xs font-mono text-cyan-300 mt-0.5">Complexity × Churn × Silo</div>
          </div>
        </div>
      </div>

      {/* Hotspots Table */}
      <HotspotTable
        hotspots={hotspots}
        onSelectHotspot={(hotspot) => setSelectedFile(hotspot)}
        hourlyRate={financialRate}
      />

      {/* Detail Slide-over */}
      <FileDetailPanel
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        hourlyRate={financialRate}
      />
    </div>
  );
}
