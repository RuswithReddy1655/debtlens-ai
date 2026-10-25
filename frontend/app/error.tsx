'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DebtLens Application Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-5">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white tracking-tight">Intelligence Module Temporarily Unavailable</h2>
          <p className="text-xs text-zinc-400">
            {error?.message || 'An unexpected error occurred while rendering the intelligence view. Telemetry recovery in progress.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition shadow-lg shadow-cyan-950"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Module
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition border border-zinc-700/80"
          >
            <Home className="w-3.5 h-3.5" />
            Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
