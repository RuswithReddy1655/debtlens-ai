import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Filter } from 'lucide-react';
import { Hotspot, RiskLevel } from '../types';
import { RiskBadge } from './RiskBadge';
import { formatCurrency } from '../lib/utils';

interface HotspotTableProps {
  hotspots: Hotspot[];
  onSelectHotspot: (hotspot: Hotspot) => void;
  hourlyRate?: number;
}

export const HotspotTable: React.FC<HotspotTableProps> = ({
  hotspots,
  onSelectHotspot,
  hourlyRate = 95,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'all'>('all');
  const [sortField, setSortField] = useState<'rank' | 'debtScore' | 'complexityScore' | 'cost'>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredHotspots = useMemo(() => {
    return hotspots
      .filter((item) => {
        const matchesSearch = item.filePath.toLowerCase().includes(search.toLowerCase());
        const matchesRisk = selectedRisk === 'all' || item.riskLevel === selectedRisk;
        return matchesSearch && matchesRisk;
      })
      .sort((a, b) => {
        let valA = a.rank;
        let valB = b.rank;

        if (sortField === 'debtScore') {
          valA = a.debtScore;
          valB = b.debtScore;
        } else if (sortField === 'complexityScore') {
          valA = a.complexityScore;
          valB = b.complexityScore;
        } else if (sortField === 'cost') {
          valA = a.estimatedRemediationCost;
          valB = b.estimatedRemediationCost;
        }

        return sortAsc ? valA - valB : valB - valA;
      });
  }, [hotspots, search, selectedRisk, sortField, sortAsc]);

  const handleSort = (field: 'rank' | 'debtScore' | 'complexityScore' | 'cost') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank');
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hotspots by file path or module..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500">Filter Risk:</span>
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((risk) => (
            <button
              key={risk}
              onClick={() => setSelectedRisk(risk)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                selectedRisk === risk
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/50 text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800">
            <tr>
              <th
                onClick={() => handleSort('rank')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-200 w-16"
              >
                <div className="flex items-center space-x-1">
                  <span>Rank</span>
                  {sortField === 'rank' ? (
                    sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4">File Path</th>
              <th className="py-3 px-4">Risk Severity</th>
              <th
                onClick={() => handleSort('debtScore')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Debt Score</span>
                  {sortField === 'debtScore' ? (
                    sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('complexityScore')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-200 hidden md:table-cell"
              >
                <div className="flex items-center space-x-1">
                  <span>Complexity</span>
                  {sortField === 'complexityScore' ? (
                    sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 hidden lg:table-cell">Churn</th>
              <th className="py-3 px-4 hidden lg:table-cell">Defect Activity</th>
              <th
                onClick={() => handleSort('cost')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-200 text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Remediation Cost</span>
                  {sortField === 'cost' ? (
                    sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {filteredHotspots.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-zinc-500">
                  No hotspots match the current criteria.
                </td>
              </tr>
            ) : (
              filteredHotspots.map((item) => (
                <tr
                  key={item.filePath}
                  onClick={() => onSelectHotspot(item)}
                  className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-bold text-zinc-400 group-hover:text-cyan-400">
                    #{item.rank}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-zinc-200 font-medium group-hover:text-white">
                      {item.filePath}
                    </div>
                    {item.primaryDebtDrivers && item.primaryDebtDrivers.length > 0 && (
                      <div className="text-[11px] text-zinc-500 truncate max-w-sm mt-0.5">
                        {item.primaryDebtDrivers[0]}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge risk={item.riskLevel} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-zinc-200 w-6">
                        {item.debtScore}
                      </span>
                      <div className="w-20 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            item.debtScore >= 75
                              ? 'bg-rose-500'
                              : item.debtScore >= 50
                              ? 'bg-amber-500'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${item.debtScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-400 hidden md:table-cell font-mono">
                    {item.complexityScore}/100
                  </td>
                  <td className="py-3 px-4 text-zinc-400 hidden lg:table-cell font-mono">
                    {item.churnScore}/100
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell font-mono">
                    <span className="text-rose-300 font-medium">
                      {item.defectFixCount !== undefined ? `${item.defectFixCount} fixes` : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-100">
                    {formatCurrency(item.estimatedRemediationCost)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHotspot(item);
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
                    >
                      Drilldown
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-zinc-950/40 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between items-center">
        <span>Showing {filteredHotspots.length} of {hotspots.length} identified hotspots</span>
        <span className="italic">Click any row to open full technical debt telemetry panel</span>
      </div>
    </div>
  );
};
