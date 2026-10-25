import React, { useState, useMemo } from 'react';
import { FileMetric, Hotspot, RiskLevel } from '../types';
import { formatCurrency, formatNumber } from '../lib/utils';
import {
  Layers,
  Info,
  Flame,
  GitCommit,
  DollarSign,
  Bug,
  Calendar,
  Code,
  Search,
  Filter,
} from 'lucide-react';

export type HeatmapMetric = 'risk' | 'complexity' | 'churn' | 'financial' | 'defects' | 'legacy';

interface HeatmapProps {
  files: (FileMetric | Hotspot)[];
  onSelectFile: (file: FileMetric | Hotspot) => void;
  hourlyRate?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ files, onSelectFile, hourlyRate = 95 }) => {
  const [selectedDirectory, setSelectedDirectory] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetric>('risk');
  const [hoveredFile, setHoveredFile] = useState<(FileMetric | Hotspot) | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract top-level directories
  const directories = useMemo(() => {
    const dirs = new Set<string>();
    files.forEach((f) => {
      const parts = f.filePath.split('/');
      if (parts.length > 1) {
        dirs.add(parts.slice(0, 2).join('/'));
      } else {
        dirs.add('root');
      }
    });
    return Array.from(dirs);
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const dirMatch = selectedDirectory === 'all' || f.filePath.startsWith(selectedDirectory);
      const searchMatch = !searchQuery || f.filePath.toLowerCase().includes(searchQuery.toLowerCase());
      return dirMatch && searchMatch;
    });
  }, [files, selectedDirectory, searchQuery]);

  // Compute intensity value & color based on selected metric
  const getMetricValue = (file: FileMetric | Hotspot, metric: HeatmapMetric) => {
    const isFileMetric = 'linesOfCode' in file;
    const fm = isFileMetric ? (file as FileMetric) : null;
    const hs = !isFileMetric ? (file as Hotspot) : null;

    switch (metric) {
      case 'complexity':
        return {
          value: fm?.cyclomaticComplexity ?? hs?.complexityScore ?? 15,
          unit: 'branches',
          label: 'Complexity',
        };
      case 'churn':
        return {
          value: fm?.churnCount ?? hs?.churnScore ?? 12,
          unit: 'revisions',
          label: 'Code Churn',
        };
      case 'financial': {
        const cost =
          fm?.estimatedRemediationCost ??
          (hs?.estimatedRemediationHours ? hs.estimatedRemediationHours * hourlyRate : (file.debtScore / 100) * 12000);
        return {
          value: cost,
          unit: '',
          formatted: formatCurrency(cost),
          label: 'Financial Exposure',
        };
      }
      case 'defects':
        return {
          value: fm?.defectFixCommitCount ?? hs?.defectFixCount ?? fm?.defectCount ?? 2,
          unit: 'bug fixes',
          label: 'Defect Activity',
        };
      case 'legacy':
        return {
          value: fm?.ageInDays ?? 240,
          unit: 'days',
          label: 'Code Age',
        };
      case 'risk':
      default:
        return {
          value: file.debtScore,
          unit: '/ 100',
          label: 'Debt Score',
        };
    }
  };

  const getMetricColorClass = (file: FileMetric | Hotspot, metric: HeatmapMetric) => {
    const isFileMetric = 'linesOfCode' in file;
    const fm = isFileMetric ? (file as FileMetric) : null;
    const hs = !isFileMetric ? (file as Hotspot) : null;

    if (metric === 'complexity') {
      const comp = fm?.cyclomaticComplexity ?? hs?.complexityScore ?? 15;
      if (comp >= 35) return 'bg-rose-500/80 hover:bg-rose-500 border-rose-400 text-rose-100 shadow-rose-500/20';
      if (comp >= 22) return 'bg-amber-500/80 hover:bg-amber-500 border-amber-400 text-amber-100 shadow-amber-500/20';
      if (comp >= 12) return 'bg-cyan-600/70 hover:bg-cyan-500 border-cyan-400 text-cyan-100 shadow-cyan-500/10';
      return 'bg-emerald-600/70 hover:bg-emerald-500 border-emerald-400 text-emerald-100 shadow-emerald-500/10';
    }

    if (metric === 'churn') {
      const ch = fm?.churnCount ?? hs?.churnScore ?? 12;
      if (ch >= 40) return 'bg-rose-500/80 hover:bg-rose-500 border-rose-400 text-rose-100 shadow-rose-500/20';
      if (ch >= 25) return 'bg-amber-500/80 hover:bg-amber-500 border-amber-400 text-amber-100 shadow-amber-500/20';
      if (ch >= 10) return 'bg-cyan-600/70 hover:bg-cyan-500 border-cyan-400 text-cyan-100 shadow-cyan-500/10';
      return 'bg-emerald-600/70 hover:bg-emerald-500 border-emerald-400 text-emerald-100 shadow-emerald-500/10';
    }

    if (metric === 'financial') {
      const cost =
        fm?.estimatedRemediationCost ??
        (hs?.estimatedRemediationHours ? hs.estimatedRemediationHours * hourlyRate : (file.debtScore / 100) * 12000);
      if (cost >= 8000) return 'bg-rose-500/80 hover:bg-rose-500 border-rose-400 text-rose-100 shadow-rose-500/20';
      if (cost >= 4000) return 'bg-amber-500/80 hover:bg-amber-500 border-amber-400 text-amber-100 shadow-amber-500/20';
      if (cost >= 1500) return 'bg-cyan-600/70 hover:bg-cyan-500 border-cyan-400 text-cyan-100 shadow-cyan-500/10';
      return 'bg-emerald-600/70 hover:bg-emerald-500 border-emerald-400 text-emerald-100 shadow-emerald-500/10';
    }

    if (metric === 'defects') {
      const bugs = fm?.defectFixCommitCount ?? hs?.defectFixCount ?? fm?.defectCount ?? 2;
      if (bugs >= 6) return 'bg-rose-500/80 hover:bg-rose-500 border-rose-400 text-rose-100 shadow-rose-500/20';
      if (bugs >= 3) return 'bg-amber-500/80 hover:bg-amber-500 border-amber-400 text-amber-100 shadow-amber-500/20';
      if (bugs >= 1) return 'bg-cyan-600/70 hover:bg-cyan-500 border-cyan-400 text-cyan-100 shadow-cyan-500/10';
      return 'bg-emerald-600/70 hover:bg-emerald-500 border-emerald-400 text-emerald-100 shadow-emerald-500/10';
    }

    if (metric === 'legacy') {
      const age = fm?.ageInDays ?? 240;
      if (age >= 365) return 'bg-rose-500/80 hover:bg-rose-500 border-rose-400 text-rose-100 shadow-rose-500/20';
      if (age >= 180) return 'bg-amber-500/80 hover:bg-amber-500 border-amber-400 text-amber-100 shadow-amber-500/20';
      if (age >= 90) return 'bg-cyan-600/70 hover:bg-cyan-500 border-cyan-400 text-cyan-100 shadow-cyan-500/10';
      return 'bg-emerald-600/70 hover:bg-emerald-500 border-emerald-400 text-emerald-100 shadow-emerald-500/10';
    }

    // Default: Risk score
    const score = file.debtScore;
    const risk = 'riskLevel' in file ? file.riskLevel : file.riskCategory;
    if (risk === 'critical' || score >= 75) {
      return 'bg-rose-500/80 hover:bg-rose-500 border-rose-400 text-rose-100 shadow-rose-500/20';
    }
    if (risk === 'high' || score >= 50) {
      return 'bg-amber-500/80 hover:bg-amber-500 border-amber-400 text-amber-100 shadow-amber-500/20';
    }
    if (risk === 'medium' || score >= 25) {
      return 'bg-cyan-600/70 hover:bg-cyan-500 border-cyan-400 text-cyan-100 shadow-cyan-500/10';
    }
    return 'bg-emerald-600/70 hover:bg-emerald-500 border-emerald-400 text-emerald-100 shadow-emerald-500/10';
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-5">
      
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-zinc-100">
              Interactive Repository Debt & Risk Heatmap
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Visual intensity maps code modules by technical risk, cyclomatic branch depth, revision velocity, defect activity, and modeled exposure.
          </p>
        </div>

        {/* Directory selector & Quick Search */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search file path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500 text-xs font-mono w-44"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500 font-medium">Scope:</span>
            <select
              value={selectedDirectory}
              onChange={(e) => setSelectedDirectory(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 text-xs font-mono"
            >
              <option value="all">All Modules ({files.length} files)</option>
              {directories.map((dir) => (
                <option key={dir} value={dir}>
                  {dir}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 27 Metric Switcher Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-xs font-mono">
        <span className="text-zinc-400 font-sans font-semibold flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          Color Intensity Metric:
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'risk', label: 'Technical Risk', icon: Flame },
            { id: 'complexity', label: 'Complexity', icon: Code },
            { id: 'churn', label: 'Code Churn', icon: GitCommit },
            { id: 'financial', label: 'Financial Exposure', icon: DollarSign },
            { id: 'defects', label: 'Defect Activity', icon: Bug },
            { id: 'legacy', label: 'Legacy Risk', icon: Calendar },
          ].map((m) => {
            const Icon = m.icon;
            const isActive = selectedMetric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id as HeatmapMetric)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-zinc-950 font-bold border-cyan-400 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between py-2 text-xs text-zinc-400 border-b border-zinc-800/60 gap-2 font-mono">
        <div className="flex items-center space-x-4">
          <span className="text-zinc-500 font-sans font-medium">Intensity Gradient:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" /> Critical / Extreme
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" /> High Friction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-600" /> Moderate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600" /> Healthy / Low
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 font-sans flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click any file tile to inspect root-cause telemetry</span>
        </div>
      </div>

      {/* Grid of Interactive Heatmap Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
        {filteredFiles.map((file) => {
          const filename = file.filePath.split('/').pop() || file.filePath;
          const colorClass = getMetricColorClass(file, selectedMetric);
          const metricData = getMetricValue(file, selectedMetric);

          return (
            <div
              key={file.filePath}
              onClick={() => onSelectFile(file)}
              onMouseEnter={() => setHoveredFile(file)}
              onMouseLeave={() => setHoveredFile(null)}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl ${colorClass} flex flex-col justify-between min-h-[105px]`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-mono text-[11px] font-bold truncate max-w-[110px]" title={filename}>
                  {filename}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/40 rounded font-bold">
                  {metricData.formatted || metricData.value}
                </span>
              </div>

              <div className="mt-2 text-[10px] text-white/90 space-y-0.5 font-mono">
                <div className="truncate text-[9px] opacity-80" title={file.filePath}>
                  {file.filePath}
                </div>
                <div className="flex items-center justify-between text-[9px] opacity-90 pt-0.5">
                  <span>{'linesOfCode' in file ? `${formatNumber(file.linesOfCode)} LoC` : 'Hotspot'}</span>
                  <span className="uppercase">{metricData.label.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Hover Contextual Inspector Card */}
      {hoveredFile && (
        <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between text-xs text-zinc-300 animate-in fade-in duration-150 shadow-xl">
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-cyan-300">{hoveredFile.filePath}</span>
            <span className="text-zinc-600">|</span>
            <span className="font-mono">
              Debt Score: <strong className="text-zinc-100">{hoveredFile.debtScore}/100</strong>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="font-mono">
              Risk: <strong className="capitalize text-rose-400">{'riskLevel' in hoveredFile ? hoveredFile.riskLevel : hoveredFile.riskCategory}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3 font-mono">
            <span>
              Exposure:{' '}
              <strong className="text-amber-400">
                {formatCurrency(
                  'estimatedRemediationCost' in hoveredFile && hoveredFile.estimatedRemediationCost
                    ? hoveredFile.estimatedRemediationCost
                    : 'debtHours' in hoveredFile
                    ? hoveredFile.debtHours * hourlyRate
                    : 0
                )}
              </strong>
            </span>
            <span className="text-[11px] text-cyan-400 font-sans cursor-pointer hover:underline">
              (Click tile to open Risk Explanation) &rarr;
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

