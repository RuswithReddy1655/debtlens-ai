'use client';

import React, { useState, useEffect } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { FileMetric, Hotspot } from '../../types';
import { Heatmap } from '../../components/Heatmap';
import { FileDetailPanel } from '../../components/FileDetailPanel';
import { RepositoryStatus } from '../../components/RepositoryStatus';
import { LoadingState, ErrorState } from '../../components/States';

export default function HeatmapPage() {
  const { selectedRepo, selectedRepoId, setSelectedRepoId, repositories, analysis, financialRate } =
    useRepository();

  const [files, setFiles] = useState<FileMetric[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileMetric | Hotspot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getMetrics(selectedRepoId);
        setFiles(res.data);
      } catch (err) {
        console.warn('Heatmap fetch error:', err);
        setError('Failed to fetch file telemetry from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [selectedRepoId]);

  if (loading) {
    return <LoadingState message="Constructing multi-dimensional debt heatmap..." />;
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

      <Heatmap
        files={files}
        onSelectFile={(file) => setSelectedFile(file)}
        hourlyRate={financialRate}
      />

      <FileDetailPanel
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        hourlyRate={financialRate}
      />
    </div>
  );
}
