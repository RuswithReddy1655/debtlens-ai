'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { AuditEvent, Repository } from '@/types';
import {
  Clock,
  RotateCw,
  Filter,
  CheckCircle2,
  FileCode,
  Target,
  Share2,
  Play,
  ShieldAlert,
  User,
  Radio,
  Cpu,
} from 'lucide-react';

const ACTION_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  DEBT_DETECTED: { icon: FileCode, color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800' },
  STATUS_CHANGED: { icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-950/60 border-indigo-800' },
  ASSIGNMENT_CHANGED: { icon: User, color: 'text-cyan-400', bg: 'bg-cyan-950/60 border-cyan-800' },
  DEBT_RESOLVED: { icon: CheckCircle2, color: 'text-cyan-300', bg: 'bg-cyan-950/60 border-cyan-800' },
  DEBT_VERIFIED: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800' },
  DEBT_REOPENED: { icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800' },
  GOAL_ACHIEVED: { icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800' },
  GOAL_CREATED: { icon: Target, color: 'text-blue-400', bg: 'bg-blue-950/60 border-blue-800' },
  REPO_CONNECTED: { icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800' },
  REPO_DISCONNECTED: { icon: Share2, color: 'text-zinc-500', bg: 'bg-zinc-900 border-zinc-800' },
  ANALYSIS_TRIGGERED: { icon: Play, color: 'text-cyan-400', bg: 'bg-cyan-950/60 border-cyan-800' },
  ANALYSIS_COMPLETED: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800' },
  ANALYSIS_FAILED: { icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800' },
};

const ACTOR_ICONS: Record<string, any> = {
  USER: User,
  SYSTEM: Cpu,
  WEBHOOK: Radio,
  SCHEDULER: Clock,
};

export default function ActivityTimelinePage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const [eventsRes, reposRes] = await Promise.all([
        api.getActivityLog(selectedRepoId || undefined, 100).catch(() => ({ success: true, data: [] })),
        api.getRepositories().catch(() => ({ success: true, data: [], isDemoSource: true })),
      ]);

      if (eventsRes.data) setEvents(eventsRes.data);
      if (reposRes.data) setRepositories(reposRes.data);
    } catch (err) {
      console.error('Failed to load activity stream:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [selectedRepoId]);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              PHASE 4: AUDIT TRAIL
            </span>
            <span className="text-zinc-500 text-xs font-mono">CHRONOLOGICAL EVENT LOG</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Engineering Activity Timeline</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Complete, immutable audit trail of technical debt detections, prioritization, work linking, and verification outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
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
          </div>

          <button
            onClick={fetchActivity}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-16 text-center text-zinc-500 text-xs">Loading activity stream...</div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-200">No Activity Events Recorded Yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Events populate automatically as repositories are connected, analyzed, and debt items are transitioned.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-zinc-800 space-y-6">
            {events.map((event, idx) => {
              const actionMeta = ACTION_ICONS[event.action] || {
                icon: Clock,
                color: 'text-zinc-400',
                bg: 'bg-zinc-900 border-zinc-800',
              };
              const ActionIcon = actionMeta.icon;
              const ActorIcon = ACTOR_ICONS[event.actorType] || Cpu;

              return (
                <div key={event._id || event.id || idx} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-zinc-950 border-2 border-zinc-700 group-hover:border-cyan-400 transition" />

                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition shadow-sm space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${actionMeta.bg} ${actionMeta.color}`}>
                          <ActionIcon className="w-3 h-3" />
                          {event.action}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800 text-[10px] font-mono">
                          <ActorIcon className="w-3 h-3 text-zinc-500" />
                          {event.actorId || event.actorType}
                        </span>

                        {event.repositoryId && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            repo: {event.repositoryId}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-zinc-500">
                        {new Date(event.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-200 font-sans leading-relaxed">{event.description}</p>

                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 font-mono text-[10px] text-zinc-400 overflow-x-auto">
                        <span className="text-zinc-600 block mb-0.5">{'// Event Metadata'}</span>
                        {JSON.stringify(event.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
