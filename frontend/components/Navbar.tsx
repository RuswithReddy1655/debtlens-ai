'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  Bell,
  GitBranch,
  ChevronDown,
  User,
  Sliders,
} from 'lucide-react';
import { useRepository } from '../hooks/useRepositoryContext';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const {
    selectedRepo,
    selectedRepoId,
    setSelectedRepoId,
    repositories,
    analysis,
  } = useRepository();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch unread alerts count
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await api.getAlerts(selectedRepoId, 'UNREAD');
        if (res?.data) {
          setUnreadAlertsCount(res.data.length);
        }
      } catch {
        // Silent fallback
      }
    };
    fetchAlertCount();
  }, [selectedRepoId]);

  // Keyboard shortcut for Cmd+K / Ctrl+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setRepoDropdownOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format real analysis freshness & relative time in useEffect to satisfy React Compiler purity
  const [analysisTimeInfo, setAnalysisTimeInfo] = useState<{ relativeText: string; isFresh: boolean }>({
    relativeText: 'Baseline analysis',
    isFresh: true,
  });

  useEffect(() => {
    if (!analysis?.createdAt) {
      setAnalysisTimeInfo({ relativeText: 'Baseline analysis', isFresh: true });
      return;
    }

    try {
      const created = new Date(analysis.createdAt).getTime();
      const diffMs = Math.max(0, Date.now() - created);
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let relativeText = 'Just now';
      if (diffDays > 0) {
        relativeText = `${diffDays}d ago`;
      } else if (diffHours > 0) {
        relativeText = `${diffHours}h ago`;
      } else if (diffMins > 0) {
        relativeText = `${diffMins}m ago`;
      }

      setAnalysisTimeInfo({
        relativeText: `Last analyzed ${relativeText}`,
        isFresh: diffDays < 3,
      });
    } catch {
      setAnalysisTimeInfo({ relativeText: 'Analyzed recently', isFresh: true });
    }
  }, [analysis]);

  // Search items index
  const searchItems = useMemo(
    () => [
      { title: 'Dashboard', path: '/dashboard', category: 'Overview', desc: 'Central command center & health score' },
      { title: 'Repository Ingestion', path: '/repository', category: 'Analyze', desc: 'Analyze single repo or profile/organization' },
      { title: 'File Telemetry', path: '/files', category: 'Analyze', desc: 'Source code complexity and churn explorer' },
      { title: 'Debt Heatmap', path: '/heatmap', category: 'Analyze', desc: 'Visual distribution of code debt' },
      { title: 'Hotspots Ranking', path: '/hotspots', category: 'Analyze', desc: 'Critical high-churn, high-complexity files' },
      { title: 'Financial Intelligence', path: '/financial-intelligence', category: 'Intelligence', desc: '4-quadrant cost drivers and modeled annual exposure' },
      { title: 'Priority Matrix', path: '/priorities', category: 'Intelligence', desc: 'Impact vs Effort prioritization and tiers' },
      { title: 'Scenario Simulator', path: '/scenarios', category: 'Intelligence', desc: 'Simulate refactoring ROI and payback' },
      { title: 'Predictive Intelligence', path: '/predictive-intelligence', category: 'Intelligence', desc: 'Forecasted engineering risk and momentum' },
      { title: 'Forecasts & Accuracy', path: '/forecasts', category: 'Intelligence', desc: 'Multi-horizon forecasts and verification accuracy' },
      { title: 'What-If & Capacity', path: '/forecast-scenarios', category: 'Intelligence', desc: 'Cost of Doing Nothing and sprint capacity' },
      { title: 'Debt Lifecycle Tracker', path: '/debt', category: 'Action', desc: 'Track debt from Detected to Verified' },
      { title: 'Engineering Goals', path: '/goals', category: 'Action', desc: 'Target setting and pacing forecasts' },
      { title: 'Verification Center', path: '/verification', category: 'Action', desc: 'Quantitative before/after code verification' },
      { title: 'Engineering Alerts', path: '/alerts', category: 'Action', desc: 'Threshold breaches and early warnings' },
      { title: 'Activity Timeline', path: '/activity', category: 'Action', desc: 'Audit log of analyses and engineering actions' },
      { title: 'Executive Report', path: '/executive-report', category: 'Reporting', desc: 'CTO briefing and markdown export' },
      { title: 'Portfolio View', path: '/portfolio', category: 'Reporting', desc: 'Cross-repository organizational debt' },
      { title: 'Settings & Assumptions', path: '/settings', category: 'System', desc: 'Engineering hourly rates and assumptions' },
    ],
    []
  );

  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return searchItems.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return searchItems.filter(
      (item) => item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [searchItems, searchQuery]);

  const handleSelectSearchItem = useCallback(
    (path: string) => {
      setSearchOpen(false);
      setSearchQuery('');
      router.push(path);
    },
    [router]
  );

  return (
    <>
      <header className="bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-40">
        <div className="px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Scope Selector */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 border border-zinc-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Current Repository Scope Picker */}
            <div className="relative">
              <button
                onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <GitBranch className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-semibold text-zinc-200 truncate max-w-[160px] sm:max-w-[220px]">
                  {mounted && selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : 'Select Repository'}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
              </button>

              {repoDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1 text-[10px] font-mono text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                    Tracked Repositories
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {repositories.map((repo) => {
                      const id = repo._id || repo.id || '';
                      const isCurrent = id === selectedRepoId;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            setSelectedRepoId(id);
                            setRepoDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-cyan-950/60 text-cyan-300 font-semibold border-l-2 border-cyan-400'
                              : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{repo.owner}/{repo.name}</span>
                          {repo.isDemo && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 ml-2 shrink-0">
                              DEMO
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-zinc-800 mt-1 pt-1 px-2">
                    <Link
                      href="/repository"
                      onClick={() => setRepoDropdownOpen(false)}
                      className="block text-center text-xs font-medium py-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800/60 rounded-lg transition-colors"
                    >
                      + Add or Manage Repositories
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Health & Freshness Indicators */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Analysis healthy</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {mounted ? analysisTimeInfo.relativeText : 'Baseline analysis'}
              </span>
            </div>
          </div>

          {/* Right: Search, Notifications, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors shadow-inner"
              title="Quick Search (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search command center...</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Alerts Notification Button */}
            <Link
              href="/alerts"
              className="relative p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
              title="View Alerts"
              aria-label="View Alerts"
            >
              <Bell className="w-4 h-4" />
              {mounted && unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-[10px] font-mono font-bold text-white shadow-sm animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </Link>

            {/* Profile / Team Leader Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-1.5 pl-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs transition-colors"
                title="Engineering Profile"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                  TL
                </div>
                <span className="hidden md:inline font-medium text-[11px]">Team Leader</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-zinc-800">
                    <p className="font-semibold text-zinc-100">Engineering Lead</p>
                    <p className="text-[10px] text-zinc-400 font-mono">CTO / Architecture View</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Model Assumptions</span>
                    </Link>
                    <Link
                      href="/repository"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Add Repository</span>
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Command Center</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 p-3 bg-zinc-950 space-y-1 text-xs">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/repository', label: 'Repository' },
              { href: '/files', label: 'Files' },
              { href: '/hotspots', label: 'Hotspots' },
              { href: '/heatmap', label: 'Heatmap' },
              { href: '/financial-intelligence', label: 'Financial Intelligence' },
              { href: '/priorities', label: 'Priorities' },
              { href: '/scenarios', label: 'Scenarios' },
              { href: '/predictive-intelligence', label: 'Predictive Intelligence' },
              { href: '/forecasts', label: 'Forecasts' },
              { href: '/forecast-scenarios', label: 'What-If & Capacity' },
              { href: '/debt', label: 'Debt Tracker' },
              { href: '/goals', label: 'Goals' },
              { href: '/verification', label: 'Verification' },
              { href: '/alerts', label: 'Alerts' },
              { href: '/activity', label: 'Activity' },
              { href: '/executive-report', label: 'Executive Report' },
              { href: '/portfolio', label: 'Portfolio' },
              { href: '/settings', label: 'Settings' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-900 font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Global Command Center Search Modal (⌘K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Header */}
            <div className="p-3 border-b border-zinc-800 flex items-center gap-2.5 bg-zinc-950/60">
              <Search className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to page, feature, or metric..."
                autoFocus
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredSearchItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleSelectSearchItem(item.path)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                    {item.category}
                  </span>
                </button>
              ))}

              {filteredSearchItems.length === 0 && (
                <div className="p-6 text-center text-xs text-zinc-400">
                  No matching command or destination found for &ldquo;{searchQuery}&rdquo;.
                </div>
              )}
            </div>

            <div className="p-2.5 border-t border-zinc-800 bg-zinc-950 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
              <span>Navigate with arrow keys or click</span>
              <span>DebtLens Command Center</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
