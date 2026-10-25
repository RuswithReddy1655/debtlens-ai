'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  FileCode2,
  Grid,
  Flame,
  TrendingUp,
  Target,
  SlidersHorizontal,
  Sparkles,
  LineChart,
  CheckSquare,
  ShieldCheck,
  Bell,
  Clock,
  FileText,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'ANALYZE',
    items: [
      { href: '/repository', label: 'Repository', icon: GitBranch },
      { href: '/files', label: 'Files', icon: FileCode2 },
      { href: '/heatmap', label: 'Heatmap', icon: Grid },
      { href: '/hotspots', label: 'Hotspots', icon: Flame },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { href: '/financial-intelligence', label: 'Financial Intelligence', icon: TrendingUp },
      { href: '/priorities', label: 'Priorities', icon: Target },
      { href: '/scenarios', label: 'Scenarios', icon: SlidersHorizontal },
      { href: '/predictive-intelligence', label: 'Predictive Intelligence', icon: Sparkles, badge: 'PREDICT' },
      { href: '/forecasts', label: 'Forecasts', icon: LineChart },
    ],
  },
  {
    title: 'ACTION',
    items: [
      { href: '/debt', label: 'Debt', icon: CheckSquare },
      { href: '/goals', label: 'Goals', icon: Target },
      { href: '/verification', label: 'Verification', icon: ShieldCheck, badge: 'AUDIT' },
      { href: '/alerts', label: 'Alerts', icon: Bell },
      { href: '/activity', label: 'Activity', icon: Clock },
    ],
  },
  {
    title: 'REPORTING',
    items: [
      { href: '/executive-report', label: 'Executive Report', icon: FileText },
      { href: '/portfolio', label: 'Portfolio', icon: Building2 },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('debtlens_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      }
    } catch {
      // Local storage not available
    }
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('debtlens_sidebar_collapsed', String(next));
    } catch {
      // Local storage not available
    }
  };

  return (
    <aside
      className={`bg-zinc-950 border-r border-zinc-800/80 flex flex-col shrink-0 min-h-screen transition-all duration-300 relative select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className={`p-4 border-b border-zinc-800/80 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-lg p-0.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-zinc-100 text-sm tracking-tight flex items-center gap-1.5">
                <span>DebtLens</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">AI</span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate font-mono">Engineering Intelligence</p>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-16 z-20 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 flex items-center justify-center shadow-md text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation Groups */}
      <nav className="flex-1 p-2 space-y-4 overflow-y-auto custom-scrollbar">
        {NAVIGATION_GROUPS.map((group) => (
          <div key={group.title} className="space-y-0.5">
            {!collapsed ? (
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase font-mono">
                {group.title}
              </div>
            ) : (
              <div className="w-6 h-0.5 mx-auto bg-zinc-800 my-2 rounded" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center ${
                      collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                    } rounded-md text-xs font-medium transition-all group relative focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isActive
                        ? 'bg-zinc-800/90 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-cyan-400' : 'text-zinc-400 group-hover:text-zinc-200'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!collapsed && item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip in collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 shadow-lg font-sans transition-opacity">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Tagline */}
      {!collapsed ? (
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80 text-[10px] text-zinc-400 font-mono">
          <p className="text-zinc-300 font-semibold leading-tight">Turn code complexity into financial clarity.</p>
          <p className="mt-1 text-zinc-400">Command Center v5.0</p>
        </div>
      ) : (
        <div className="p-2 border-t border-zinc-800/80 text-center text-[10px] text-zinc-400 font-mono">
          v5
        </div>
      )}
    </aside>
  );
};
