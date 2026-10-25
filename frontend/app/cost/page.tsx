'use client';

import React, { useState, useEffect } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { FinancialValuation } from '../../types';
import { RepositoryStatus } from '../../components/RepositoryStatus';
import { CostBreakdown } from '../../components/CostBreakdown';
import { LoadingState, ErrorState } from '../../components/States';
import { DollarSign, ShieldAlert, Sparkles, Scale, Info } from 'lucide-react';

export default function CostPage() {
  const {
    selectedRepo,
    selectedRepoId,
    setSelectedRepoId,
    repositories,
    analysis,
    financialRate,
    setFinancialRate,
  } = useRepository();

  const [valuation, setValuation] = useState<FinancialValuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getCost(selectedRepoId, financialRate);
        setValuation(res.data);
      } catch (err) {
        console.warn('Cost fetch error:', err);
        setError('Failed to fetch financial cost valuation from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchCost();
  }, [selectedRepoId, financialRate]);

  if (loading) {
    return <LoadingState message="Recalibrating engineering economics and financial debt models..." />;
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
      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
          <Scale className="w-5 h-5" />
          <span>DebtLens Algorithmic Financial Engine</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
          Technical debt is translated into concrete capital metrics through transparent heuristic
          formulas. Four distinct quadrants distinguish upfront capital investment from past
          sunk costs, avoidable ongoing drag, and multi-year refactoring returns.
        </p>
      </div>

      {/* Cost Breakdown with interactive slider & 4 quadrants */}
      {valuation && (
        <CostBreakdown
          valuation={valuation}
          onRateChange={(rate) => setFinancialRate(rate)}
        />
      )}
    </div>
  );
}
