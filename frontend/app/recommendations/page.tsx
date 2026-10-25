'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { Recommendation } from '../../types';
import { RepositoryStatus } from '../../components/RepositoryStatus';
import { RecommendationCard } from '../../components/RecommendationCard';
import { LoadingState, ErrorState } from '../../components/States';
import { Lightbulb, Filter, Sparkles } from 'lucide-react';

export default function RecommendationsPage() {
  const { selectedRepo, selectedRepoId, setSelectedRepoId, repositories, analysis, financialRate } =
    useRepository();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getRecommendations(selectedRepoId);
        setRecommendations(res.data);
      } catch (err) {
        console.warn('Recommendations fetch error:', err);
        setError('Failed to fetch recommendations from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, [selectedRepoId]);

  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchPri = selectedPriority === 'all' || r.priority === selectedPriority;
      return matchCat && matchPri;
    });
  }, [recommendations, selectedCategory, selectedPriority]);

  if (loading) {
    return <LoadingState message="Synthesizing ROI-prioritized refactoring proposals..." />;
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

      {/* Header and Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span>Targeted Refactoring Proposals</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Prioritized by return on engineering investment, payback timeline, and regression risk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 text-xs"
          >
            <option value="all">All Categories</option>
            <option value="architecture">Architecture</option>
            <option value="refactoring">Refactoring</option>
            <option value="testing">Testing</option>
            <option value="ownership">Ownership</option>
            <option value="dependency">Dependency</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 text-xs"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4">
        {filteredRecs.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-xs text-zinc-500">
            No recommendations match the selected filters.
          </div>
        ) : (
          filteredRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              hourlyRate={financialRate}
            />
          ))
        )}
      </div>
    </div>
  );
}
