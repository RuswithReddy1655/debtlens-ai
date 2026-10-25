'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Target,
  RefreshCw,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { api } from '../../services/api';
import { useRepository } from '../../hooks/useRepositoryContext';
import { ForecastHorizon, PredictiveAssessment, AccuracyReport } from '../../types';

export default function ForecastsPage() {
  const { selectedRepo } = useRepository();
  const repoId = selectedRepo?._id || selectedRepo?.id || 'demo-repo-fintech';

  const [horizon, setHorizon] = useState<ForecastHorizon>('NEXT_ANALYSIS');
  const [assessment, setAssessment] = useState<PredictiveAssessment | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (h: ForecastHorizon) => {
    try {
      setLoading(true);
      const [assessRes, accRes] = await Promise.all([
        api.getPredictiveAssessment(repoId, h),
        api.getPredictiveAccuracy(repoId),
      ]);

      if (assessRes && assessRes.data) setAssessment(assessRes.data);
      if (accRes && accRes.data) setAccuracy(accRes.data);
    } catch (err) {
      console.error('Failed to load forecasts:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    loadData(horizon);
  }, [loadData, horizon]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
      {/* Top Header & Horizon Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Multi-Horizon Telemetry Forecasts
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  STATISTICAL EXTRAPOLATION
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Deterministic trajectories calibrated across sequential Git commits and AST analysis snapshots
              </p>
            </div>
          </div>
        </div>

        {/* Horizon Tabs */}
        <div className="flex items-center gap-2">
          <div className="bg-zinc-900/90 p-1 rounded-lg border border-zinc-800 flex items-center gap-1 text-xs">
            {(['NEXT_ANALYSIS', 'SHORT_TERM', 'MEDIUM_TERM'] as ForecastHorizon[]).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-md font-mono text-[11px] font-medium transition-all ${
                  horizon === h
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {h === 'NEXT_ANALYSIS' ? 'Next Analysis (1 Cycle)' : h === 'SHORT_TERM' ? 'Short Term (3 Cycles)' : 'Medium Term (6 Cycles)'}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(horizon)}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
            title="Reload Forecasts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Core Numeric Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Technical Debt Score Forecast */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Technical Debt Score</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                0–100 PTS
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-4xl font-black font-mono text-white">
                {assessment?.predictedDebtScore?.expected ?? 0}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                pts (from {assessment?.currentDebtScore})
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mt-2">
              Extrapolated composite technical debt score based on recent AST complexity and churn velocity.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 bg-zinc-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">Uncertainty Bounds (LOW • EXPECTED • HIGH)</div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400">Low: {assessment?.predictedDebtScore?.low}</span>
              <span className="text-cyan-300 font-bold">Exp: {assessment?.predictedDebtScore?.expected}</span>
              <span className="text-rose-400">High: {assessment?.predictedDebtScore?.high}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Financial Exposure Forecast */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Modeled Annual Exposure</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                FORECASTED
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-4xl font-black font-mono text-amber-400">
                ₹{((assessment?.predictedFinancialExposure?.expected || 0) / 100000).toFixed(1)}L
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                / year (now ₹{((assessment?.currentFinancialExposure || 0) / 100000).toFixed(1)}L)
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mt-2">
              Projected annual engineering capacity drag under current development cadence.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 bg-zinc-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">Uncertainty Bounds (INR Lakhs)</div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400">Low: ₹{((assessment?.predictedFinancialExposure?.low || 0) / 100000).toFixed(1)}L</span>
              <span className="text-amber-300 font-bold">Exp: ₹{((assessment?.predictedFinancialExposure?.expected || 0) / 100000).toFixed(1)}L</span>
              <span className="text-rose-400">High: ₹{((assessment?.predictedFinancialExposure?.high || 0) / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </div>

        {/* Card 3: Critical Hotspot Count Forecast */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Critical Hotspots Count</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                EMERGING
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-4xl font-black font-mono text-rose-400">
                {assessment?.predictedCriticalHotspots?.expected ?? 0}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                files (now {assessment?.currentCriticalHotspots ?? 0})
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mt-2">
              Projected count of files meeting critical cyclomatic complexity and volatile churn criteria.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 bg-zinc-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">Uncertainty Bounds (LOW • EXPECTED • HIGH)</div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400">Low: {assessment?.predictedCriticalHotspots?.low}</span>
              <span className="text-cyan-300 font-bold">Exp: {assessment?.predictedCriticalHotspots?.expected}</span>
              <span className="text-rose-400">High: {assessment?.predictedCriticalHotspots?.high}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Goals Forecast Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Engineering Goals Forecast</h2>
          </div>
          <a href="/goals" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono">
            Manage Goals →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment?.goalForecasts && assessment.goalForecasts.length > 0 ? (
            assessment.goalForecasts.map((g, idx) => (
              <div key={idx} className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">{g.title}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    g.status === 'ON TRACK'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : g.status === 'AT RISK'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {g.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-zinc-400">
                    <span>Progress: <strong>{g.currentProgress}%</strong></span>
                    <span>Required Pace: <strong>{g.requiredProgress}%</strong></span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(100, g.currentProgress)}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 font-sans pt-1">
                  {g.rationale}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-zinc-500 text-xs">
              No active engineering goals configured. Create goals in the Engineering Goals module.
            </div>
          )}
        </div>
      </div>

      {/* Prediction Accuracy & Self-Improving Verification Tracker */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Prediction Quality & Accuracy Tracker</h2>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
            AUDITABLE BACKTESTING
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed mb-5">
          DebtLens evaluates its own predictive forecasts when future repository analysis snapshots arrive, comparing projected uncertainty ranges against observed code telemetry.
        </p>

        {/* 4 Accuracy Metric Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Composite Accuracy</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {accuracy?.overallAccuracyPercentage ?? 0}%
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Weighted Metric</div>
          </div>

          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Range Coverage</div>
            <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
              {accuracy?.rangeCoveragePercentage ?? 0}%
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Actual in [Low, High]</div>
          </div>

          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Directional Accuracy</div>
            <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
              {accuracy?.directionalAccuracyPercentage ?? 0}%
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Trend Direction Match</div>
          </div>

          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Evaluated Forecasts</div>
            <div className="text-2xl font-black font-mono text-zinc-200 mt-1">
              {accuracy?.totalEvaluated ?? 0}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Sample Size</div>
          </div>
        </div>

        <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-center justify-between">
          <span>{accuracy?.summary || 'Tracking prediction evaluation results...'}</span>
          <span className="text-cyan-400 font-semibold">{accuracy?.confidence} EVALUATION CONFIDENCE</span>
        </div>
      </div>
    </div>
  );
}
