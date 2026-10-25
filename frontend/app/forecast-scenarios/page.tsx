'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  SlidersHorizontal,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Zap,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import { api } from '../../services/api';
import { useRepository } from '../../hooks/useRepositoryContext';
import { WhatIfForecastScenario, CapacityPlanResult } from '../../types';

export default function ForecastScenariosPage() {
  const { selectedRepo } = useRepository();
  const repoId = selectedRepo?._id || selectedRepo?.id || 'demo-repo-fintech';

  const [scenarios, setScenarios] = useState<WhatIfForecastScenario[]>([]);
  const [baseline, setBaseline] = useState<any>(null);
  const [costOfNothing, setCostOfNothing] = useState<any>(null);
  const [capacityHours, setCapacityHours] = useState(80);
  const [capacityPlan, setCapacityPlan] = useState<CapacityPlanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [planningLoading, setPlanningLoading] = useState(false);

  const loadScenarios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.simulatePredictiveScenarios(repoId);
      if (res && res.data) {
        setBaseline(res.data.baselineForecast);
        setCostOfNothing(res.data.costOfDoingNothing);
        setScenarios(res.data.scenarios || []);
      }
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  const runCapacityPlan = useCallback(async (hours: number) => {
    try {
      setPlanningLoading(true);
      const res = await api.planPredictiveCapacity(repoId, hours);
      if (res && res.data) {
        setCapacityPlan(res.data);
      }
    } catch (err) {
      console.error('Failed to plan capacity:', err);
    } finally {
      setPlanningLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    loadScenarios();
    runCapacityPlan(capacityHours);
  }, [loadScenarios, runCapacityPlan, capacityHours]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                &ldquo;What If We Do Nothing?&rdquo; &amp; Capacity Planner
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  SCENARIO SIMULATION
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Model inaction trajectory vs targeted remediation programs constrained by realistic engineering capacity
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            loadScenarios();
            runCapacityPlan(capacityHours);
          }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Simulation</span>
        </button>
      </div>

      {/* Hero Banner: Inaction vs Remediation Callout */}
      <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-purple-950/30 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">The Cost of Doing Nothing</h2>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              If engineering defers technical debt remediation, historical churn velocity and cyclomatic branching are projected to inflate annual maintenance drag from{' '}
              <strong className="text-white">
                ₹{((costOfNothing?.currentAnnualExposure || 0) / 100000).toFixed(1)}L
              </strong>{' '}
              to{' '}
              <strong className="text-amber-300">
                ₹{((costOfNothing?.forecastedAnnualExposure || 0) / 100000).toFixed(1)}L
              </strong>{' '}
              (+{costOfNothing?.formattedPotentialIncrease}/yr).
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 shrink-0 font-mono">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Modeled Increase</div>
              <div className="text-2xl font-black text-amber-400">
                +{costOfNothing?.formattedPotentialIncrease ?? '₹0'}
              </div>
              <div className="text-[10px] text-zinc-500">Unmitigated Inaction</div>
            </div>
            <div className="h-10 w-px bg-zinc-800" />
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Projected Risk Tier</div>
              <div className="text-2xl font-black text-rose-400">
                {baseline?.riskLevel || 'CRITICAL'}
              </div>
              <div className="text-[10px] text-zinc-500">Forecast Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* What-If Scenarios Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Remediation Program Scenario Comparisons</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">ALL ESTIMATES ARE HEURISTIC MODELED PROJECTIONS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((s, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                s.scenarioName === 'DO NOTHING'
                  ? 'bg-rose-950/20 border-rose-900/40'
                  : s.scenarioName.includes('TOP 5')
                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                  : 'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-bold font-mono text-white">{s.scenarioName}</h4>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      s.modeledRiskLevel === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : s.modeledRiskLevel === 'HIGH'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : s.modeledRiskLevel === 'MEDIUM'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {s.modeledRiskLevel} RISK
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-4 min-h-[36px]">{s.description}</p>

                <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Forecasted Exposure:</span>
                    <span className="text-zinc-200 font-bold">
                      ₹{(s.forecastedExposure / 100000).toFixed(1)}L/yr
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Modeled Savings:</span>
                    <span className="text-emerald-400 font-bold">
                      {s.modeledDifference > 0 ? `-${s.formattedDifference}` : '₹0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Investment Effort:</span>
                    <span className="text-cyan-300">{s.remediationEffortHours} hrs</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Uncertainty Range:</span>
                <span className="text-zinc-400">
                  ₹{(s.exposureRange.low / 100000).toFixed(1)}L – ₹{(s.exposureRange.high / 100000).toFixed(1)}L
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Sprint Capacity Planner */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Engineering Sprint Capacity Planner</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Allocate available developer hours against predictive refactoring packages
              </p>
            </div>
          </div>

          {/* Capacity Input Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">Sprint Capacity:</span>
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              {[40, 60, 80, 120].map((h) => (
                <button
                  key={h}
                  onClick={() => {
                    setCapacityHours(h);
                    runCapacityPlan(h);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                    capacityHours === h
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Capacity Summary Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Total Capacity</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {capacityPlan?.sprintCapacityHours ?? capacityHours}h
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Per Sprint</div>
          </div>

          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Allocated Effort</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              {capacityPlan?.allocatedRemediationHours ?? 0}h
            </div>
            <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5">
              {capacityPlan?.utilizationRatePercentage ?? 0}% Utilization
            </div>
          </div>

          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Buffer Remaining</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {capacityPlan?.remainingCapacityHours ?? 0}h
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">For Feature Work</div>
          </div>

          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Modeled Risk Reduction</div>
            <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
              {capacityPlan?.modeledRiskReduction ?? 'MODERATE'}
            </div>
            <div className="text-[10px] text-indigo-400/80 font-mono mt-0.5">Expected Outcome</div>
          </div>
        </div>

        {/* Selected Work Package List */}
        <div>
          <div className="text-xs font-semibold text-zinc-300 mb-3 font-mono">
            RECOMMENDED SPRINT WORK PACKAGE ({capacityPlan?.selectedActions?.length || 0} ITEMS ALLOCATED)
          </div>

          <div className="space-y-2.5">
            {capacityPlan?.selectedActions && capacityPlan.selectedActions.length > 0 ? (
              capacityPlan.selectedActions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-zinc-950/70 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono font-bold text-cyan-300 flex items-center gap-2">
                      <span>#{idx + 1}</span>
                      <span>{item.target}</span>
                    </div>
                    <div className="text-zinc-400 text-[11px]">{item.recommendation}</div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                    <span className="text-zinc-300 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700">
                      {item.estimatedEffort?.expectedHours} hrs allocated
                    </span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      IN SPRINT
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No items allocated under current sprint capacity constraint.
              </div>
            )}
          </div>

          {capacityPlan?.unallocatedActions && capacityPlan.unallocatedActions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800/60 text-xs text-zinc-500 font-mono">
              Deferred to next sprint cycle: {capacityPlan.unallocatedActions.map((a) => a.target.split('/').pop()).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
