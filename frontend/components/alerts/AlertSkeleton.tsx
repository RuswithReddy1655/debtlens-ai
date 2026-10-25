import React from 'react';

export const AlertSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-5 space-y-4 animate-pulse"
        >
          {/* Header row skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-28 bg-zinc-800 rounded-md" />
              <div className="h-5 w-24 bg-zinc-800 rounded-md" />
            </div>
            <div className="h-4 w-24 bg-zinc-800/80 rounded" />
          </div>

          {/* Asset skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800" />
            <div className="space-y-1.5 flex-1">
              <div className="h-5 w-48 bg-zinc-800 rounded" />
              <div className="h-3 w-72 bg-zinc-850 rounded" />
            </div>
          </div>

          {/* 4-Column Telemetry blocks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                <div className="h-3 w-16 bg-zinc-850 rounded" />
                <div className="h-5 w-20 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>

          {/* Why this matters skeleton */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-850 space-y-1.5">
            <div className="h-3 w-28 bg-zinc-800 rounded" />
            <div className="h-4 w-full bg-zinc-850 rounded" />
          </div>

          {/* Actions skeleton */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
            <div className="flex items-center gap-2">
              <div className="h-8 w-36 bg-zinc-800 rounded-lg" />
              <div className="h-8 w-28 bg-zinc-850 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 bg-zinc-800 rounded-lg" />
              <div className="h-8 w-8 bg-zinc-850 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
