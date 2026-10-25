import React from 'react';
import { Search, GitBranch } from 'lucide-react';
import { Repository } from '../../types';

export type AlertFilterCategory = 'ALL' | 'UNREAD' | 'CRITICAL' | 'PREDICTIVE' | 'VERIFICATION' | 'RESOLVED';

interface AlertFiltersProps {
  selectedCategory: AlertFilterCategory;
  onSelectCategory: (category: AlertFilterCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRepoId: string;
  onSelectRepoId: (repoId: string) => void;
  repositories: Repository[];
  categoryCounts: Record<AlertFilterCategory, number>;
}

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedRepoId,
  onSelectRepoId,
  repositories,
  categoryCounts,
}) => {
  const categories: { key: AlertFilterCategory; label: string }[] = [
    { key: 'ALL', label: 'All Alerts' },
    { key: 'UNREAD', label: 'Unread' },
    { key: 'CRITICAL', label: 'Critical' },
    { key: 'PREDICTIVE', label: 'Predictive' },
    { key: 'VERIFICATION', label: 'Verification' },
    { key: 'RESOLVED', label: 'Resolved' },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map(({ key, label }) => {
          const count = categoryCounts[key] ?? 0;
          const isSelected = selectedCategory === key;

          return (
            <button
              key={key}
              onClick={() => onSelectCategory(key)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950/60'
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'bg-zinc-950 text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Search & Repository Picker */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by file or keyword..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Repository Picker */}
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1">
          <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={selectedRepoId}
            onChange={(e) => onSelectRepoId(e.target.value)}
            className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-zinc-950 text-zinc-300">
              All Repositories
            </option>
            {repositories.map((r) => (
              <option key={r._id || r.id} value={r._id || r.id} className="bg-zinc-950 text-zinc-300">
                {r.owner}/{r.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
