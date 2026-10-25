import React, { useState } from 'react';
import { Recommendation } from '../types';
import { formatCurrency } from '../lib/utils';
import { CheckCircle2, Circle, Clock, TrendingUp, Layers, ArrowRight } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  hourlyRate?: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  hourlyRate = 95,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const priorityStyles = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  }[recommendation.priority];

  const categoryStyles = {
    architecture: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    refactoring: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    testing: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    ownership: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    dependency: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  }[recommendation.category];

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 backdrop-blur-sm transition-all hover:border-zinc-700 space-y-4">
      {/* Badges & ID */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${priorityStyles}`}>
            {recommendation.priority}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${categoryStyles}`}>
            {recommendation.category}
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-500">{recommendation.id}</span>
      </div>

      {/* Title & Rationale */}
      <div>
        <h3 className="text-base font-bold text-zinc-100">{recommendation.title}</h3>
        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{recommendation.rationale}</p>
      </div>

      {/* Target Files */}
      {recommendation.targetFiles.length > 0 && (
        <div className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg">
          <div className="text-[11px] font-mono text-zinc-500 mb-1">Impacted Target Files:</div>
          <div className="flex flex-wrap gap-1.5">
            {recommendation.targetFiles.map((f, i) => (
              <span
                key={i}
                className="font-mono text-xs px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-cyan-300 rounded"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ROI & Financial Metas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-zinc-800/80 text-xs">
        <div>
          <span className="text-zinc-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Effort
          </span>
          <div className="text-sm font-semibold text-zinc-200 mt-0.5">
            {recommendation.estimatedEffortHours} hrs
          </div>
        </div>

        <div>
          <span className="text-zinc-500">Refactor Cost</span>
          <div className="text-sm font-semibold text-zinc-200 mt-0.5">
            {formatCurrency(recommendation.estimatedCost)}
          </div>
        </div>

        <div>
          <span className="text-zinc-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Annual Savings
          </span>
          <div className="text-sm font-semibold text-emerald-400 mt-0.5">
            {formatCurrency(recommendation.projectedAnnualSavings)}
          </div>
        </div>

        <div>
          <span className="text-zinc-500">ROI / Payback</span>
          <div className="text-sm font-semibold text-cyan-400 mt-0.5">
            {recommendation.roiRatio}x ({recommendation.paybackPeriodMonths} mo)
          </div>
        </div>
      </div>

      {/* Action Plan Checklist */}
      {recommendation.actionPlan && recommendation.actionPlan.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Remediation Action Plan:
          </div>
          <ul className="space-y-1.5">
            {recommendation.actionPlan.map((step, idx) => {
              const isDone = !!completedSteps[idx];
              return (
                <li
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`flex items-start space-x-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isDone ? 'bg-zinc-950/40 text-zinc-500 line-through' : 'hover:bg-zinc-850 text-zinc-300'
                  }`}
                >
                  <button className="shrink-0 mt-0.5 text-cyan-400">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-600" />
                    )}
                  </button>
                  <span>{step}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
