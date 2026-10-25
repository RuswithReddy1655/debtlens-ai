'use client';

import React, { useEffect, useState } from 'react';
import { useRepository } from '../../hooks/useRepositoryContext';
import { api } from '../../services/api';
import { ExecutiveReport, CurrencyCode } from '../../types';
import {
  FileText,
  Copy,
  Check,
  Download,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { LoadingState, ErrorState } from '../../components/States';

export default function ExecutiveReportPage() {
  const { selectedAnalysis, selectedRepo, isDemoMode } = useRepository();
  const analysisId = selectedAnalysis?._id || selectedAnalysis?.id || 'analysis-demo-fintech-01';
  const repoName = selectedRepo?.name || 'Primary Repository';

  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [copied, setCopied] = useState(false);

  const loadReport = async (curr: CurrencyCode) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getExecutiveReport(analysisId, repoName, curr);
      setReport(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate executive intelligence report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(currency);
  }, [analysisId, currency]);

  const handleCopy = () => {
    if (!report?.markdownBrief) return;
    navigator.clipboard.writeText(report.markdownBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report?.markdownBrief) return;
    const blob = new Blob([report.markdownBrief], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DebtLens-Executive-Report-${repoName}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !report) {
    return <LoadingState message="Generating comprehensive executive briefing and signal classification..." />;
  }

  if (error || !report) {
    return <ErrorState message={error || 'Failed to generate executive report.'} onRetry={() => loadReport(currency)} />;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Executive Briefing
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                isDemoMode
                  ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                  : 'bg-indigo-950/70 text-indigo-300 border-indigo-800'
              }`}
            >
              {isDemoMode ? 'DEMO DATA' : 'PRODUCTION TELEMETRY'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Technical Debt & Financial Intelligence Briefing
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Synthesized decision-support briefing for engineering leadership, VP of Engineering, and CTO.
          </p>
        </div>

        {/* Actions & Currency */}
        <div className="flex items-center gap-2.5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 flex gap-1 mr-2">
            {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  currency === c
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy MD'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Executive KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Technical Debt Score</p>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {report.keyMetrics.overallDebtScore}
            <span className="text-xs text-zinc-500"> / 100</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">{report.keyMetrics.criticalHotspotsCount} critical hotspots</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Annual Exposure</p>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {report.keyMetrics.annualFinancialExposureFormatted}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Primary: {report.keyMetrics.topCostDriver}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Modeled Savings</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {report.keyMetrics.potentialAnnualSavingsFormatted}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">At 65% remediation</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Payback Horizon</p>
          <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">
            {report.keyMetrics.paybackPeriodMonths ? `${report.keyMetrics.paybackPeriodMonths} mos` : 'N/A'}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">ROI: {report.keyMetrics.refactoringROIFormatted}</p>
        </div>
      </div>

      {/* Report Narrative Sections */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Section 1: Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">
              1
            </span>
            Executive Summary
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            {report.executiveSummaryText}
          </p>
        </div>

        {/* Phase 5: Predictive Outlook & Emerging Engineering Risk */}
        {report.predictiveOutlook && (
          <div className="space-y-3 bg-gradient-to-br from-indigo-950/30 via-zinc-900 to-zinc-950 p-5 rounded-xl border border-indigo-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-900/30">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Executive Predictive Outlook & Emerging Risk
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  CONFIDENCE: {report.predictiveOutlook.predictionConfidence}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  TREND: {report.predictiveOutlook.riskTrend}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {report.predictiveOutlook.currentDebtPosition}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800">
                <p className="text-[11px] text-zinc-400">Future Risk Tier</p>
                <p className="text-base font-bold text-rose-400 mt-0.5">
                  {report.predictiveOutlook.futureRiskTier}{' '}
                  <span className="text-xs text-zinc-500 font-normal">
                    (Score: {report.predictiveOutlook.futureRiskScore}/100)
                  </span>
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {report.predictiveOutlook.emergingHotspotsCount} emerging critical hotspot(s)
                </p>
              </div>

              <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800">
                <p className="text-[11px] text-zinc-400">Forecasted Exposure</p>
                <p className="text-base font-bold text-amber-400 mt-0.5 font-mono">
                  {report.predictiveOutlook.forecastedExposureFormatted}
                </p>
                <p className="text-[10px] text-rose-400 mt-1">
                  +{report.predictiveOutlook.potentialIncreaseFormatted} potential modeled drift
                </p>
              </div>

              <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800">
                <p className="text-[11px] text-zinc-400">Goal Trajectory</p>
                <p className="text-xs font-semibold text-amber-300 mt-1">
                  {report.predictiveOutlook.goalOutlook}
                </p>
              </div>
            </div>

            {/* Cost of Doing Nothing Callout */}
            <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-3 text-xs text-zinc-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-300 block mb-0.5">Cost of Doing Nothing (Modeled Trajectory):</span>
                <span>{report.predictiveOutlook.costOfDoingNothingText}</span>
              </div>
            </div>

            {/* Recommended Engineering Focus */}
            {report.predictiveOutlook.recommendedFocus?.length > 0 && (
              <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80 text-xs">
                <span className="text-zinc-400 font-semibold block mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  Recommended Immediate Engineering Focus:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {report.predictiveOutlook.recommendedFocus.map((file, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono text-[11px] text-zinc-200"
                    >
                      {file}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Financial Position */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-mono font-bold">
              2
            </span>
            Financial Exposure & Opportunity
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            {report.financialPositionText}
          </p>
        </div>

        {/* Section 3: Cost Driver Breakdown */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">
              3
            </span>
            Primary Engineering Cost Drivers
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            {report.costDriversSummaryText}
          </p>
        </div>

        {/* Section 4: Priority Actions */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs font-mono font-bold">
              4
            </span>
            Top 5 Priority Refactoring Recommendations
          </h2>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Quadrant</th>
                  <th className="py-2.5 px-3 text-right">Annual Impact</th>
                  <th className="py-2.5 px-3">Suggested Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                {report.priorityActions.map((action) => (
                  <tr key={action.rank} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-mono text-zinc-400">{action.rank}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-zinc-200">
                      {action.filePath.split('/').pop()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        {action.priorityTier}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 text-zinc-300 border border-zinc-800">
                        {action.matrixQuadrant}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                      {action.annualImpactFormatted}
                    </td>
                    <td className="py-3 px-3 text-zinc-300">{action.suggestedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Signal Classification & Limitations */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
              5
            </span>
            Confidence & Signal Classification Trace
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-2">
              <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Signal Classification
              </p>
              <div className="space-y-1 text-[11px] text-zinc-400">
                <p>
                  <strong className="text-zinc-300">OBSERVED:</strong>{' '}
                  {report.confidenceAndLimitations.observedSignals.join(', ')}
                </p>
                <p>
                  <strong className="text-zinc-300">DERIVED:</strong>{' '}
                  {report.confidenceAndLimitations.derivedSignals.join(', ')}
                </p>
                <p>
                  <strong className="text-zinc-300">ESTIMATED:</strong>{' '}
                  {report.confidenceAndLimitations.estimatedSignals.join(', ')}
                </p>
                <p>
                  <strong className="text-zinc-300">MODELED:</strong>{' '}
                  {report.confidenceAndLimitations.modeledSignals.join(', ')}
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-2">
              <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Limitations & Governance
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400">
                {report.confidenceAndLimitations.limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
