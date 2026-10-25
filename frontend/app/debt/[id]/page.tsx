'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { DebtItem, DebtItemStatus, VerificationResult } from '@/types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  GitPullRequest,
  GitCommit,
  ShieldAlert,
  TrendingDown,
  RotateCw,
  ExternalLink,
  DollarSign,
  FileCode,
  Shield,
  Layers,
} from 'lucide-react';

const ORDERED_STAGES: DebtItemStatus[] = [
  'DETECTED',
  'PRIORITIZED',
  'PLANNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
];

function DebtItemDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [item, setItem] = useState<DebtItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Action tracking inputs
  const [assignee, setAssignee] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [workNotes, setWorkNotes] = useState('');

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getDebtItemById(id);
      if (res.data) {
        setItem(res.data);
        setAssignee(res.data.assignedTo || '');
        setTargetDate(res.data.targetDate ? res.data.targetDate.substring(0, 10) : '');
        setCommitSha(res.data.resolutionCommitSha || '');
        setPrUrl(res.data.pullRequestUrl || '');
        setWorkNotes(res.data.notes || '');
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load debt item.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleTransition = async (targetStatus: DebtItemStatus) => {
    if (!item) return;
    try {
      const res = await api.updateDebtStatus(item.debtItemId || item._id, targetStatus, 'Lifecycle stage transition');
      setItem(res.data);
      setNotification({ type: 'success', message: `Moved to ${targetStatus}` });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Illegal state transition.' });
    }
  };

  const handleSaveAssignment = async () => {
    if (!item) return;
    try {
      const res = await api.assignDebtItem(item.debtItemId || item._id, assignee, targetDate || undefined);
      setItem(res.data);
      setNotification({ type: 'success', message: 'Assignment updated successfully.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update assignment.' });
    }
  };

  const handleLinkWork = async () => {
    if (!item) return;
    try {
      const res = await api.linkDebtWork(item.debtItemId || item._id, {
        commitSha,
        prUrl,
        branch: 'main',
      });
      setItem(res.data);
      setNotification({ type: 'success', message: 'Pull Request & Commit traceability linked.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to link engineering work.' });
    }
  };

  const handleVerify = async () => {
    if (!item) return;
    try {
      setVerifying(true);
      const res = await api.verifyDebtItem(item.debtItemId || item._id);
      setVerificationResult(res.data);
      setNotification({
        type: 'success',
        message: `Verification complete: ${res.data.verificationStatus}`,
      });
      fetchDetail();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Verification audit failed.' });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-zinc-500 text-xs">
        Loading debt item telemetry & lifecycle data...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-16 text-center">
        <h2 className="text-sm font-semibold text-zinc-300">Debt Item Not Found</h2>
        <Link href="/debt" className="text-cyan-400 text-xs mt-2 inline-block">
          ← Return to Debt Lifecycle
        </Link>
      </div>
    );
  }

  const currentStageIndex = ORDERED_STAGES.indexOf(item.currentStatus);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Navigation & Header */}
      <div>
        <Link href="/debt" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-cyan-400 transition mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Technical Debt Registry
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {item.category} DEBT
              </span>
              <span className="text-zinc-500 text-xs font-mono">ID: {item.debtItemId}</span>
            </div>
            <h1 className="text-2xl font-black text-zinc-100 font-mono tracking-tight flex items-center gap-2">
              <FileCode className="w-6 h-6 text-cyan-400" />
              {item.filePath}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Symbol Target: <span className="text-zinc-200 font-semibold">{item.symbolName || 'module'}</span> • Priority Score: {item.priorityScore} / 100
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              Run Before/After Audit
            </button>
          </div>
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

      {/* LIFECYCLE PROGRESSION STEPPER */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Debt Item Lifecycle State Machine
          </div>
          <span className="text-xs font-mono text-zinc-400">Current: <span className="text-cyan-400 font-bold">{item.currentStatus}</span></span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {ORDERED_STAGES.map((stage, idx) => {
            const isPassed = currentStageIndex >= idx;
            const isCurrent = item.currentStatus === stage;

            return (
              <div
                key={stage}
                onClick={() => handleTransition(stage)}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-950/50 scale-[1.02]'
                    : isPassed
                    ? 'bg-zinc-900/80 border-emerald-800/60 text-emerald-300 hover:border-emerald-600'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <div className="text-[10px] font-mono text-zinc-500">STAGE {idx + 1}</div>
                <div className="text-xs font-bold font-mono mt-0.5">{stage}</div>
                <div className="text-[9px] mt-1 text-zinc-500">
                  {isCurrent ? '● Active' : isPassed ? '✓ Complete' : 'Upcoming'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Evidence & Financial */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Technical Evidence */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Observed Technical Evidence & Baseline Signals
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Baseline Complexity</div>
                <div className="text-2xl font-black text-zinc-100 mt-1 font-mono">
                  {item.baselineMetrics?.complexity || 28}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">AST Cyclomatic Density</div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Defect Fix Rework</div>
                <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
                  {item.defectActivity || 4}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Bug Fix Commits</div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Commit Churn Frequency</div>
                <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">
                  {item.changeFrequency || 2.4}/mo
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Change Volatility</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
              <span className="font-semibold text-zinc-100">Why This Matters:</span> This module demonstrates compound maintenance drag.
              The high cyclomatic branches combined with recurrent bug-fix commits create continuous regression risk and developer friction.
            </div>
          </div>

          {/* Section 2: Modeled Financial Impact */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Modeled Financial Impact & Remediation Economics
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/50">
                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Modeled Annual Exposure</div>
                <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">
                  ₹{(item.financialImpact || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-500/80 mt-1 font-mono">MODELED VALUE • NOT ACCOUNTING FACT</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Estimated Remediation Investment</div>
                <div className="text-2xl font-black text-zinc-200 mt-1 font-mono">
                  {item.estimatedEffortHours || 16} hrs
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">₹{(item.estimatedCost || ((item.estimatedEffortHours || 16) * 2000)).toLocaleString()} modeled cost</div>
              </div>
            </div>
          </div>

          {/* Section 5: Verification Results */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Automated Before / After Verification Audit
            </h2>

            {item.verificationStatus === 'VERIFIED' ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  VERIFIED TECHNICAL IMPROVEMENT
                </div>
                <p className="text-xs text-zinc-300">
                  {item.verificationDetails?.message || 'Re-analysis verified meaningful complexity reduction across codebase.'}
                </p>
                <div className="text-[11px] font-mono text-emerald-400/90 pt-1 border-t border-emerald-900/50">
                  Complexity Reduction: {item.verificationDetails?.complexityReductionPct || 35}% • Hotspot Δ: {item.verificationDetails?.hotspotScoreDelta || 25} points
                </div>
              </div>
            ) : item.verificationStatus === 'NOT_VERIFIED' ? (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/80 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  NOT VERIFIED (REGRESSION DETECTED)
                </div>
                <p className="text-xs text-zinc-300">
                  {item.verificationDetails?.message || 'Resolution was claimed but re-analysis telemetry shows complexity did not improve.'}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-2">
                <div>Status: <span className="font-mono text-zinc-200">{item.verificationStatus || 'PENDING'}</span></div>
                <p className="text-zinc-500">
                  Trigger an automated verification audit to compare baseline AST complexity with the latest repository analysis.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Action Tracking & Traceability Form */}
        <div className="space-y-6">
          {/* Assignment Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Engineering Assignment
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Assignee</label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="e.g. Lead Architect or Team Name"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Target Resolution Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <button
                onClick={handleSaveAssignment}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
              >
                Save Assignment
              </button>
            </div>
          </div>

          {/* Traceability Linking Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-indigo-400" />
              Git Work Traceability
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Resolution Commit SHA</label>
                <input
                  type="text"
                  value={commitSha}
                  onChange={(e) => setCommitSha(e.target.value)}
                  placeholder="e.g. 7c9a1b4"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Pull Request URL</label>
                <input
                  type="text"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  placeholder="https://github.com/org/repo/pull/184"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Refactoring Notes</label>
                <textarea
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  rows={3}
                  placeholder="Explain architectural changes applied..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleLinkWork}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-950/40"
              >
                Link Traceability Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DebtItemDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-16 text-center text-zinc-500 text-xs font-mono">
          Loading debt item telemetry & lifecycle data...
        </div>
      }
    >
      <DebtItemDetailContent />
    </React.Suspense>
  );
}
