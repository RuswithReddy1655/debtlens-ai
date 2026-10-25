'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { FileMetric, RiskLevel } from '../../types';
import { RepositoryStatus } from '../../components/RepositoryStatus';
import { RiskBadge } from '../../components/RiskBadge';
import { FileDetailPanel } from '../../components/FileDetailPanel';
import { LoadingState, ErrorState } from '../../components/States';
import {
  FileCode2,
  Search,
  Filter,
  ShieldCheck,
  Activity,
  Code,
  GitCommit,
  Bug,
  Flame,
  ArrowUpDown,
} from 'lucide-react';
import { formatNumber } from '../../lib/utils';

export default function FilesPage() {
  const { selectedRepo, selectedRepoId, setSelectedRepoId, repositories, analysis, financialRate } =
    useRepository();

  const [files, setFiles] = useState<FileMetric[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileMetric | null>(null);
  const [search, setSearch] = useState('');
  
  // Section 26 Filters
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');
  const [churnFilter, setChurnFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getMetrics(selectedRepoId);
        setFiles(res.data);
      } catch (err) {
        console.warn('Files fetch error:', err);
        setError('Failed to fetch file telemetry from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [selectedRepoId]);

  // Unique languages extracted from files
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    files.forEach((f) => {
      if (f.language) langs.add(f.language);
    });
    return Array.from(langs);
  }, [files]);

  // Priority mapping helper (Section 26)
  const getFilePriority = (file: FileMetric): string => {
    if (file.debtScore >= 75 || file.riskCategory === 'critical') return 'Critical';
    if (file.debtScore >= 50 || file.riskCategory === 'high') return 'High';
    if (file.debtScore >= 25 || file.riskCategory === 'medium') return 'Medium';
    return 'Low';
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      // Search
      const matchSearch =
        !search ||
        f.filePath.toLowerCase().includes(search.toLowerCase()) ||
        f.directory.toLowerCase().includes(search.toLowerCase());

      // Language
      const matchLanguage =
        languageFilter === 'all' ||
        (f.language && f.language.toLowerCase() === languageFilter.toLowerCase());

      // Risk
      const matchRisk = riskFilter === 'all' || f.riskCategory === riskFilter;

      // Complexity
      let matchComplexity = true;
      if (complexityFilter === 'extreme') matchComplexity = (f.cyclomaticComplexity || 0) >= 30;
      else if (complexityFilter === 'high')
        matchComplexity = (f.cyclomaticComplexity || 0) >= 15 && (f.cyclomaticComplexity || 0) < 30;
      else if (complexityFilter === 'moderate') matchComplexity = (f.cyclomaticComplexity || 0) < 15;

      // Churn
      let matchChurn = true;
      if (churnFilter === 'high') matchChurn = (f.churnCount || 0) >= 30;
      else if (churnFilter === 'medium')
        matchChurn = (f.churnCount || 0) >= 10 && (f.churnCount || 0) < 30;
      else if (churnFilter === 'low') matchChurn = (f.churnCount || 0) < 10;

      // Priority
      const priority = getFilePriority(f).toLowerCase();
      const matchPriority = priorityFilter === 'all' || priority === priorityFilter.toLowerCase();

      return matchSearch && matchLanguage && matchRisk && matchComplexity && matchChurn && matchPriority;
    });
  }, [files, search, languageFilter, riskFilter, complexityFilter, churnFilter, priorityFilter]);

  if (loading) {
    return <LoadingState message="Enumerating repository source telemetry..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <RepositoryStatus
        repository={selectedRepo}
        analysis={analysis}
        repositories={repositories}
        onSelectRepo={setSelectedRepoId}
      />

      {error && <ErrorState message={error} />}

      {/* Header and Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
            <span>Repository File Explorer</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Full source inventory with AST complexity, git revision churn, defect activity, and prioritized remediation rank.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          Showing <strong className="text-zinc-100">{filteredFiles.length}</strong> of {files.length} analyzed files
        </div>
      </div>

      {/* Section 26: Multi-Dimensional Filter Toolbar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 backdrop-blur-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file path or module directory..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs font-mono">
          {/* Language Filter */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Language</label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="all">All Languages</option>
              {availableLanguages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Risk Severity</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="all">All Risk Tiers</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Complexity Filter */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Complexity</label>
            <select
              value={complexityFilter}
              onChange={(e) => setComplexityFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="all">All Complexities</option>
              <option value="extreme">&ge; 30 (Extreme)</option>
              <option value="high">15–29 (Elevated)</option>
              <option value="moderate">&lt; 15 (Standard)</option>
            </select>
          </div>

          {/* Churn Filter */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Commit Churn</label>
            <select
              value={churnFilter}
              onChange={(e) => setChurnFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="all">All Churn Velocities</option>
              <option value="high">&ge; 30 Revisions</option>
              <option value="medium">10–29 Revisions</option>
              <option value="low">&lt; 10 Revisions</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 26: Full Telemetry Table */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800 text-[11px]">
              <tr>
                <th className="py-3.5 px-4">File Path</th>
                <th className="py-3.5 px-3">Language</th>
                <th className="py-3.5 px-3">LOC</th>
                <th className="py-3.5 px-3">Complexity</th>
                <th className="py-3.5 px-3">Churn</th>
                <th className="py-3.5 px-3">Defects</th>
                <th className="py-3.5 px-3">Risk</th>
                <th className="py-3.5 px-3">Priority</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-zinc-500 font-mono text-xs">
                    No source files found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const priority = getFilePriority(file);
                  const defects = file.defectFixCommitCount ?? file.defectCount ?? 0;

                  return (
                    <tr
                      key={file.filePath}
                      onClick={() => setSelectedFile(file)}
                      className="hover:bg-zinc-850 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-zinc-200 group-hover:text-cyan-300 max-w-sm truncate">
                        <div>{file.filePath}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{file.directory}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-400">
                        {file.language || 'TypeScript'}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-300">
                        {formatNumber(file.linesOfCode)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={
                            (file.cyclomaticComplexity || 0) >= 30
                              ? 'text-rose-400 font-bold'
                              : (file.cyclomaticComplexity || 0) >= 15
                              ? 'text-amber-400 font-medium'
                              : 'text-zinc-300'
                          }
                        >
                          {file.cyclomaticComplexity || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-300">
                        {file.churnCount || 0} revs
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={defects > 3 ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
                          {defects}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <RiskBadge risk={file.riskCategory} />
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            priority === 'Critical'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                              : priority === 'High'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                              : priority === 'Medium'
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700 font-mono"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Detail Panel (Section 12) */}
      <FileDetailPanel
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        hourlyRate={financialRate}
      />
    </div>
  );
}

