'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Flame,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { useRepository } from '../../hooks/useRepositoryContext';
import { PredictiveAssessment, ForecastHorizon } from '../../types';

export default function PredictiveIntelligencePage() {
  const { selectedRepo } = useRepository();
  const repoId = selectedRepo?._id || selectedRepo?.id || 'demo-repo-fintech';

  const [assessment, setAssessment] = useState<PredictiveAssessment | null>(null);
  const [horizon, setHorizon] = useState<ForecastHorizon>('NEXT_ANALYSIS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, string>>({});
  const [traceOpen, setTraceOpen] = useState(false);

  const fetchAssessment = useCallback(async (h: ForecastHorizon, force: boolean = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);

      let res;
      if (force) {
        res = await api.refreshPredictiveAssessment(repoId, h);
      } else {
        res = await api.getPredictiveAssessment(repoId, h);
      }

      if (res && res.data) {
        setAssessment(res.data);
      }
    } catch (err) {
      console.error('Failed to load predictive assessment:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [repoId]);

  useEffect(() => {
    fetchAssessment(horizon);
  }, [fetchAssessment, horizon]);

  const handleFeedback = async (actionId: string, feedback: 'HELPFUL' | 'NOT_HELPFUL' | 'NOT_APPLICABLE') => {
    try {
      await api.submitRecommendationFeedback(actionId, feedback);
      setFeedbackSent((prev) => ({ ...prev, [actionId]: feedback }));
    } catch (err) {
      console.warn('Feedback submit failed:', err);
    }
  };

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
      case 'DECELERATING':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-800';
    }
  };

  if (loading && !assessment) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex flex-col items-center justify-center text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
        <p className="text-sm font-mono">Synthesizing predictive telemetry & multi-cycle models...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
      {/* Top Header & Horizon Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Predictive Engineering Intelligence
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  PHASE 5 CORE
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Deterministic forward-looking risk forecasting, trajectory modeling & Next Best Action dispatch
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Horizon Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Horizon Pills */}
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
                {h === 'NEXT_ANALYSIS' ? 'Next Analysis' : h === 'SHORT_TERM' ? '3 Cycles (Short)' : '6 Cycles (Mid)'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAssessment(horizon, true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{refreshing ? 'Recalculating...' : 'Refresh Forecast'}</span>
          </button>
        </div>
      </div>

      {/* 5 Core Decision Questions Card Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Q1: What is getting worse? */}
        <div className="bg-zinc-900/40 border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Q1 • Trajectory</span>
            <div className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
              <span>Risk Trend</span>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${getTrendBadge(assessment?.riskTrend || 'STABLE')}`}>
                {assessment?.riskTrend}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {assessment?.riskTrend === 'ACCELERATING'
                ? 'Complexity & churn velocity are compounding across cycles.'
                : assessment?.riskTrend === 'WORSENING'
                ? 'Technical debt score exhibits consistent upward drift.'
                : 'Telemetry remains holding or within stable variance bounds.'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">Signal:</span>
            <span className="text-cyan-400 font-medium">AST + Churn Slope</span>
          </div>
        </div>

        {/* Q2: What is likely to become critical? */}
        <div className="bg-zinc-900/40 border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Q2 • Emerging Risks</span>
            <div className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
              <span>Forecast Hotspots</span>
              <span className="text-rose-400 font-mono font-bold">
                {assessment?.predictedCriticalHotspots?.expected ?? 0} Critical
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {assessment?.predictedHotspots?.filter((h) => h.predictedRisk === 'CRITICAL').length || 0} module(s) projected to cross CRITICAL risk threshold.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">Current:</span>
            <span className="text-zinc-300 font-medium">{assessment?.currentCriticalHotspots ?? 0} Critical</span>
          </div>
        </div>

        {/* Q3: What could become more expensive? */}
        <div className="bg-zinc-900/40 border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Q3 • Cost of Inaction</span>
            <div className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
              <span>Potential Drag</span>
              <span className="text-amber-400 font-mono font-bold">
                {assessment?.costOfDoingNothing?.formattedPotentialIncrease ?? '₹0'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Modeled annual capacity drag increases if debt remains unaddressed.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">Classification:</span>
            <span className="text-indigo-400 font-medium">MODELED</span>
          </div>
        </div>

        {/* Q4: What should engineering fix next? */}
        <div className="bg-zinc-900/40 border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Q4 • Remediation</span>
            <div className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
              <span>Next Best Action</span>
              <span className="text-cyan-400 font-mono font-bold">
                {assessment?.recommendedActions?.length ?? 0} Queued
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed truncate">
              {assessment?.recommendedActions?.[0]?.target?.split('/').pop() || 'No pending critical hotspots'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">Est. Effort:</span>
            <span className="text-zinc-300 font-medium">{assessment?.recommendedActions?.[0]?.estimatedEffort?.formatted || 'N/A'}</span>
          </div>
        </div>

        {/* Q5: Are current goals likely to succeed? */}
        <div className="bg-zinc-900/40 border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Q5 • Goals Outlook</span>
            <div className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
              <span>Active Goals</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                assessment?.goalForecasts?.[0]?.status === 'ON TRACK'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {assessment?.goalForecasts?.[0]?.status || 'NO GOALS'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed truncate">
              {assessment?.goalForecasts?.[0]?.title || 'No active engineering goals set'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">Confidence:</span>
            <span className="text-zinc-300 font-medium">{assessment?.confidence || 'MEDIUM'}</span>
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Predictive Risk Score vs Financial Exposure Range */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Predictive Risk Score & Tier Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Predictive Engineering Risk Score</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                DERIVED • 0–100
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 my-4">
            <div className="flex items-baseline gap-3">
              <div className="text-5xl font-black font-mono tracking-tight text-white">
                {assessment?.riskScore ?? 0}
              </div>
              <div className="space-y-1">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${getRiskBadge(assessment?.riskLevel || 'MEDIUM')}`}>
                  {assessment?.riskLevel} RISK
                </span>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Current Debt: <span className="text-zinc-200">{assessment?.currentDebtScore}</span> → Projected:{' '}
                  <span className="text-cyan-400 font-bold">{assessment?.predictedDebtScore?.expected}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 text-xs font-mono space-y-1 min-w-[200px]">
              <div className="text-zinc-500 text-[10px] uppercase">Uncertainty Range ({assessment?.confidence})</div>
              <div className="flex justify-between text-zinc-300">
                <span>Low:</span>
                <span className="text-emerald-400">{assessment?.predictedDebtScore?.low} pts</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Expected:</span>
                <span className="text-cyan-300 font-bold">{assessment?.predictedDebtScore?.expected} pts</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>High:</span>
                <span className="text-rose-400">{assessment?.predictedDebtScore?.high} pts</span>
              </div>
            </div>
          </div>

          {/* Primary Explainable Drivers */}
          <div className="mt-4 pt-4 border-t border-zinc-800/80">
            <div className="text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
              <span>Primary Risk Drivers (Auditable Weights)</span>
              <button
                onClick={() => setTraceOpen(!traceOpen)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{traceOpen ? 'Hide Trace' : 'View Trace'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {assessment?.recommendedActions?.[0]?.riskDrivers?.slice(0, 4).map((driver, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-zinc-950/40 px-3 py-2 rounded-lg border border-zinc-800/60">
                  <span className="text-zinc-300 font-medium">{driver.feature}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-mono">{String(driver.value)}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      driver.direction === 'UP'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      +{driver.contribution} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {traceOpen && assessment?.predictionTrace && (
              <div className="mt-3 p-3 bg-black/60 rounded-xl border border-cyan-900/40 text-[11px] font-mono text-zinc-400 space-y-1">
                <div className="text-cyan-400 font-semibold mb-1">Audit Trail & Trace:</div>
                <div>Model Version: {assessment.predictionTrace.modelVersion}</div>
                <div>Calculation Method: {assessment.predictionTrace.calculationMethod}</div>
                <div>Input Snapshots Evaluated: {assessment.predictionTrace.inputSnapshotIds?.length || 0}</div>
                <div>Generated: {new Date(assessment.generatedAt).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cost of Doing Nothing Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Cost of Doing Nothing</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60">
                FORECASTED MODELED EXPOSURE
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Modeled annual capacity drag projection comparing the current baseline against predicted technical friction across {horizon === 'NEXT_ANALYSIS' ? 'the next analysis cycle' : horizon === 'SHORT_TERM' ? '3 analysis cycles' : '6 analysis cycles'}.
            </p>

            <div className="grid grid-cols-2 gap-4 my-2">
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Current Annual Exposure</div>
                <div className="text-2xl font-bold font-mono text-zinc-200 mt-1">
                  ₹{(assessment?.currentFinancialExposure ? assessment.currentFinancialExposure / 100000 : 0).toFixed(1)}L
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-1">Calibrated Baseline</div>
              </div>

              <div className="bg-zinc-950/60 p-4 rounded-xl border border-amber-900/30">
                <div className="text-[10px] font-mono text-amber-400 uppercase">Forecasted Exposure</div>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  ₹{(assessment?.predictedFinancialExposure?.expected ? assessment.predictedFinancialExposure.expected / 100000 : 0).toFixed(1)}L
                </div>
                <div className="text-[10px] text-amber-400/70 font-mono mt-1">
                  Range: {assessment?.predictedFinancialExposure?.formattedRange}
                </div>
              </div>
            </div>

            {/* Inaction delta callout */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-amber-300">Potential Inaction Increase:</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {assessment?.costOfDoingNothing?.rationale || 'Projected increase in avoidable maintenance friction.'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-amber-400">
                  +{assessment?.costOfDoingNothing?.formattedPotentialIncrease}
                </span>
                <div className="text-[9px] font-mono text-zinc-500">/ YEAR DRAG</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Uncertainty Evaluation:</span>
            <span className="text-cyan-400 font-mono font-medium">{assessment?.confidence} CONFIDENCE</span>
          </div>
        </div>
      </div>

      {/* Emerging Hotspots & Next Best Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emerging Hotspots */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Top Emerging Hotspots (Predictive Ranking)</h3>
            </div>
            <a href="/predictive-hotspots" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-3">
            {assessment?.predictedHotspots?.slice(0, 4).map((hotspot, idx) => (
              <div key={idx} className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold font-mono text-zinc-200">{hotspot.filePath}</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className={`px-1.5 py-0.5 rounded border ${getRiskBadge(hotspot.currentRisk)}`}>
                      {hotspot.currentRisk}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span className={`px-1.5 py-0.5 rounded border font-bold ${getRiskBadge(hotspot.predictedRisk)}`}>
                      {hotspot.predictedRisk}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Complexity: <strong className="text-zinc-200">+{hotspot.complexityGrowthPct}%</strong></span>
                  <span>Churn: <strong className="text-zinc-200">+{hotspot.churnGrowthPct}%</strong></span>
                  <span>Patches: <strong className="text-zinc-200">{hotspot.defectActivityCount} fixes</strong></span>
                </div>

                <div className="text-[11px] text-cyan-400/90 font-mono bg-cyan-950/20 px-2.5 py-1 rounded border border-cyan-900/30">
                  Action: {hotspot.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Best Actions */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Next Best Actions (Explainable Recommendations)</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                AUDITABLE
              </span>
            </div>

            <div className="space-y-3.5">
              {assessment?.recommendedActions?.slice(0, 3).map((act, idx) => (
                <div key={idx} className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono font-bold text-cyan-300">{act.target}</div>
                      <div className="text-xs font-medium text-zinc-200 mt-0.5">{act.recommendation}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700 shrink-0">
                      {act.estimatedEffort?.formatted}
                    </span>
                  </div>

                  <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                    {act.why.slice(0, 2).map((w, wIdx) => (
                      <li key={wIdx}>{w}</li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-mono">Expected: <strong className="text-zinc-300">{act.expectedOutcome}</strong></span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleFeedback(act.actionId, 'HELPFUL')}
                        className={`p-1 rounded hover:bg-zinc-800 ${
                          feedbackSent[act.actionId] === 'HELPFUL' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500'
                        }`}
                        title="Mark Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(act.actionId, 'NOT_HELPFUL')}
                        className={`p-1 rounded hover:bg-zinc-800 ${
                          feedbackSent[act.actionId] === 'NOT_HELPFUL' ? 'text-rose-400 bg-rose-500/10' : 'text-zinc-500'
                        }`}
                        title="Mark Not Helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Capacity Integration:</span>
            <a href="/forecast-scenarios" className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1">
              <span>Run Sprint Capacity Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
