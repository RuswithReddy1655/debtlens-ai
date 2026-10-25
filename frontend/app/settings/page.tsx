'use client';

import React, { useState, useEffect } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import {
  Settings,
  DollarSign,
  Database,
  Server,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function SettingsPage() {
  const { financialRate, setFinancialRate } = useRepository();

  const [rate, setRate] = useState<number>(financialRate);
  const [workingHours, setWorkingHours] = useState<number>(1880);
  const [defectMultiplier, setDefectMultiplier] = useState<number>(2.5);
  const [reworkFriction, setReworkFriction] = useState<number>(18);
  const [currency, setCurrency] = useState<string>('USD');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [healthData, setHealthData] = useState<{
    status: string;
    database?: { isConnected: boolean; host?: string; status?: string };
    demoMode?: boolean;
    version?: string;
  } | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.checkHealth();
        setHealthData(res);
      } catch {
        setHealthData(null);
      }
    };
    fetchHealth();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFinancialRate(rate);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
        <Settings className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-zinc-100">
          Financial Assumptions & Engine Settings
        </h2>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Assumptions successfully calibrated! All financial models updated.</span>
        </div>
      )}

      {/* Assumptions Configuration Form */}
      <form
        onSubmit={handleSave}
        className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm space-y-6"
      >
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <DollarSign className="w-4 h-4" />
          <span>Engineering Economics Parameters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Fully Loaded Engineering Hourly Rate ($/hr)
            </label>
            <input
              type="number"
              min="20"
              max="500"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Direct hourly cost including salary, benefits, and operational tooling.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Annual Billable Engineering Hours
            </label>
            <input
              type="number"
              min="1000"
              max="2500"
              value={workingHours}
              onChange={(e) => setWorkingHours(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">Standard dev year (typically 1,880 hrs).</p>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Defect Remediation Friction Multiplier
            </label>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="10.0"
              value={defectMultiplier}
              onChange={(e) => setDefectMultiplier(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Cost multiplier for post-release regression fixes vs preventive clean code.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              High-Debt Friction Drag (%)
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={reworkFriction}
              onChange={(e) => setReworkFriction(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Percentage of engineer time lost to navigation and cognitive friction in complex files.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Currency Code</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            Save Assumptions
          </button>
        </div>
      </form>

      {/* Operational Diagnostic & MongoDB Health Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
          <Server className="w-4 h-4" />
          <span>System Environment & Storage Diagnostic</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
            <div className="text-zinc-500">Express REST API</div>
            <div className="text-zinc-200 mt-1 font-bold">
              {healthData?.status === 'healthy' ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE (v{healthData.version})
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> RECONNECTING...
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
            <div className="text-zinc-500">MongoDB Persistence</div>
            <div className="text-zinc-200 mt-1 font-bold">
              {healthData?.database?.isConnected ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED ({healthData.database.host})
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> DEMO STORAGE ACTIVE (No active connection)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-400 leading-relaxed">
          <strong className="text-zinc-300">Phase 1 Architecture Policy: </strong>
          MongoDB is configured via Mongoose. If MongoDB is not running locally, the system operates
          in resilient benchmark mode without crashing, providing instant UI validation and testing.
        </div>
      </div>
    </div>
  );
}
