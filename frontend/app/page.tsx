'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  TrendingUp,
  Target,
  ShieldCheck,
  Sparkles,
  GitBranch,
  Flame,
  CheckCircle2,
  DollarSign,
  Layers,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'risk' | 'finance' | 'priority' | 'verify' | 'predict'>('risk');

  return (
    <div className="space-y-16 py-6 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 border border-zinc-800 p-8 sm:p-12 md:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>ENTERPRISE ENGINEERING INTELLIGENCE COMMAND CENTER</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turn Code Complexity Into <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Financial Clarity.</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl font-normal">
            DebtLens AI transforms technical debt telemetry into engineering risk, financial exposure, priorities, and measurable debt reduction. Discover where friction costs developer hours before problems become expensive.
          </p>

          {/* Primary Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/repository"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/25 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <GitBranch className="w-4 h-4" />
              <span>Analyze Your Repository</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Explore Demo</span>
            </Link>
          </div>

          {/* Assurance Trust Strip */}
          <div className="pt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Real Git History & AST Telemetry
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Transparent Financial Models
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              Zero Autonomous Code Mutation
            </span>
          </div>
        </div>
      </section>

      {/* The Core Story: Telemetry to Financial Clarity */}
      <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            The Product Story
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
            How Telemetry Becomes Actionable Decisions
          </h2>
          <p className="text-xs text-zinc-400">
            Every screen connects physical code modifications directly to executive budgeting and engineering verification.
          </p>
        </div>

        {/* 9-Stage Story Diagram */}
        <div className="overflow-x-auto py-2">
          <div className="flex items-center justify-between min-w-[760px] gap-2 px-4 py-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs font-mono">
            {[
              { label: 'CODE', desc: 'AST Syntax' },
              { label: 'RISK', desc: 'Complexity & Churn' },
              { label: 'DEBT', desc: 'Hotspots' },
              { label: 'IMPACT', desc: 'Maintenance Drag' },
              { label: 'FINANCIAL', desc: 'Annual Exposure' },
              { label: 'PRIORITIZE', desc: 'Impact vs Effort' },
              { label: 'ACTION', desc: 'Lifecycle Sprint' },
              { label: 'VERIFY', desc: 'Before / After' },
              { label: 'FORECAST', desc: 'Cost of Inaction' },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.label}>
                <div className="text-center group">
                  <div className="font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors">
                    {step.label}
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">{step.desc}</div>
                </div>
                {idx < arr.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Product Feature Showcase (5 Pillars) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Platform Capabilities
            </span>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight mt-1">
              Five Pillars of Engineering Intelligence
            </h2>
          </div>

          {/* Interactive Pillar Switcher */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl overflow-x-auto">
            {[
              { id: 'risk', label: 'Engineering Risk', icon: Flame },
              { id: 'finance', label: 'Financial Intelligence', icon: DollarSign },
              { id: 'priority', label: 'Priority Engine', icon: Target },
              { id: 'verify', label: 'Debt Verification', icon: ShieldCheck },
              { id: 'predict', label: 'Predictive Intelligence', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-zinc-100 shadow'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Display Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          {activeTab === 'risk' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800 text-xs font-mono font-semibold">
                  <Flame className="w-3.5 h-3.5" />
                  PILLAR 1: ENGINEERING RISK & HOTSPOTS
                </div>
                <h3 className="text-xl font-bold text-zinc-100">
                  Surface where complexity collides with high developer churn.
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  High complexity alone is not technical debt if the file never changes. DebtLens calculates exact AST cyclomatic complexity, nesting depth, and cross-references it with Git commit velocity and defect-fix messages to identify volatile hotspots.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">AST COMPLEXITY</p>
                    <p className="text-sm font-bold text-zinc-200 mt-0.5">Exact Decision Paths</p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">GIT CHURN</p>
                    <p className="text-sm font-bold text-zinc-200 mt-0.5">Commit Velocity & Diffs</p>
                  </div>
                </div>
                <Link
                  href="/hotspots"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 pt-2"
                >
                  <span>Explore Hotspots Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                  <span>payment-service/transaction.ts</span>
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                    CRITICAL RISK 91
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">AST Complexity:</span>
                    <span>31 (High branching)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Recent Churn:</span>
                    <span>42 commit modifications</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Defect Commits:</span>
                    <span className="text-amber-400">7 bug patches detected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ownership Silo:</span>
                    <span>82% single author</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800 text-emerald-400 font-semibold text-right">
                  Modeled Exposure: ₹4.8L / year
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-mono font-semibold">
                  <DollarSign className="w-3.5 h-3.5" />
                  PILLAR 2: FINANCIAL INTELLIGENCE
                </div>
                <h3 className="text-xl font-bold text-zinc-100">
                  Four-Quadrant Engineering Economics.
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Converts technical debt into 4 explicit cost drivers summing to 100%: Maintenance Friction, Defect/Fix Burden, Change Friction, and Legacy Risk. Always classified as MODELED with auditable formula traces.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">UNCERTAINTY RANGES</p>
                    <p className="text-sm font-bold text-zinc-200 mt-0.5">Low • Expected • High</p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">DATA CLASSIFICATION</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">MODELED ESTIMATE</p>
                  </div>
                </div>
                <Link
                  href="/financial-intelligence"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 pt-2"
                >
                  <span>Inspect Financial Models</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs shadow-inner">
                <p className="text-zinc-400 font-semibold text-xs border-b border-zinc-800 pb-2">
                  Four-Quadrant Cost Driver Breakdown
                </p>
                <div className="space-y-2 text-[11px]">
                  <div>
                    <div className="flex justify-between text-indigo-300">
                      <span>1. Maintenance Friction</span>
                      <span className="font-bold">38% (₹7.0L)</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '38%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-rose-300">
                      <span>2. Defect/Fix Burden</span>
                      <span className="font-bold">28% (₹5.2L)</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: '28%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-amber-300">
                      <span>3. Change Friction</span>
                      <span className="font-bold">20% (₹3.7L)</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-emerald-300">
                      <span>4. Legacy Stasis</span>
                      <span className="font-bold">14% (₹2.6L)</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '14%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'priority' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-xs font-mono font-semibold">
                  <Target className="w-3.5 h-3.5" />
                  PILLAR 3: DECISION PRIORITIZATION
                </div>
                <h3 className="text-xl font-bold text-zinc-100">
                  What should engineering fix first?
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Avoid the trap of endless backlogs. The Impact vs Effort 2D Matrix isolates Quick Wins (High Impact, Low Effort) from Strategic architecture shifts, ensuring every sprint delivers maximum developer velocity return.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">QUICK WINS</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">High Impact / Low Effort</p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">STRATEGIC</p>
                    <p className="text-sm font-bold text-indigo-400 mt-0.5">High Impact / High Effort</p>
                  </div>
                </div>
                <Link
                  href="/priorities"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 pt-2"
                >
                  <span>View Priority Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs shadow-inner">
                <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800">
                    <p className="font-bold text-emerald-300">QUICK WINS</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Fix in next sprint</p>
                    <p className="text-xs font-bold text-emerald-400 mt-1">4 Files (₹5.4L savings)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800">
                    <p className="font-bold text-indigo-300">STRATEGIC</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Architecture roadmap</p>
                    <p className="text-xs font-bold text-indigo-400 mt-1">3 Files (₹7.2L savings)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800">
                    <p className="font-bold text-cyan-300">OPPORTUNISTIC</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Touch during feature edit</p>
                    <p className="text-xs font-bold text-cyan-400 mt-1">5 Files</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                    <p className="font-bold text-zinc-400">DEFER</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Monitor only</p>
                    <p className="text-xs font-bold text-zinc-400 mt-1">2 Files</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  PILLAR 4: QUANTITATIVE VERIFICATION
                </div>
                <h3 className="text-xl font-bold text-zinc-100">
                  Did the refactoring actually improve the code?
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Closing a ticket does not prove technical debt was resolved. DebtLens automatically analyzes post-merge commits to verify that cyclomatic complexity decreased by $\ge 20\%$. If complexity did not improve, the debt item is automatically reopened.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">VERIFIED THRESHOLD</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">$\ge 20\%$ Complexity Drop</p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">REGRESSION REOPEN</p>
                    <p className="text-sm font-bold text-rose-400 mt-0.5">&lt; 5% Reopened</p>
                  </div>
                </div>
                <Link
                  href="/verification"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 pt-2"
                >
                  <span>Inspect Verification Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800">
                  <span className="text-zinc-300 font-semibold">Verification Result</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    VERIFIED (42% IMPROVEMENT)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="p-3 bg-zinc-900 rounded-lg">
                    <p className="text-[10px] text-zinc-500">BEFORE COMMIT</p>
                    <p className="text-lg font-bold text-rose-400 mt-1">Complexity 31</p>
                    <p className="text-[10px] text-zinc-500">42 changes • High churn</p>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-lg">
                    <p className="text-[10px] text-zinc-500">AFTER MERGE</p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">Complexity 18</p>
                    <p className="text-[10px] text-emerald-500/80">↓ 42% verified drop</p>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 text-center pt-1">
                  Automated re-analysis confirmed via commit diff telemetry.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'predict' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-xs font-mono font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  PILLAR 5: PREDICTIVE ENGINEERING
                </div>
                <h3 className="text-xl font-bold text-zinc-100">
                  What is likely to happen next if we wait?
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Predicts risk trajectory, emerging critical hotspots, and the modeled Cost of Doing Nothing before code deterioration causes outages or slows sprint velocity. Features multi-horizon forecasting and retrospective accuracy auditing.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">HORIZONS</p>
                    <p className="text-sm font-bold text-indigo-400 mt-0.5">1 • 3 • 6 Analysis Cycles</p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500 text-[10px]">COST OF DOING NOTHING</p>
                    <p className="text-sm font-bold text-rose-400 mt-0.5">+₹4.3L Drift Projected</p>
                  </div>
                </div>
                <Link
                  href="/predictive-intelligence"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-2"
                >
                  <span>Open Predictive Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs shadow-inner">
                <p className="text-zinc-300 font-semibold text-xs border-b border-zinc-800 pb-2">
                  Cost of Inaction Trajectory (Modeled)
                </p>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Current Exposure:</span>
                    <span className="text-zinc-200 font-bold">₹18.4L / year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Forecast (3 cycles):</span>
                    <span className="text-amber-400 font-bold">₹22.7L / year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Projected Drift:</span>
                    <span className="text-rose-400 font-bold">+₹4.3L / year (+23.4%)</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500">
                    Recommendation: Refactor PaymentService in next sprint (16h estimated effort).
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Ready to discover your engineering debt and financial exposure?
        </h2>
        <p className="text-xs text-zinc-400 max-w-xl mx-auto">
          Connect your repository in seconds. Analyze real Git commits, AST structures, and cost drivers with zero code mutation.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/repository"
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow transition-all"
          >
            Analyze a Repository
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all"
          >
            Launch Command Center
          </Link>
        </div>
      </section>
    </div>
  );
}
