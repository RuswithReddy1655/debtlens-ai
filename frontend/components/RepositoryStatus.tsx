import React from 'react';
import { GitBranch, Clock, GitFork, Star, AlertCircle, ShieldCheck } from 'lucide-react';
import { Repository, Analysis } from '../types';
import { getHealthColor } from '../lib/utils';

interface RepositoryStatusProps {
  repository: Repository | null;
  analysis: Analysis | null;
  repositories?: Repository[];
  onSelectRepo?: (repoId: string) => void;
}

export const RepositoryStatus: React.FC<RepositoryStatusProps> = ({
  repository,
  analysis,
  repositories = [],
  onSelectRepo,
}) => {
  if (!repository) return null;

  const healthScore = analysis?.summary?.overallHealthScore ?? 75;
  const healthStyle = getHealthColor(healthScore);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {repositories.length > 1 && onSelectRepo ? (
            <select
              value={repository._id || repository.id}
              onChange={(e) => onSelectRepo(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-100 font-bold text-base rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {repositories.map((r) => (
                <option key={r._id || r.id} value={r._id || r.id}>
                  {r.owner} / {r.name}
                </option>
              ))}
            </select>
          ) : (
            <h2 className="text-base font-bold text-zinc-100 font-mono">
              {repository.owner} / {repository.name}
            </h2>
          )}

          {repository.isDemo && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              BENCHMARK REPO
            </span>
          )}

          <div className="flex items-center space-x-1 text-xs text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">{repository.defaultBranch || 'main'}</span>
          </div>
        </div>

        {repository.description && (
          <p className="text-xs text-zinc-400 max-w-2xl">{repository.description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Health Score Pill */}
        <div className={`px-3 py-1 rounded-lg border flex items-center space-x-2 ${healthStyle.badge}`}>
          <ShieldCheck className="w-4 h-4" />
          <div className="text-xs">
            <span className="font-semibold">Health Score: </span>
            <strong className="font-mono text-sm">{healthScore}/100</strong> ({healthStyle.label})
          </div>
        </div>

        {/* Last Analyzed Meta */}
        <div className="text-right text-xs text-zinc-500 hidden sm:block">
          <div className="flex items-center space-x-1 justify-end">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>
              {repository.lastAnalyzedAt
                ? new Date(repository.lastAnalyzedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC',
                  }) + ' UTC'
                : 'Recently Analyzed'}
            </span>
          </div>
          <div className="text-[11px] text-zinc-600 font-mono">
            Commit: {analysis?.commitHash || '8f2a1b9'}
          </div>
        </div>
      </div>
    </div>
  );
};
