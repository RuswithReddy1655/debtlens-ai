'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { RepositoryConnection, GitHubRepoSummary, Repository } from '@/types';
import {
  Share2,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Trash2,
  ExternalLink,
  Shield,
  Clock,
  Radio,
  Plus,
} from 'lucide-react';

const GithubIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<RepositoryConnection[]>([]);
  const [gitHubRepos, setGitHubRepos] = useState<GitHubRepoSummary[]>([]);
  const [existingRepos, setExistingRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New connection modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState<'DAILY' | 'WEEKLY' | 'MANUAL' | 'AFTER_PUSH'>('DAILY');
  const [enableWebhook, setEnableWebhook] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [connRes, ghRes, repoRes] = await Promise.all([
        api.getConnections().catch(() => ({ success: true, data: [] })),
        api.getGitHubRepositories().catch(() => ({ success: true, data: [] })),
        api.getRepositories().catch(() => ({ success: true, data: [], isDemoSource: true })),
      ]);

      if (connRes.data) setConnections(connRes.data);
      if (ghRes.data) setGitHubRepos(ghRes.data);
      if (repoRes.data) setExistingRepos(repoRes.data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load connections.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnectGitHub = async () => {
    try {
      const res = await api.getGitHubConnectUrl();
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to initialize GitHub OAuth.' });
    }
  };

  const handleCreateConnection = async () => {
    if (!selectedRepoId) return;
    try {
      setConnecting(true);
      const gh = gitHubRepos.find((r) => r.id === selectedRepoId || r.fullName === selectedRepoId);
      const local = existingRepos.find((r) => r._id === selectedRepoId || r.id === selectedRepoId);

      const repoName = gh ? gh.fullName : local ? `${local.owner}/${local.name}` : selectedRepoId;
      const repoId = local ? (local._id || local.id) : `repo-${Date.now()}`;
      const defaultBranch = gh ? gh.defaultBranch : local ? local.defaultBranch : 'main';

      await api.connectRepository({
        repositoryId: repoId || 'repo-default',
        repositoryName: repoName,
        owner: gh ? gh.owner : local ? local.owner : 'enterprise',
        provider: 'github',
        providerRepositoryId: gh ? gh.id : `conn-${Date.now()}`,
        defaultBranch,
        visibility: gh?.isPrivate ? 'private' : 'public',
        analysisFrequency: selectedFrequency,
        webhookEnabled: enableWebhook,
      });

      setNotification({ type: 'success', message: `Connected ${repoName} for continuous intelligence.` });
      setShowConnectModal(false);
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to connect repository.' });
    } finally {
      setConnecting(false);
    }
  };

  const handleUpdateSchedule = async (connectionId: string, frequency: string) => {
    try {
      await api.updateSchedule(connectionId, frequency);
      setNotification({ type: 'success', message: 'Analysis frequency updated.' });
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update schedule.' });
    }
  };

  const handleTriggerAnalysis = async (connectionId: string) => {
    try {
      setAnalyzingId(connectionId);
      await api.triggerConnectionAnalysis(connectionId);
      setNotification({ type: 'success', message: 'Continuous analysis queued and started.' });
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to trigger analysis.' });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to pause continuous analysis for this repository?')) return;
    try {
      await api.disconnectRepository(connectionId);
      setNotification({ type: 'success', message: 'Repository disconnected.' });
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to disconnect.' });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              PHASE 4: CONTINUOUS INTELLIGENCE
            </span>
            <span className="text-zinc-500 text-xs font-mono">AUTOMATED WORKFLOW ENGINE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Repository Connections & Schedulers</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage authorized Git repositories, schedule recurring deep debt audits, and configure push webhooks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleConnectGitHub}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 text-xs font-semibold transition"
          >
            <GithubIcon className="w-4 h-4" />
            Connect GitHub
          </button>
          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            Connect Repository
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
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-zinc-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Architecture Principles Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <Shield className="w-4 h-4" />
            OAuth & Token Security
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            OAuth tokens are encrypted at rest with HMAC state verification. Raw tokens are never sent to the browser.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
            <Radio className="w-4 h-4" />
            Push Webhook Triggers
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Re-analyzes upon Git push with SHA-256 HMAC payload signature verification, debouncing redundant bursts.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
            <Clock className="w-4 h-4" />
            Continuous Schedulers
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Recurring background cron executions capture point-in-time snapshots to measure technical debt trajectories.
          </p>
        </div>
      </div>

      {/* Connected Repositories Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              Active Continuous Connections ({connections.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Automated telemetry feeds into historical analysis snapshots</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">Loading repository connections...</div>
        ) : connections.length === 0 ? (
          <div className="p-16 text-center">
            <Share2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No Continuous Connections Yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-4">
              Connect an existing repository or benchmark project to enable recurring continuous intelligence.
            </p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Connect First Repository
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 font-mono border-b border-zinc-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Webhook</th>
                  <th className="py-3 px-4">Last Analysis</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {connections.map((conn) => {
                  const isConnected = conn.connectionStatus === 'CONNECTED';
                  const isAnalyzing = analyzingId === (conn._id || conn.id);

                  return (
                    <tr key={conn._id || conn.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                          <GithubIcon className="w-3.5 h-3.5 text-zinc-400" />
                          {conn.repositoryName}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">{conn.provider} • {conn.visibility}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] border border-zinc-700">
                          {conn.defaultBranch || 'main'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                            isConnected
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                            }`}
                          />
                          {conn.connectionStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={conn.analysisFrequency}
                          onChange={(e) => handleUpdateSchedule(conn._id || conn.id!, e.target.value)}
                          className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
                        >
                          <option value="DAILY">DAILY (24h)</option>
                          <option value="WEEKLY">WEEKLY (7d)</option>
                          <option value="AFTER_PUSH">AFTER_PUSH</option>
                          <option value="MANUAL">MANUAL</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            conn.webhookEnabled
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {conn.webhookEnabled ? 'ACTIVE (HMAC)' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                        {conn.lastAnalysisAt
                          ? new Date(conn.lastAnalysisAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTriggerAnalysis(conn._id || conn.id!)}
                            disabled={isAnalyzing}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition disabled:opacity-50"
                          >
                            <Play className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                            {isAnalyzing ? 'Queuing...' : 'Analyze Now'}
                          </button>
                          <button
                            onClick={() => handleDisconnect(conn._id || conn.id!)}
                            title="Disconnect repository"
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                Connect Continuous Repository
              </h3>
              <button onClick={() => setShowConnectModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Select Repository</label>
                <select
                  value={selectedRepoId}
                  onChange={(e) => setSelectedRepoId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Authorized Git Repository --</option>
                  <optgroup label="GitHub Authorized Repositories">
                    {gitHubRepos.map((gh) => (
                      <option key={gh.id} value={gh.id}>
                        {gh.fullName} ({gh.defaultBranch})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Local / Ingested Projects">
                    {existingRepos.map((r) => (
                      <option key={r._id || r.id} value={r._id || r.id}>
                        {r.owner}/{r.name} ({r.defaultBranch})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Analysis Frequency</label>
                <select
                  value={selectedFrequency}
                  onChange={(e) => setSelectedFrequency(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="DAILY">DAILY — Deep overnight audit (Recommended)</option>
                  <option value="WEEKLY">WEEKLY — Weekly sprint summary audit</option>
                  <option value="AFTER_PUSH">AFTER_PUSH — Run whenever push webhook fires</option>
                  <option value="MANUAL">MANUAL — Trigger only on-demand</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div>
                  <div className="font-semibold text-zinc-200">Enable Push Webhook</div>
                  <div className="text-[11px] text-zinc-500">Trigger automatic verification on push to main branch</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableWebhook}
                  onChange={(e) => setEnableWebhook(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConnection}
                disabled={!selectedRepoId || connecting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Establish Connection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
