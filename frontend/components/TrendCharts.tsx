'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendPoint } from '../types';

interface TrendChartsProps {
  trends: TrendPoint[];
}

export const TrendCharts: React.FC<TrendChartsProps> = ({ trends }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formattedData = trends.map((item) => {
    const d = new Date(item.date);
    return {
      ...item,
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  if (!isMounted) {
    return (
      <div className="h-64 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-center text-xs text-zinc-500">
        Loading interactive timeline charts...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Debt Hours & Remediation Liability */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h4 className="text-sm font-bold text-zinc-100">Technical Debt Hours Trajectory</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Historical accumulation of refactoring debt</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
            Liability +58% (6 mo)
          </span>
        </div>

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="debtHoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="displayDate" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v}h`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
                formatter={(val: any, name: any) => [
                  `${val ?? 0} hours`,
                  name === 'totalDebtHours' ? 'Debt Hours' : String(name || ''),
                ]}
              />
              <Area
                type="monotone"
                dataKey="totalDebtHours"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#debtHoursGrad)"
                name="Total Debt Hours"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Codebase Health Score Trend */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h4 className="text-sm font-bold text-zinc-100">Overall Health Score Progression</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Composite architecture maintainability index</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
            Target &gt; 80/100
          </span>
        </div>

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="displayDate" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} domain={[50, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
                formatter={(val: any, name: any) => [
                  `${val ?? 0}/100`,
                  name === 'healthScore' ? 'Health Score' : String(name || ''),
                ]}
              />
              <Line
                type="monotone"
                dataKey="healthScore"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 4, fill: '#06b6d4' }}
                activeDot={{ r: 6 }}
                name="Health Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Historical Maintenance & Rework Friction */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 backdrop-blur-sm lg:col-span-2">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h4 className="text-sm font-bold text-zinc-100">Lines of Code vs Rework Hours</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Correlation between expanding codebase size and developer time lost to bug triage
            </p>
          </div>
        </div>

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="displayDate" stroke="#71717a" fontSize={11} />
              <YAxis yAxisId="left" stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v / 1000}k LoC`} />
              <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v}h`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar
                yAxisId="left"
                dataKey="linesOfCode"
                fill="#3b82f6"
                name="Lines of Code"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="reworkHours"
                fill="#f59e0b"
                name="Monthly Rework Hours"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
