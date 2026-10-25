'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { DebtItem, DebtItemStatus, DebtPriorityTier, Repository } from '@/types';
import {
  CheckSquare,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  ChevronRight,
  TrendingDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const STATUS_COLORS: Record<DebtItemStatus, string> = {
  DETECTED: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  PRIORITIZED: 'bg-amber-950/60 text-amber-400 border-amber-800',
  PLANNED: 'bg-blue-950/60 text-blue-400 border-blue-800',
  IN_PROGRESS: 'bg-indigo-950/60 text-indigo-400 border-indigo-800',
  RESOLVED: 'bg-cyan-950/60 text-cyan-400 border-cyan-800',
  VERIFIED: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
  WONT_FIX: 'bg-zinc-900 text-zinc-500 border-zinc-800',
  ACCEPTED_RISK: 'bg-purple-950/60 text-purple-400 border-purple-800',
  REOPENED: 'bg-rose-950/60 text-rose-400 border-rose-800',
};

const PRIORITY_COLORS: Record<DebtPriorityTier, string> = {
  CRITICAL: 'bg-rose-950/80 text-rose-400 border-rose-800',
  HIGH: 'bg-amber-950/80 text-amber-400 border-amber-800',
  MEDIUM: 'bg-blue-950/80 text-blue-400 border-blue-800',
  LOW: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
  MONITOR: 'bg-zinc-900 text-zinc-400 border-zinc-800',
};

export default function DebtManagementPage() {
  const [debtItems, setDebtItems] = useState<DebtItem[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priorityScore' | 'financialImpact' | 'lastDetectedAt'>('priorityScore');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const [itemsRes, reposRes] = await Promise.all([
        api.getDebtItems({
          repositoryId: selectedRepoId || undefined,
          status: selectedStatus,
          priority: selectedPriority,
          category: selectedCategory,
        }).catch(() => ({ success: true, data: [] })),
        api.getRepositories().catch(() => ({ success: true, data: [], isDemoSource: true })),
      ]);

      if (itemsRes.data) setDebtItems(itemsRes.data);
      if (reposRes.data) setRepositories(reposRes.data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load debt items.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedRepoId, selectedStatus, selectedPriority, selectedCategory]);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await api.updateDebtStatus(itemId, newStatus, 'Status changed via Debt Tracker');
      setNotification({ type: 'success', message: `Transitioned status to ${newStatus}` });
      fetchItems();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Invalid state transition.' });
    }
  };

  const sortedItems = [...debtItems].sort((a, b) => {
    if (sortBy === 'priorityScore') return (b.priorityScore || 0) - (a.priorityScore || 0);
    if (sortBy === 'financialImpact') return (b.financialImpact || 0) - (a.financialImpact || 0);
    return new Date(b.lastDetectedAt).getTime() - new Date(a.lastDetectedAt).getTime();
  });

  const totalTracked = debtItems.length;
  const criticalCount = debtItems.filter((i) => i.priority === 'CRITICAL').length;
  const inProgressCount = debtItems.filter((i) => i.currentStatus === 'IN_PROGRESS' || i.currentStatus === 'PLANNED').length;
  const verifiedCount = debtItems.filter((i) => i.currentStatus === 'VERIFIED').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              PHASE 4: ACTION & TRACKING
            </span>
            <span className="text-zinc-500 text-xs font-mono">STATE MACHINE LIFECYCLE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Technical Debt Lifecycle Management</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track code hotspots as stable, resilient engineering debt items through planning, resolution, and verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/verification"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Verification Center
          </Link>
          <Link
            href="/goals"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Engineering Goals
          </Link>
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

      {/* Debt Lifecycle Pipeline Visualization */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Engineering Debt State Lifecycle</span>
            <span className="text-[10px] font-mono text-zinc-500">Deterministic Governance Workflow</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Branch: WONT_FIX</span>
            <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/60">Branch: ACCEPTED_RISK</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { stage: 'DETECTED', label: '1. Detected', desc: 'Identified via AST/Git' },
            { stage: 'PRIORITIZED', label: '2. Prioritized', desc: 'Weighted Multi-factor' },
            { stage: 'PLANNED', label: '3. Planned', desc: 'Sprint / Goal Linked' },
            { stage: 'IN_PROGRESS', label: '4. In Progress', desc: 'Branch / PR Active' },
            { stage: 'RESOLVED', label: '5. Resolved', desc: 'PR Merged / Refactored' },
            { stage: 'VERIFIED', label: '6. Verified', desc: 'Telemetry Confirmed ≥20%' },
          ].map((item, idx) => {
            const count = debtItems.filter((d) => d.currentStatus === item.stage).length;
            const isSelected = selectedStatus === item.stage;
            return (
              <button
                key={item.stage}
                onClick={() => setSelectedStatus(selectedStatus === item.stage ? 'ALL' : item.stage)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/50'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold">{item.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    {count}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1 truncate">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-sm">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Tracked Debt Items</div>
          <div className="text-3xl font-black text-zinc-100 mt-2">{totalTracked}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Persistent Across Line Shifts</div>
        </div>
        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/50 shadow-sm">
          <div className="text-xs font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Critical Priority
          </div>
          <div className="text-3xl font-black text-rose-300 mt-2">{criticalCount}</div>
          <div className="text-[11px] text-rose-500/80 mt-1">High Complexity + Active Churn</div>
        </div>
        <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-900/50 shadow-sm">
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            In Flight / Planned
          </div>
          <div className="text-3xl font-black text-indigo-300 mt-2">{inProgressCount}</div>
          <div className="text-[11px] text-indigo-400/80 mt-1">Work Associated & Assigned</div>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 shadow-sm">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Verified Reductions
          </div>
          <div className="text-3xl font-black text-emerald-300 mt-2">{verifiedCount}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Confirmed by Re-analysis Telemetry</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Repository Selector */}
          <select
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Repositories</option>
            {repositories.map((r) => (
              <option key={r._id || r.id} value={r._id || r.id}>
                {r.owner}/{r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="DETECTED">DETECTED</option>
            <option value="PRIORITIZED">PRIORITIZED</option>
            <option value="PLANNED">PLANNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REOPENED">REOPENED</option>
            <option value="WONT_FIX">WONT_FIX</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Categories</option>
            <option value="COMPLEXITY">COMPLEXITY</option>
            <option value="CHURN">CHURN</option>
            <option value="DEFECT">DEFECT</option>
            <option value="LEGACY">LEGACY</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="priorityScore">Priority Score</option>
            <option value="financialImpact">Financial Impact</option>
            <option value="lastDetectedAt">Last Seen</option>
          </select>
        </div>
      </div>

      {/* Debt Items Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-zinc-500 text-xs">Loading tracked technical debt items...</div>
        ) : sortedItems.length === 0 ? (
          <div className="p-16 text-center">
            <CheckSquare className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No Debt Items Matching Filters</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Run a repository analysis or adjust filters to view persistent technical debt items.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 font-mono border-b border-zinc-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">File & Identity</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Lifecycle State</th>
                  <th className="py-3 px-4">Modeled Annual Exposure</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {sortedItems.map((item) => {
                  return (
                    <tr key={item.debtItemId || item._id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4">
                        <Link
                          href={`/debt/${item.debtItemId || item._id}`}
                          className="font-semibold text-zinc-100 hover:text-cyan-400 transition font-mono flex items-center gap-1.5"
                        >
                          {item.filePath}
                          <ExternalLink className="w-3 h-3 text-zinc-600" />
                        </Link>
                        <div className="text-[10px] font-mono text-zinc-500">
                          ID: {item.debtItemId} • Symbol: {item.symbolName || 'module'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-300">
                        <span className="px-2 py-0.5 rounded bg-zinc-800/70 border border-zinc-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            PRIORITY_COLORS[item.priority] || 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {item.priority} ({item.priorityScore})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.currentStatus}
                          onChange={(e) => handleStatusChange(item.debtItemId || item._id, e.target.value)}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border focus:outline-none ${
                            STATUS_COLORS[item.currentStatus] || 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <option value="DETECTED">DETECTED</option>
                          <option value="PRIORITIZED">PRIORITIZED</option>
                          <option value="PLANNED">PLANNED</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="VERIFIED">VERIFIED</option>
                          <option value="REOPENED">REOPENED</option>
                          <option value="WONT_FIX">WONT_FIX</option>
                          <option value="ACCEPTED_RISK">ACCEPTED_RISK</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-200">
                        <div className="font-semibold text-emerald-400">
                          ₹{(item.financialImpact || 0).toLocaleString()} / yr
                        </div>
                        <div className="text-[10px] text-zinc-500">MODELED • {item.estimatedEffortHours || 8}h effort</div>
                      </td>
                      <td className="py-3 px-4">
                        {item.assignedTo ? (
                          <div className="flex items-center gap-1.5 text-zinc-200">
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{item.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-mono text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                            item.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : item.verificationStatus === 'PARTIALLY_VERIFIED'
                              ? 'bg-amber-950 text-amber-400 border-amber-800'
                              : item.verificationStatus === 'NOT_VERIFIED'
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                          }`}
                        >
                          {item.verificationStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/debt/${item.debtItemId || item._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3 text-zinc-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
