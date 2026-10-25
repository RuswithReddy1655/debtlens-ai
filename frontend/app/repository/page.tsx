'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { AnalysisJobStatus } from '../../types';
import {
  GitBranch,
  Plus,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertCircle,
  Star,
  Clock,
  X,
  FileCode2,
  GitCommit,
  ShieldCheck,
  RotateCw,
  StopCircle,
  ArrowRight,
  Sparkles,
  Users,
  Building,
  CheckSquare,
  Square,
  Search,
  Lock,
} from 'lucide-react';

function getRelativeTime(isoDate: string, nowMs: number): string {
  try {
    const diffMs = nowMs - new Date(isoDate).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Updated recently';
    if (diffHours < 24) return `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Updated ${diffDays}d ago`;
  } catch {
    return 'Recently updated';
  }
}

interface DiscoveredRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
  relativeTime: string;
  isPrivate: boolean;
  defaultBranch: string;
}

export default function RepositoryPage() {
  const { repositories, selectedRepoId, setSelectedRepoId, refresh } = useRepository();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'single' | 'profile' | 'org'>('single');
  
  // Single Repo Form State
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    url: '',
    defaultBranch: 'main',
    description: '',
  });

  // Discovery State (Profile / Org)
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredRepos, setDiscoveredRepos] = useState<DiscoveredRepo[]>([]);
  const [selectedDiscovered, setSelectedDiscovered] = useState<Set<string>>(new Set());
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Active analysis tracking state
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [activeJobStatus, setActiveJobStatus] = useState<AnalysisJobStatus | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-detect URL type
  const handleUrlInput = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    setFormData((prev) => ({ ...prev, url: trimmed }));

    try {
      const clean = trimmed.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');
      const parts = clean.split('/').filter(Boolean);
      if (parts.length === 1 && trimmed.includes('github.com')) {
        // Likely Profile or Org
        setDiscoveryUrl(trimmed);
      } else if (parts.length >= 2) {
        setFormData((prev) => ({
          ...prev,
          url: trimmed,
          name: prev.name || parts[1],
          owner: prev.owner || parts[0],
        }));
      }
    } catch {
      // Ignore parsing errors
    }
  };

  // Discover repositories from public GitHub Profile or Organization
  const handleDiscover = async () => {
    if (!discoveryUrl.trim()) return;
    setIsDiscovering(true);
    setDiscoveryError(null);
    setDiscoveredRepos([]);
    setSelectedDiscovered(new Set());

    try {
      const clean = discoveryUrl.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '');
      const target = clean.split('/')[0];
      if (!target) {
        throw new Error('Please enter a valid GitHub profile or organization URL.');
      }

      // Query GitHub API (tries orgs then users)
      let res = await fetch(`https://api.github.com/orgs/${target}/repos?per_page=15&sort=updated`);
      if (res.status === 404) {
        res = await fetch(`https://api.github.com/users/${target}/repos?per_page=15&sort=updated`);
      }

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please configure the repository URL directly.');
        }
        throw new Error(`Unable to fetch repositories for '${target}'. Verify the username/org or check your network.`);
      }

      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error(`No public repositories found for '${target}'.`);
      }

      const now = Date.now();
      const parsed: DiscoveredRepo[] = items.map((r: any) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        owner: r.owner?.login || target,
        url: r.clone_url || r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        updatedAt: r.updated_at,
        relativeTime: getRelativeTime(r.updated_at, now),
        isPrivate: r.private,
        defaultBranch: r.default_branch || 'main',
      }));

      setDiscoveredRepos(parsed);
      // Pre-select top 3
      const initialSelected = new Set(parsed.slice(0, 3).map((p) => p.fullName));
      setSelectedDiscovered(initialSelected);
    } catch (err: any) {
      setDiscoveryError(err.message || 'Failed to discover repositories.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const toggleSelectRepo = (fullName: string) => {
    setSelectedDiscovered((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else {
        next.add(fullName);
      }
      return next;
    });
  };

  const selectAllDiscovered = () => {
    if (selectedDiscovered.size === discoveredRepos.length) {
      setSelectedDiscovered(new Set());
    } else {
      setSelectedDiscovered(new Set(discoveredRepos.map((r) => r.fullName)));
    }
  };

  // Register single repository
  const handleRegisterSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const trimmedUrl = formData.url.trim();
      if (!trimmedUrl) {
        throw new Error('Repository URL is required.');
      }

      if (!trimmedUrl.startsWith('https://')) {
        throw new Error('Only secure HTTPS Git repository URLs are supported (e.g. https://github.com/org/repo.git).');
      }

      const res = await api.createRepository({
        name: formData.name.trim() || undefined,
        owner: formData.owner.trim() || undefined,
        url: trimmedUrl,
        defaultBranch: formData.defaultBranch || 'main',
        description: formData.description.trim() || undefined,
      });

      await refresh();
      setShowModal(false);
      setFormData({ name: '', owner: '', url: '', defaultBranch: 'main', description: '' });

      if (res.data?._id || res.data?.id) {
        const newRepoId = res.data._id || res.data.id || '';
        setSelectedRepoId(newRepoId);
        handleTriggerAnalysis(newRepoId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register repository.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register multiple discovered repositories
  const handleRegisterSelectedDiscovered = async () => {
    if (selectedDiscovered.size === 0) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const toRegister = discoveredRepos.filter((r) => selectedDiscovered.has(r.fullName));
      let lastRepoId = '';

      for (const repo of toRegister) {
        const res = await api.createRepository({
          name: repo.name,
          owner: repo.owner,
          url: repo.url,
          defaultBranch: repo.defaultBranch,
          description: repo.description || undefined,
        });
        if (res.data?._id || res.data?.id) {
          lastRepoId = (res.data._id || res.data.id) as string;
        }
      }

      await refresh();
      setShowModal(false);
      setDiscoveredRepos([]);
      setSelectedDiscovered(new Set());

      if (lastRepoId) {
        setSelectedRepoId(lastRepoId);
        handleTriggerAnalysis(lastRepoId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register selected repositories.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerAnalysis = async (repoId: string) => {
    try {
      const targetRepo = repositories.find((r) => (r._id || r.id) === repoId);
      const isDemo = targetRepo?.isDemo ?? false;

      const res = await api.startAnalysis({
        repositoryId: repoId,
        branch: targetRepo?.defaultBranch || 'main',
        isDemo,
      });

      const analysisId = res.data.id || res.data._id;
      setActiveAnalysisId(analysisId);
      setElapsedSeconds(0);

      setActiveJobStatus({
        analysisId,
        repositoryId: repoId,
        status: 'queued',
        progress: 5,
        currentStage: 'Queued for secure clone',
        startedAt: new Date().toISOString(),
        filesDiscovered: 0,
        filesAnalyzed: 0,
        commitsAnalyzed: 0,
        isDemo,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start analysis.';
      alert(`Could not start analysis: ${msg}`);
    }
  };

  const handleCancelAnalysis = async () => {
    if (!activeAnalysisId) return;
    try {
      await api.cancelAnalysis(activeAnalysisId);
      setActiveJobStatus((prev) =>
        prev ? { ...prev, status: 'cancelled', currentStage: 'Analysis cancelled by user.' } : null
      );
    } catch (err) {
      console.warn('Failed to cancel analysis:', err);
    }
  };

  // Poll analysis status
  const pollStatus = useCallback(async () => {
    if (!activeAnalysisId) return;
    try {
      const res = await api.getAnalysisStatus(activeAnalysisId);
      if (res.data) {
        setActiveJobStatus(res.data);
        if (res.data.status === 'completed' || res.data.status === 'failed' || res.data.status === 'cancelled') {
          await refresh();
        }
      }
    } catch (err) {
      console.warn('Failed to poll analysis status:', err);
    }
  }, [activeAnalysisId, refresh]);

  useEffect(() => {
    if (!activeAnalysisId) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    pollStatus();
    const pollInterval = setInterval(() => {
      if (
        activeJobStatus?.status === 'completed' ||
        activeJobStatus?.status === 'failed' ||
        activeJobStatus?.status === 'cancelled'
      ) {
        if (timerRef.current) clearInterval(timerRef.current);
        clearInterval(pollInterval);
        return;
      }
      pollStatus();
    }, 1200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(pollInterval);
    };
  }, [activeAnalysisId, activeJobStatus?.status, pollStatus]);

  const getStageColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'failed':
      case 'cancelled':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header and Action (Section 24) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-bold">
              Repository Management
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              ACTIVE TELEMETRY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2 tracking-tight">
            <GitBranch className="w-6 h-6 text-cyan-400" />
            <span>Add Repository & Registry</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Ingest single repositories or discover entire team profiles & organizations for automated AST parsing, git velocity analysis, and financial debt modeling.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Analyze a Repository</span>
        </button>
      </div>

      {/* Real-time Analysis Progress UI */}
      {activeJobStatus && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-xl border ${
                  activeJobStatus.status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : activeJobStatus.status === 'failed' || activeJobStatus.status === 'cancelled'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse'
                }`}
              >
                {activeJobStatus.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : activeJobStatus.status === 'failed' || activeJobStatus.status === 'cancelled' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <RotateCw className="w-5 h-5 animate-spin" />
                )}
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <span>Analysis Job</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-cyan-400 font-semibold">{activeJobStatus.analysisId}</span>
                </div>
                <div className="text-sm font-bold text-zinc-100 mt-0.5">
                  {activeJobStatus.currentStage || 'Processing Git telemetry...'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono border uppercase ${getStageColor(
                  activeJobStatus.status
                )}`}
              >
                {activeJobStatus.status}
              </span>
              <span className="flex items-center gap-1 text-xs font-mono text-zinc-400 px-2 py-1 bg-zinc-800/80 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                <span>{elapsedSeconds}s</span>
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Pipeline Completion</span>
              <span className="text-zinc-200 font-semibold">{activeJobStatus.progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  activeJobStatus.status === 'completed'
                    ? 'bg-emerald-500'
                    : activeJobStatus.status === 'failed'
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${Math.max(activeJobStatus.progress, 5)}%` }}
              />
            </div>
          </div>

          {/* Telemetry Counter Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                <FileCode2 className="w-3 h-3 text-cyan-400" />
                <span>Files Discovered</span>
              </div>
              <div className="text-lg font-mono font-bold text-zinc-100 mt-1">
                {activeJobStatus.filesDiscovered || 0}
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Files Analyzed</span>
              </div>
              <div className="text-lg font-mono font-bold text-zinc-100 mt-1">
                {activeJobStatus.filesAnalyzed || 0}
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                <GitCommit className="w-3 h-3 text-amber-400" />
                <span>Commits Analyzed</span>
              </div>
              <div className="text-lg font-mono font-bold text-zinc-100 mt-1">
                {activeJobStatus.commitsAnalyzed || 0}
              </div>
            </div>
          </div>

          {/* Error Message Display */}
          {activeJobStatus.error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-rose-200">Analysis Error:</strong> {activeJobStatus.error}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
            {activeJobStatus.status !== 'completed' &&
              activeJobStatus.status !== 'failed' &&
              activeJobStatus.status !== 'cancelled' && (
                <button
                  onClick={handleCancelAnalysis}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-rose-400 bg-zinc-800 hover:bg-zinc-800/80 rounded-lg transition-colors"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>Cancel Analysis</span>
                </button>
              )}

            {activeJobStatus.status === 'completed' && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Executive Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <button
              onClick={() => setActiveAnalysisId(null)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1"
            >
              Dismiss Panel
            </button>
          </div>
        </div>
      )}

      {/* Repositories List (Section 25: Premium Repository Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Registered Repositories ({repositories.length})
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            Click &ldquo;Analyze Repository&rdquo; to execute fresh telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {repositories.map((repo) => {
            const isSelected = (repo._id || repo.id) === selectedRepoId;

            return (
              <div
                key={repo._id || repo.id}
                className={`bg-zinc-900/80 border rounded-2xl p-5 backdrop-blur-sm transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500/60 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/40'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-zinc-100">{repo.owner}/{repo.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {repo.isDemo ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                            BENCHMARK DEMO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                            PUBLIC
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-zinc-400">{repo.primaryLanguage || 'TypeScript'}</span>
                      </div>
                    </div>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
                      title="Open in GitHub"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {repo.description ? (
                    <p className="text-xs text-zinc-400 mt-2.5 line-clamp-2">{repo.description}</p>
                  ) : (
                    <p className="text-xs text-zinc-500 mt-2.5 italic">Git repository registered for technical debt intelligence.</p>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{repo.defaultBranch || 'main'}</span>
                    </span>
                    {repo.stars !== undefined && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span>{repo.stars > 1000 ? `${(repo.stars / 1000).toFixed(0)}k` : repo.stars}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedRepoId(repo._id || repo.id || '')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {isSelected ? 'Active Scope' : 'Select Scope'}
                  </button>

                  <button
                    onClick={() => handleTriggerAnalysis(repo._id || repo.id || '')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-lg text-xs font-medium border border-cyan-500/30 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Analyze</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Repository Modal (Section 24 & 25) */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Add Repository for Intelligence Analysis</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Analyze a single repository or scan public user & org profiles.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-zinc-800 text-xs font-mono">
              <button
                onClick={() => setModalMode('single')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-semibold transition-all ${
                  modalMode === 'single'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Repository URL</span>
              </button>

              <button
                onClick={() => setModalMode('profile')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-semibold transition-all ${
                  modalMode === 'profile'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Profile URL</span>
              </button>

              <button
                onClick={() => setModalMode('org')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-semibold transition-all ${
                  modalMode === 'org'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Organization URL</span>
              </button>
            </div>

            {/* Security Notice (Section 24) */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-200 font-medium">Access Transparency:</strong> Public profile and organization scanning discovers accessible public repositories. Private repositories require configured HTTPS authentication or personal access credentials.
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Single Repository Mode */}
            {modalMode === 'single' && (
              <form onSubmit={handleRegisterSingle} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Repository URL <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://github.com/facebook/react or https://github.com/expressjs/express.git"
                    value={formData.url}
                    onChange={(e) => handleUrlInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    HTTPS Git clone URL. Auto-detects owner and name.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. react"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Owner / Organization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. facebook"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Default Branch
                  </label>
                  <input
                    type="text"
                    placeholder="main"
                    value={formData.defaultBranch}
                    onChange={(e) => setFormData({ ...formData, defaultBranch: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Registering...' : 'Analyze Repository'}
                  </button>
                </div>
              </form>
            )}

            {/* Profile or Organization Discovery Mode (Section 24 & 25) */}
            {(modalMode === 'profile' || modalMode === 'org') && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={modalMode === 'profile' ? 'https://github.com/torvalds' : 'https://github.com/facebook'}
                      value={discoveryUrl}
                      onChange={(e) => setDiscoveryUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscover}
                    disabled={isDiscovering || !discoveryUrl.trim()}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {isDiscovering ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Discover Public Repos</span>
                  </button>
                </div>

                {discoveryError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{discoveryError}</span>
                  </div>
                )}

                {/* Section 25: Repository Picker Screen */}
                {discoveredRepos.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={selectAllDiscovered}
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        {selectedDiscovered.size === discoveredRepos.length ? (
                          <CheckSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {selectedDiscovered.size === discoveredRepos.length ? 'Deselect All' : 'Select All'}
                        </span>
                      </button>
                      <span className="text-zinc-400">
                        <strong className="text-zinc-100">{selectedDiscovered.size}</strong> of {discoveredRepos.length} repositories selected
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-800/40">
                      {discoveredRepos.map((repo) => {
                        const isChecked = selectedDiscovered.has(repo.fullName);
                        return (
                          <div
                            key={repo.id}
                            onClick={() => toggleSelectRepo(repo.fullName)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isChecked
                                ? 'bg-cyan-950/20 border-cyan-500/40'
                                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectRepo(repo.fullName)}
                                className="mt-1 rounded border-zinc-700 text-cyan-500 focus:ring-0"
                              />
                              <div>
                                <div className="font-mono text-xs font-bold text-zinc-100">
                                  {repo.fullName}
                                </div>
                                <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                  {repo.description || 'Public GitHub repository'}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-zinc-500">
                                  <span>{repo.language || 'Code'}</span>
                                  <span>★ {repo.stars}</span>
                                  <span>{repo.relativeTime}</span>
                                  <span className="text-emerald-400">Public</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleRegisterSelectedDiscovered}
                        disabled={isSubmitting || selectedDiscovered.size === 0}
                        className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isSubmitting ? 'Registering...' : `Analyze Selected (${selectedDiscovered.size})`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

