import React, { useState } from 'react';
import {
  DollarSign,
  History,
  TrendingDown,
  Sparkles,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { FinancialValuation } from '../types';
import { formatCurrency, formatNumber } from '../lib/utils';

interface CostBreakdownProps {
  valuation: FinancialValuation;
  onRateChange?: (newRate: number) => void;
}

export const CostBreakdown: React.FC<CostBreakdownProps> = ({ valuation, onRateChange }) => {
  const [currentRate, setCurrentRate] = useState<number>(valuation.hourlyRate || 95);
  const [activeTrace, setActiveTrace] = useState<string | null>(null);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseInt(e.target.value, 10);
    setCurrentRate(rate);
    if (onRateChange) {
      onRateChange(rate);
    }
  };

  const toggleTrace = (quadrant: string) => {
    setActiveTrace(activeTrace === quadrant ? null : quadrant);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Rate Simulation Control */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-zinc-100 font-bold text-sm">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Engineering Hourly Rate Sensitivity Simulator</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Adjust fully loaded engineer compensation rate to recalibrate all financial debt models.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <input
              type="range"
              min="50"
              max="250"
              step="5"
              value={currentRate}
              onChange={handleSliderChange}
              className="w-full sm:w-48 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="font-mono font-bold text-sm bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-cyan-300 min-w-[90px] text-center">
              ${currentRate}/hr
            </div>
          </div>
        </div>
      </div>

      {/* 4 Financial Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quadrant 1: Remediation Investment */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                <DollarSign className="w-4 h-4" />
                <span>1. Estimated Remediation Investment</span>
              </div>
              <button
                onClick={() => toggleTrace('remediation')}
                className="text-xs text-zinc-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>Formula Trace</span>
                {activeTrace === 'remediation' ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-zinc-100 font-mono">
                {formatCurrency(valuation.estimatedRemediationInvestment.totalCost)}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Required refactoring budget ({formatNumber(valuation.estimatedRemediationInvestment.totalHours)} hours total)
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
              Capital required to refactor accumulated architectural debt and high-complexity hotspot modules down to stable maintenance thresholds.
            </p>
          </div>

          {activeTrace === 'remediation' && (
            <div className="mt-4 p-3.5 bg-zinc-950 border border-cyan-500/20 rounded-lg text-xs space-y-2 animate-in fade-in">
              <div className="font-mono text-cyan-300 font-semibold">
                Formula: {valuation.estimatedRemediationInvestment.trace.formula}
              </div>
              <div className="text-zinc-400">
                Inputs: {JSON.stringify(valuation.estimatedRemediationInvestment.trace.input)}
              </div>
              <div className="text-[11px] text-zinc-500">
                {valuation.estimatedRemediationInvestment.trace.explanation}
              </div>
            </div>
          )}
        </div>

        {/* Quadrant 2: Historical Maintenance & Rework Burden */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <History className="w-4 h-4" />
                <span>2. Historical Maintenance & Rework Burden</span>
              </div>
              <button
                onClick={() => toggleTrace('historical')}
                className="text-xs text-zinc-400 hover:text-amber-300 flex items-center space-x-1"
              >
                <span>Formula Trace</span>
                {activeTrace === 'historical' ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-amber-300 font-mono">
                {formatCurrency(valuation.historicalMaintenanceReworkBurden.totalCost)}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Estimated capital already consumed ({formatNumber(valuation.historicalMaintenanceReworkBurden.totalHours)} hours spent)
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
              Historical engineering hours lost to repeated regression triage, avoidable bug fixes, and continuous churn frictions over the last 12 months.
            </p>
          </div>

          {activeTrace === 'historical' && (
            <div className="mt-4 p-3.5 bg-zinc-950 border border-amber-500/20 rounded-lg text-xs space-y-2 animate-in fade-in">
              <div className="font-mono text-amber-300 font-semibold">
                Formula: {valuation.historicalMaintenanceReworkBurden.trace.formula}
              </div>
              <div className="text-zinc-400">
                Inputs: {JSON.stringify(valuation.historicalMaintenanceReworkBurden.trace.input)}
              </div>
              <div className="text-[11px] text-zinc-500">
                {valuation.historicalMaintenanceReworkBurden.trace.explanation}
              </div>
            </div>
          )}
        </div>

        {/* Quadrant 3: Estimated Future Avoidable Cost */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
                <TrendingDown className="w-4 h-4" />
                <span>3. Estimated Future Avoidable Cost (Annual)</span>
              </div>
              <button
                onClick={() => toggleTrace('future')}
                className="text-xs text-zinc-400 hover:text-rose-300 flex items-center space-x-1"
              >
                <span>Formula Trace</span>
                {activeTrace === 'future' ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-rose-400 font-mono">
                {formatCurrency(valuation.estimatedFutureAvoidableCost.projectedAnnualCost)}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Projected drag over next 12 months if unaddressed
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
              Future financial loss resulting from slowed sprint velocity, technical onboarding overhead, and continuous maintenance debt on unresolved hotspots.
            </p>
          </div>

          {activeTrace === 'future' && (
            <div className="mt-4 p-3.5 bg-zinc-950 border border-rose-500/20 rounded-lg text-xs space-y-2 animate-in fade-in">
              <div className="font-mono text-rose-300 font-semibold">
                Formula: {valuation.estimatedFutureAvoidableCost.trace.formula}
              </div>
              <div className="text-zinc-400">
                Inputs: {JSON.stringify(valuation.estimatedFutureAvoidableCost.trace.input)}
              </div>
              <div className="text-[11px] text-zinc-500">
                {valuation.estimatedFutureAvoidableCost.trace.explanation}
              </div>
            </div>
          )}
        </div>

        {/* Quadrant 4: Potential Refactoring Benefit */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>4. Potential Refactoring Benefit & ROI</span>
              </div>
              <button
                onClick={() => toggleTrace('benefit')}
                className="text-xs text-zinc-400 hover:text-emerald-300 flex items-center space-x-1"
              >
                <span>Formula Trace</span>
                {activeTrace === 'benefit' ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="mt-4 flex items-baseline space-x-4">
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {formatCurrency(valuation.potentialRefactoringBenefit.netSavings)}
              </div>
              <div className="text-xs font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">
                {valuation.potentialRefactoringBenefit.roiRatio}x ROI
              </div>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Estimated payback period: {valuation.potentialRefactoringBenefit.paybackMonths} months
            </div>

            <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
              Net savings realized across a 2-year operational horizon after fully recovering refactoring investment through avoided maintenance.
            </p>
          </div>

          {activeTrace === 'benefit' && (
            <div className="mt-4 p-3.5 bg-zinc-950 border border-emerald-500/20 rounded-lg text-xs space-y-2 animate-in fade-in">
              <div className="font-mono text-emerald-300 font-semibold">
                Formula: {valuation.potentialRefactoringBenefit.trace.formula}
              </div>
              <div className="text-zinc-400">
                Inputs: {JSON.stringify(valuation.potentialRefactoringBenefit.trace.input)}
              </div>
              <div className="text-[11px] text-zinc-500">
                {valuation.potentialRefactoringBenefit.trace.explanation}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Financial Disclaimer Banner */}
      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start space-x-3 text-xs text-zinc-400">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-zinc-300">Financial Model Grounding Disclaimer: </strong>
          <span>{valuation.disclaimer}</span>
        </div>
      </div>
    </div>
  );
};
