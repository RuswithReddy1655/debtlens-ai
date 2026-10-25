'use client';

import React, { useEffect, useState } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { FinancialIntelligenceData, CurrencyCode } from '../../types';
import {
  TrendingUp,
  DollarSign,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sliders,
  FileCode2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { LoadingState, ErrorState } from '../../components/States';

const CURRENCIES: Array<{ code: CurrencyCode; symbol: string; label: string; defaultRate: number }> = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)', defaultRate: 2000 },
  { code: 'USD', symbol: '$', label: 'USD ($)', defaultRate: 95 },
  { code: 'EUR', symbol: '€', label: 'EUR (€)', defaultRate: 88 },
  { code: 'GBP', symbol: '£', label: 'GBP (£)', defaultRate: 75 },
];

export default function FinancialIntelligencePage() {
  const { selectedAnalysis, isDemoMode } = useRepository();
  const [data, setData] = useState<FinancialIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [hourlyRate, setHourlyRate] = useState<number>(2000);
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  const analysisId = selectedAnalysis?._id || selectedAnalysis?.id || 'analysis-demo-fintech-01';

  const loadData = async (curr: CurrencyCode, rate: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFinancialIntelligence(analysisId, curr, rate);
      setData(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load financial intelligence telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currency, hourlyRate);
  }, [analysisId, currency, hourlyRate]);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    const def = CURRENCIES.find((c) => c.code === newCurrency)?.defaultRate || 2000;
    setHourlyRate(def);
  };

  if (loading && !data) {
    return <LoadingState message="Quantifying code telemetry into financial economics..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'No financial telemetry available.'} onRetry={() => loadData(currency, hourlyRate)} />;
  }

  const { summary, fourQuadrants, costDrivers, assumptions, confidence } = data;

  const toggleTrace = (key: string) => {
    setExpandedTrace(expandedTrace === key ? null : key);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              Executive Decision Support
            </span>
            <span
              className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                confidence === 'HIGH'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950/80 text-amber-400 border-amber-800'
              }`}
            >
              Confidence: {confidence}
            </span>
            {isDemoMode && (
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Demo Financial Model
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            Financial Intelligence & Exposure Model
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Grounded capital quantification connecting AST cyclomatic complexity, churn velocity, and defect signals to financial governance.
          </p>
        </div>

        {/* Currency & Compensation Control */}
        <div className="flex flex-wrap items-center gap-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 font-medium">Currency:</span>
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleCurrencyChange(c.code)}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs transition-all ${
                    currency === c.code
                      ? 'bg-cyan-500 text-zinc-950 font-bold shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-[1px] bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-zinc-400 font-medium">Rate:</span>
            <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
              <span className="text-xs text-zinc-400 font-mono">{data.currencySymbol}</span>
              <input
                type="number"
                min="10"
                max="50000"
                step="50"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value) || 2000)}
                className="w-20 bg-transparent text-xs font-mono font-bold text-zinc-100 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-500">/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Financial KPI Banner with Classification Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Annual Avoidable Maintenance Drag */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/20 via-zinc-900/60 to-zinc-900/80 border border-rose-900/30 shadow-lg relative">
          <div className="flex items-center justify-between text-xs text-rose-300 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Modeled Annual Drag</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              MODELED
            </span>
          </div>
          <div className="text-2xl font-black text-rose-200 font-mono tracking-tight mt-1">
            {summary.formattedAnnualExposure}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            Range: {data.currencySymbol}
            {summary.annualExposureRange.low.toLocaleString()} – {data.currencySymbol}
            {summary.annualExposureRange.high.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Avoidable engineering capacity consumed per year if debt is unaddressed.</p>
        </div>

        {/* KPI 2: Remediation Investment */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/20 via-zinc-900/60 to-zinc-900/80 border border-cyan-900/30 shadow-lg relative">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Fixable Capital Outlay</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              ESTIMATED
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-200 font-mono tracking-tight mt-1">
            {summary.formattedInvestment}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            Range: {data.currencySymbol}
            {summary.investmentRange.low.toLocaleString()} – {data.currencySymbol}
            {summary.investmentRange.high.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Capital required to remediate identified critical and high risk hotspots.</p>
        </div>

        {/* KPI 3: Potential Annual Savings */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-zinc-900/60 to-zinc-900/80 border border-emerald-900/30 shadow-lg relative">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Potential Annual Savings</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              MODELED
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono tracking-tight mt-1">
            {summary.formattedSavings}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            Modeled {Math.round(assumptions.defaultRemediationEffectiveness * 100)}% friction reduction
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Developer capacity redirected to revenue-generating features.</p>
        </div>

        {/* KPI 4: 24-Month ROI & Payback */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-zinc-900/60 to-zinc-900/80 border border-indigo-900/30 shadow-lg relative">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">24-Month Net Return</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              MODELED
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-200 font-mono tracking-tight mt-1">
            {summary.formattedNetBenefit}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mt-1">
            <span>ROI: <strong className="text-indigo-300 font-bold">{summary.roiPercentage}%</strong></span>
            <span>Payback: <strong className="text-cyan-300 font-bold">{summary.paybackPeriodMonths ?? 'N/A'} mo</strong></span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Net financial benefit over a 2-year operational horizon.</p>
        </div>
      </div>

      {/* Section 29: Vertical Calculation Trace Step Diagram */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            Financial Calculation Trace & Auditable Data Lineage
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            AUDITABLE FINANCIAL PIPELINE
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold">1. Observed Inputs</span>
          <span className="text-zinc-600">&rarr;</span>
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold">2. Derived Metrics</span>
          <span className="text-zinc-600">&rarr;</span>
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold">3. Assumptions</span>
          <span className="text-zinc-600">&rarr;</span>
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold">4. Formula</span>
          <span className="text-zinc-600">&rarr;</span>
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-cyan-300 font-bold">5. Modeled Result</span>
          <span className="text-zinc-600">&rarr;</span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold">6. Confidence: {confidence}</span>
        </div>
      </div>


      {/* Four-Quadrant Financial Model with Expandable Calculation Traces */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            Four-Quadrant Technical Debt Valuation
          </h2>
          <span className="text-xs text-zinc-500 font-mono">Click cards to inspect mathematical formula traces</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1 */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Quadrant 1</span>
                <h3 className="text-base font-bold text-zinc-100 mt-0.5">Estimated Remediation Investment</h3>
                <p className="text-xs text-zinc-400 mt-1">Direct engineering capital required to refactor accumulated code debt.</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-cyan-300">
                  {data.currencySymbol}{fourQuadrants.estimatedRemediationInvestment.totalCost.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {fourQuadrants.estimatedRemediationInvestment.totalHours} hours
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleTrace('q1')}
              className="mt-4 w-full flex items-center justify-between text-xs text-zinc-400 hover:text-cyan-300 py-1.5 px-2 rounded bg-zinc-950/60 border border-zinc-800/80 transition-colors"
            >
              <span className="font-mono text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" /> Formula Trace
              </span>
              {expandedTrace === 'q1' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expandedTrace === 'q1' && (
              <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1.5 text-zinc-300">
                <div className="text-zinc-500 text-[10px]">FORMULA:</div>
                <div className="text-cyan-300">{fourQuadrants.estimatedRemediationInvestment.trace.formula}</div>
                <div className="text-zinc-500 text-[10px] pt-1">INPUTS:</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {fourQuadrants.estimatedRemediationInvestment.trace.inputs.map((inp, idx) => (
                    <div key={idx} className="text-zinc-400">
                      {inp.name}: <span className="text-zinc-200 font-bold">{inp.value} {inp.unit || ''}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 italic font-sans">
                  {fourQuadrants.estimatedRemediationInvestment.trace.explanation}
                </div>
              </div>
            )}
          </div>

          {/* Quadrant 2 */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Quadrant 2</span>
                <h3 className="text-base font-bold text-zinc-100 mt-0.5">Historical Maintenance & Rework Burden</h3>
                <p className="text-xs text-zinc-400 mt-1">Sunk capital already expended in past sprints on bug triage and patches.</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-amber-300">
                  {data.currencySymbol}{fourQuadrants.historicalMaintenanceReworkBurden.totalCost.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {fourQuadrants.historicalMaintenanceReworkBurden.totalHours} hours sunk
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleTrace('q2')}
              className="mt-4 w-full flex items-center justify-between text-xs text-zinc-400 hover:text-amber-300 py-1.5 px-2 rounded bg-zinc-950/60 border border-zinc-800/80 transition-colors"
            >
              <span className="font-mono text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" /> Formula Trace
              </span>
              {expandedTrace === 'q2' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expandedTrace === 'q2' && (
              <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1.5 text-zinc-300">
                <div className="text-zinc-500 text-[10px]">FORMULA:</div>
                <div className="text-amber-300">{fourQuadrants.historicalMaintenanceReworkBurden.trace.formula}</div>
                <div className="text-zinc-500 text-[10px] pt-1">INPUTS:</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {fourQuadrants.historicalMaintenanceReworkBurden.trace.inputs.map((inp, idx) => (
                    <div key={idx} className="text-zinc-400">
                      {inp.name}: <span className="text-zinc-200 font-bold">{inp.value} {inp.unit || ''}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 italic font-sans">
                  {fourQuadrants.historicalMaintenanceReworkBurden.trace.explanation}
                </div>
              </div>
            )}
          </div>

          {/* Quadrant 3 */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold">Quadrant 3</span>
                <h3 className="text-base font-bold text-zinc-100 mt-0.5">Estimated Future Avoidable Cost</h3>
                <p className="text-xs text-zinc-400 mt-1">Projected 12-month friction drag if accumulated debt remains unaddressed.</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-rose-300">
                  {data.currencySymbol}{fourQuadrants.estimatedFutureAvoidableCost.projectedAnnualCost.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {fourQuadrants.estimatedFutureAvoidableCost.projectedAnnualHours} hrs/yr
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleTrace('q3')}
              className="mt-4 w-full flex items-center justify-between text-xs text-zinc-400 hover:text-rose-300 py-1.5 px-2 rounded bg-zinc-950/60 border border-zinc-800/80 transition-colors"
            >
              <span className="font-mono text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400" /> Formula Trace
              </span>
              {expandedTrace === 'q3' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expandedTrace === 'q3' && (
              <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1.5 text-zinc-300">
                <div className="text-zinc-500 text-[10px]">FORMULA:</div>
                <div className="text-rose-300">{fourQuadrants.estimatedFutureAvoidableCost.trace.formula}</div>
                <div className="text-zinc-500 text-[10px] pt-1">INPUTS:</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {fourQuadrants.estimatedFutureAvoidableCost.trace.inputs.map((inp, idx) => (
                    <div key={idx} className="text-zinc-400">
                      {inp.name}: <span className="text-zinc-200 font-bold">{inp.value} {inp.unit || ''}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 italic font-sans">
                  {fourQuadrants.estimatedFutureAvoidableCost.trace.explanation}
                </div>
              </div>
            )}
          </div>

          {/* Quadrant 4 */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Quadrant 4</span>
                <h3 className="text-base font-bold text-zinc-100 mt-0.5">Potential Refactoring Benefit & ROI</h3>
                <p className="text-xs text-zinc-400 mt-1">Net capital return and payback period realized across 2 operational years.</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-emerald-300">
                  {data.currencySymbol}{fourQuadrants.potentialRefactoringBenefit.netSavings.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {fourQuadrants.potentialRefactoringBenefit.roiPercentage}% ROI
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleTrace('q4')}
              className="mt-4 w-full flex items-center justify-between text-xs text-zinc-400 hover:text-emerald-300 py-1.5 px-2 rounded bg-zinc-950/60 border border-zinc-800/80 transition-colors"
            >
              <span className="font-mono text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" /> Formula Trace
              </span>
              {expandedTrace === 'q4' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expandedTrace === 'q4' && (
              <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1.5 text-zinc-300">
                <div className="text-zinc-500 text-[10px]">FORMULA:</div>
                <div className="text-emerald-300">{fourQuadrants.potentialRefactoringBenefit.trace.formula}</div>
                <div className="text-zinc-500 text-[10px] pt-1">INPUTS:</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {fourQuadrants.potentialRefactoringBenefit.trace.inputs.map((inp, idx) => (
                    <div key={idx} className="text-zinc-400">
                      {inp.name}: <span className="text-zinc-200 font-bold">{inp.value} {inp.unit || ''}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 italic font-sans">
                  {fourQuadrants.potentialRefactoringBenefit.trace.explanation}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost Driver Breakdown */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-6">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-cyan-400" />
          Technical Debt Cost Driver Breakdown
        </h2>
        <p className="text-xs text-zinc-400 mb-6">
          Distribution of estimated annual friction loss across the four core software engineering drag categories.
        </p>

        {/* Multi-segment progress bar */}
        <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden flex mb-6">
          <div
            style={{ width: `${costDrivers.drivers.maintenanceFriction.percentageContribution}%` }}
            className="bg-cyan-500 h-full transition-all"
            title={`Maintenance Friction: ${costDrivers.drivers.maintenanceFriction.percentageContribution}%`}
          />
          <div
            style={{ width: `${costDrivers.drivers.defectFixBurden.percentageContribution}%` }}
            className="bg-amber-500 h-full transition-all"
            title={`Defect/Fix Burden: ${costDrivers.drivers.defectFixBurden.percentageContribution}%`}
          />
          <div
            style={{ width: `${costDrivers.drivers.changeFriction.percentageContribution}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`Change Friction: ${costDrivers.drivers.changeFriction.percentageContribution}%`}
          />
          <div
            style={{ width: `${costDrivers.drivers.legacyRisk.percentageContribution}%` }}
            className="bg-purple-500 h-full transition-all"
            title={`Legacy Staleness: ${costDrivers.drivers.legacyRisk.percentageContribution}%`}
          />
        </div>

        {/* Driver Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Maintenance Friction
              </span>
              <span className="font-mono text-zinc-300 font-bold">
                {costDrivers.drivers.maintenanceFriction.percentageContribution}%
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-zinc-100 mt-2">
              {data.currencySymbol}{costDrivers.drivers.maintenanceFriction.estimatedCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{costDrivers.drivers.maintenanceFriction.explanation}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Defect/Fix Burden
              </span>
              <span className="font-mono text-zinc-300 font-bold">
                {costDrivers.drivers.defectFixBurden.percentageContribution}%
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-zinc-100 mt-2">
              {data.currencySymbol}{costDrivers.drivers.defectFixBurden.estimatedCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{costDrivers.drivers.defectFixBurden.explanation}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Change Friction
              </span>
              <span className="font-mono text-zinc-300 font-bold">
                {costDrivers.drivers.changeFriction.percentageContribution}%
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-zinc-100 mt-2">
              {data.currencySymbol}{costDrivers.drivers.changeFriction.estimatedCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{costDrivers.drivers.changeFriction.explanation}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Legacy Staleness
              </span>
              <span className="font-mono text-zinc-300 font-bold">
                {costDrivers.drivers.legacyRisk.percentageContribution}%
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-zinc-100 mt-2">
              {data.currencySymbol}{costDrivers.drivers.legacyRisk.estimatedCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{costDrivers.drivers.legacyRisk.explanation}</p>
          </div>
        </div>
      </div>

      {/* Top Cost Driver Files */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-cyan-400" />
              Top Cost-Driver Files
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Files generating the largest modeled annual maintenance burden ranked by estimated cost impact.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">File Path</th>
                <th className="py-3 px-3">Primary Cost Driver</th>
                <th className="py-3 px-3">AST Complexity</th>
                <th className="py-3 px-3">Churn</th>
                <th className="py-3 px-3">Defect Commits</th>
                <th className="py-3 px-4 text-right">Annual Impact Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {costDrivers.topCostDriverFiles.map((file, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-zinc-100 truncate max-w-sm">{file.filePath}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 font-sans">{file.explanation}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-950 text-cyan-300 border border-zinc-800">
                      {file.primaryDriver}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-zinc-300 font-bold">{file.cyclomaticComplexity}</td>
                  <td className="py-3.5 px-3 text-zinc-400">{file.totalChurn} lines</td>
                  <td className="py-3.5 px-3 text-amber-400 font-bold">{file.defectFixCommitCount}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-rose-300">
                    {data.currencySymbol}{file.costRange.low.toLocaleString()} – {data.currencySymbol}{file.costRange.high.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions & Methodology Footer */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-2">
        <div className="flex items-center justify-between text-zinc-300 font-semibold font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-cyan-400" /> Model Assumptions & Governance ({assumptions.modelVersion})
          </span>
          <span>Effective Rate: {data.currencySymbol}{assumptions.hourlyRate}/hr</span>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          {data.disclaimer}
        </p>
      </div>
    </div>
  );
}
