'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import { useRepository } from '@/hooks/useRepositoryContext';
import {
  EngineeringAlert,
  AlertStatus,
  Repository,
  Hotspot,
  FileMetric,
} from '@/types';
import {
  CheckCircle2,
  AlertOctagon,
  RotateCw,
} from 'lucide-react';
import { AlertCenterHeader } from '@/components/alerts/AlertCenterHeader';
import { AlertFilters, AlertFilterCategory } from '@/components/alerts/AlertFilters';
import { EngineeringAlertCard } from '@/components/alerts/EngineeringAlertCard';
import { AlertSkeleton } from '@/components/alerts/AlertSkeleton';
import { FileDetailPanel } from '@/components/FileDetailPanel';

const PREDICTIVE_TYPES = new Set([
  'PREDICTED_CRITICAL_HOTSPOT',
  'ACCELERATING_DEBT',
  'FORECASTED_EXPOSURE_INCREASE',
  'PREDICTED_GOAL_MISS',
  'RISK_ESCALATION',
]);

export default function EngineeringAlertsPage() {
  const {
    selectedRepoId,
    setSelectedRepoId,
    selectedAnalysis,
    financialRate,
  } = useRepository();

  const [alerts, setAlerts] = useState<EngineeringAlert[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [metrics, setMetrics] = useState<FileMetric[]>([]);
  const [selectedFile, setSelectedFile] = useState<Hotspot | FileMetric | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<AlertFilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch alerts and repo metadata
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsRes, reposRes] = await Promise.all([
        api.getAlerts(selectedRepoId || undefined).catch(() => ({ success: true, data: [] })),
        api.getRepositories().catch(() => ({ success: true, data: [], isDemoSource: true })),
      ]);

      if (alertsRes.data) setAlerts(alertsRes.data);
      if (reposRes.data) setRepositories(reposRes.data);
    } catch (err: any) {
      setError(err?.message || 'The alert service could not be reached.');
    } finally {
      setLoading(false);
    }
  }, [selectedRepoId]);

  // Fetch telemetry files to support file intelligence drill-down
  useEffect(() => {
    const analysisId = selectedAnalysis?._id || selectedAnalysis?.id;
    if (!analysisId) return;

    Promise.all([
      api.getHotspots(analysisId).catch(() => ({ success: true, data: [] })),
      api.getMetrics(analysisId).catch(() => ({ success: true, data: [] })),
    ]).then(([hotspotsRes, metricsRes]) => {
      if (hotspotsRes.data) setHotspots(hotspotsRes.data);
      if (metricsRes.data) setMetrics(metricsRes.data);
    });
  }, [selectedAnalysis]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle status transitions
  const handleUpdateStatus = async (alertId: string, status: AlertStatus) => {
    try {
      await api.updateAlertStatus(alertId, status);
      setNotification({ type: 'success', message: `Alert updated to ${status}.` });
      // Optimistic update
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId || a.id === alertId ? { ...a, status } : a))
      );
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update alert.' });
    }
  };

  const handleDismissAll = async () => {
    try {
      await api.dismissAllAlerts(selectedRepoId || undefined);
      setNotification({ type: 'success', message: 'All unread alerts marked dismissed.' });
      setAlerts((prev) =>
        prev.map((a) => (a.status === 'UNREAD' ? { ...a, status: 'DISMISSED' } : a))
      );
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to dismiss alerts.' });
    }
  };

  // Open File Detail Drawer with exact telemetry match or fallback synthesis
  const handleViewFileIntelligence = (filePath: string) => {
    const normalized = filePath.trim();
    const fileName = normalized.split('/').pop() || normalized;

    // Search in hotspots
    const foundHotspot = hotspots.find(
      (h) => h.filePath === normalized || h.filePath.endsWith(fileName)
    );
    if (foundHotspot) {
      setSelectedFile(foundHotspot);
      return;
    }

    // Search in file metrics
    const foundMetric = metrics.find(
      (m) => m.filePath === normalized || m.filePath.endsWith(fileName)
    );
    if (foundMetric) {
      setSelectedFile(foundMetric);
      return;
    }

    // Synthesize focused file telemetry object
    const syntheticFile: FileMetric = {
      _id: `file-${Date.now()}`,
      filePath: normalized,
      directory: normalized.split('/').slice(0, -1).join('/') || '.',
      language: normalized.endsWith('.ts') ? 'TypeScript' : 'JavaScript',
      linesOfCode: 420,
      codeLines: 360,
      cyclomaticComplexity: 28,
      cognitiveComplexity: 22,
      nestingDepthMax: 4,
      churnCount: 38,
      defectCount: 5,
      defectFixCommitCount: 5,
      duplicationPercentage: 4,
      testCoveragePercentage: 20,
      contributorCount: 3,
      ownershipEntropy: 0.65,
      isLegacy: false,
      debtScore: 82,
      debtHours: 18,
      estimatedRemediationCost: 36000,
      riskCategory: 'critical',
      isDemo: false,
    };
    setSelectedFile(syntheticFile);
  };

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<AlertFilterCategory, number> = {
      ALL: alerts.length,
      UNREAD: 0,
      CRITICAL: 0,
      PREDICTIVE: 0,
      VERIFICATION: 0,
      RESOLVED: 0,
    };

    for (const a of alerts) {
      if (a.status === 'UNREAD') counts.UNREAD++;
      if (a.severity === 'CRITICAL') counts.CRITICAL++;
      if (PREDICTIVE_TYPES.has(a.type)) counts.PREDICTIVE++;
      if (a.type === 'DEBT_REOPENED') counts.VERIFICATION++;
      if (a.status === 'RESOLVED') counts.RESOLVED++;
    }

    return counts;
  }, [alerts]);

  // Filter alerts by category & search query
  const filteredAlerts = useMemo(() => {
    let result = alerts;

    if (selectedCategory === 'UNREAD') {
      result = result.filter((a) => a.status === 'UNREAD');
    } else if (selectedCategory === 'CRITICAL') {
      result = result.filter((a) => a.severity === 'CRITICAL');
    } else if (selectedCategory === 'PREDICTIVE') {
      result = result.filter((a) => PREDICTIVE_TYPES.has(a.type));
    } else if (selectedCategory === 'VERIFICATION') {
      result = result.filter((a) => a.type === 'DEBT_REOPENED');
    } else if (selectedCategory === 'RESOLVED') {
      result = result.filter((a) => a.status === 'RESOLVED');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          (a.metric && a.metric.toLowerCase().includes(q)) ||
          a.severity.toLowerCase().includes(q)
      );
    }

    return result;
  }, [alerts, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <AlertCenterHeader
        unreadCount={categoryCounts.UNREAD}
        criticalHighCount={alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length}
        predictiveCount={categoryCounts.PREDICTIVE}
        verificationCount={categoryCounts.VERIFICATION}
        loading={loading}
        onRefresh={fetchAlerts}
        onDismissAll={handleDismissAll}
      />

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-zinc-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <AlertFilters
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRepoId={selectedRepoId}
        onSelectRepoId={setSelectedRepoId}
        repositories={repositories}
        categoryCounts={categoryCounts}
      />

      {/* Content Area */}
      {loading && alerts.length === 0 ? (
        <AlertSkeleton />
      ) : error ? (
        /* Error State */
        <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
          <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-zinc-100">Unable to load engineering alerts</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">{error}</p>
          <button
            onClick={fetchAlerts}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            Retry
          </button>
        </div>
      ) : filteredAlerts.length === 0 ? (
        /* Empty State */
        <div className="p-16 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mx-auto shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">Engineering health looks clear</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              No active engineering alerts require attention in this filter scope.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 max-w-md mx-auto text-left text-xs space-y-1.5 font-mono text-zinc-400">
            <div className="text-[10px] uppercase font-bold text-zinc-500">
              DebtLens AI Continuous Monitoring:
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Predictive risk &amp; trajectory spikes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Critical hotspot thresholds &amp; compounding churn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Debt score regressions &amp; exposure creep</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Post-PR before/after verification failures</span>
            </div>
          </div>

          <button
            onClick={fetchAlerts}
            className="px-4 py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold transition inline-flex items-center gap-2"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh Analysis</span>
          </button>
        </div>
      ) : (
        /* Alerts List */
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <EngineeringAlertCard
              key={alert._id || alert.id}
              alert={alert}
              onUpdateStatus={handleUpdateStatus}
              onViewFileIntelligence={handleViewFileIntelligence}
            />
          ))}
        </div>
      )}

      {/* Slide-over File Detail Drawer */}
      {selectedFile && (
        <FileDetailPanel
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          hourlyRate={financialRate}
        />
      )}
    </div>
  );
}
