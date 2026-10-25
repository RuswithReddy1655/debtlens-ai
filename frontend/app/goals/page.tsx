'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { EngineeringGoal, GoalMetric, GoalStatus, Repository } from '@/types';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

const METRIC_LABELS: Record<GoalMetric, { label: string; unit: string; lowerIsBetter: boolean }> = {
  CRITICAL_HOTSPOTS: { label: 'Critical Hotspots Count', unit: 'hotspots', lowerIsBetter: true },
  TECHNICAL_DEBT_SCORE: { label: 'Technical Debt Score', unit: 'pts', lowerIsBetter: true },
  ANNUAL_EXPOSURE: { label: 'Modeled Annual Financial Exposure', unit: '₹', lowerIsBetter: true },
  HIGH_PRIORITY_DEBT: { label: 'High Priority Debt Items', unit: 'items', lowerIsBetter: true },
  AVERAGE_COMPLEXITY: { label: 'Average AST Cyclomatic Complexity', unit: '', lowerIsBetter: true },
};

const STATUS_BADGES: Record<GoalStatus, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: 'bg-cyan-950/70', text: 'text-cyan-400', border: 'border-cyan-800' },
  ACHIEVED: { bg: 'bg-emerald-950/70', text: 'text-emerald-400', border: 'border-emerald-800' },
  MISSED: { bg: 'bg-rose-950/70', text: 'text-rose-400', border: 'border-rose-800' },
  PAUSED: { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-800' },
  CANCELLED: { bg: 'bg-zinc-900', text: 'text-zinc-500', border: 'border-zinc-800' },
};

export default function EngineeringGoalsPage() {
  const [goals, setGoals] = useState<EngineeringGoal[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metric, setMetric] = useState<GoalMetric>('CRITICAL_HOTSPOTS');
  const [startingValue, setStartingValue] = useState<number>(10);
  const [targetValue, setTargetValue] = useState<number>(4);
  const [unit, setUnit] = useState('hotspots');
  const [targetDate, setTargetDate] = useState('');
  const [formRepoId, setFormRepoId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const [goalsRes, reposRes] = await Promise.all([
        api.getGoals(selectedRepoId || undefined).catch(() => ({ success: true, data: [] })),
        api.getRepositories().catch(() => ({ success: true, data: [], isDemoSource: true })),
      ]);

      if (goalsRes.data) setGoals(goalsRes.data);
      if (reposRes.data) {
        setRepositories(reposRes.data);
        if (reposRes.data.length > 0 && !formRepoId) {
          setFormRepoId(reposRes.data[0]._id || reposRes.data[0].id || 'repo-default');
        }
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load goals.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [selectedRepoId]);

  const handleCreateGoal = async () => {
    if (!title || !metric) return;
    try {
      setSubmitting(true);
      await api.createGoal({
        repositoryId: formRepoId || 'repo-default',
        title,
        description,
        metric,
        startingValue: Number(startingValue),
        targetValue: Number(targetValue),
        unit: unit || METRIC_LABELS[metric].unit,
        targetDate: targetDate || new Date(Date.now() + 30 * 86400000).toISOString(),
        createdBy: 'Engineering Lead',
      });

      setNotification({ type: 'success', message: `Goal "${title}" registered.` });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      fetchGoals();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to create goal.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to remove this engineering goal?')) return;
    try {
      await api.deleteGoal(goalId);
      setNotification({ type: 'success', message: 'Goal removed.' });
      fetchGoals();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete goal.' });
    }
  };

  const handleStatusUpdate = async (goalId: string, status: GoalStatus) => {
    try {
      await api.updateGoal(goalId, { status });
      setNotification({ type: 'success', message: `Status updated to ${status}.` });
      fetchGoals();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update goal.' });
    }
  };

  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const achievedGoals = goals.filter((g) => g.status === 'ACHIEVED');
  const atRiskGoals = goals.filter((g) => g.status === 'ACTIVE' && g.progressPercentage < 30);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              PHASE 4: ENGINEERING GOALS
            </span>
            <span className="text-zinc-500 text-xs font-mono">CONTINUOUS MEASUREMENT ENGINE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Engineering Goals & SLA Targets</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Establish measurable debt reduction targets, track progress automatically against analysis snapshots, and verify outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="">All Repositories</option>
            {repositories.map((r) => (
              <option key={r._id || r.id} value={r._id || r.id}>
                {r.owner}/{r.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            Set New Goal
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-zinc-200">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Total Active Goals</div>
          <div className="text-3xl font-black text-cyan-400 mt-2 font-mono">{activeGoals.length}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Automated Tracking On</div>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/50">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Targets Achieved
          </div>
          <div className="text-3xl font-black text-emerald-300 mt-2 font-mono">{achievedGoals.length}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Verified Against Code Telemetry</div>
        </div>
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/50">
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            At-Risk / Low Progress
          </div>
          <div className="text-3xl font-black text-amber-300 mt-2 font-mono">{atRiskGoals.length}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">&lt;30% Progress to Deadline</div>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Historical Total</div>
          <div className="text-3xl font-black text-zinc-100 mt-2 font-mono">{goals.length}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Across all repositories</div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            Engineering Goal Portfolio ({goals.length})
          </h2>
          <button
            onClick={fetchGoals}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-zinc-500 text-xs">Loading engineering goals...</div>
        ) : goals.length === 0 ? (
          <div className="p-16 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <Target className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No Goals Created Yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-4">
              Set your first measurable engineering goal (e.g. reduce critical hotspots by 40% or lower debt score below 60).
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Set First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => {
              const badge = STATUS_BADGES[g.status] || STATUS_BADGES.ACTIVE;
              const meta = METRIC_LABELS[g.metric] || { label: g.metric, unit: '', lowerIsBetter: true };
              const isAchieved = g.status === 'ACHIEVED';

              return (
                <div
                  key={g._id || g.id}
                  className={`p-6 rounded-2xl border transition shadow-sm space-y-4 ${
                    isAchieved
                      ? 'bg-emerald-950/20 border-emerald-900/60 shadow-emerald-950/30'
                      : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {g.status}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{meta.label}</span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-100">{g.title}</h3>
                      {g.description && <p className="text-xs text-zinc-400 mt-0.5">{g.description}</p>}
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(g._id || g.id!)}
                      title="Delete Goal"
                      className="text-zinc-600 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">Progress</span>
                      <span className={`font-bold ${isAchieved ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {g.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isAchieved
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, g.progressPercentage))}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Range: Starting -> Current -> Target */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-center font-mono">
                    <div>
                      <div className="text-[9px] text-zinc-500 uppercase">Starting</div>
                      <div className="text-xs font-bold text-zinc-400 mt-0.5">
                        {g.startingValue} {g.unit}
                      </div>
                    </div>
                    <div className="border-x border-zinc-800/80">
                      <div className="text-[9px] text-zinc-500 uppercase">Current</div>
                      <div className={`text-xs font-extrabold mt-0.5 ${isAchieved ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {g.currentValue} {g.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-500 uppercase">Target</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">
                        {g.targetValue} {g.unit}
                      </div>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Target: {new Date(g.targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>

                    <select
                      value={g.status}
                      onChange={(e) => handleStatusUpdate(g._id || g.id!, e.target.value as any)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-zinc-300 focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ACHIEVED">ACHIEVED</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="MISSED">MISSED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Define Engineering Goal
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Target Repository</label>
                <select
                  value={formRepoId}
                  onChange={(e) => setFormRepoId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {repositories.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.owner}/{r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Goal Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Reduce Critical Hotspots below 5"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Metric Target</label>
                <select
                  value={metric}
                  onChange={(e) => {
                    const m = e.target.value as GoalMetric;
                    setMetric(m);
                    setUnit(METRIC_LABELS[m].unit);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="CRITICAL_HOTSPOTS">CRITICAL_HOTSPOTS — Reduce count of critical hotspots</option>
                  <option value="TECHNICAL_DEBT_SCORE">TECHNICAL_DEBT_SCORE — Lower overall debt index</option>
                  <option value="ANNUAL_EXPOSURE">ANNUAL_EXPOSURE — Reduce modeled annual financial burden</option>
                  <option value="HIGH_PRIORITY_DEBT">HIGH_PRIORITY_DEBT — Reduce high-priority debt count</option>
                  <option value="AVERAGE_COMPLEXITY">AVERAGE_COMPLEXITY — Lower codebase AST complexity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Starting Value</label>
                  <input
                    type="number"
                    value={startingValue}
                    onChange={(e) => setStartingValue(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Target Value</label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Context for engineering sprint..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                disabled={!title || submitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Activate Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
