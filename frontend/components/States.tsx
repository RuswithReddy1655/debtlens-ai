import React from 'react';
import { AlertCircle, RefreshCw, FolderSearch, Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Calculating debt telemetry...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-full animate-pulse text-cyan-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-300">{message}</p>
      <p className="mt-1 text-xs text-zinc-500">Querying intelligence pipeline & telemetry store</p>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Analysis Data Unavailable',
  message = 'Failed to retrieve telemetry data. Please ensure the backend service is reachable.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-rose-950/20 border border-rose-900/50 rounded-xl my-4">
      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-rose-200">{title}</h3>
      <p className="mt-1 text-xs text-rose-300/80 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({
  title = 'No Data Found',
  message = 'No records match the selected filters or search parameters.',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl my-4">
      <div className="p-3 bg-zinc-800/80 border border-zinc-700 rounded-full text-zinc-400">
        <FolderSearch className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-200">{title}</h3>
      <p className="mt-1 text-xs text-zinc-400 max-w-md">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
