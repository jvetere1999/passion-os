/**
 * Error Notification Component
 *
 * Displays sequential error notifications as a non-intrusive jeweled indicator.
 * Shows as a small badge in the corner that expands on hover.
 */

'use client';

import { useEffect } from 'react';
import { useErrorNotification } from '@/lib/hooks/useErrorNotification';

export function ErrorNotifications() {
  const { errors, removeError } = useErrorNotification();

  if (errors.length === 0) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-600/90 text-white shadow-red-300/50';
      case 'warning':
        return 'bg-amber-500/90 text-white shadow-amber-200/50';
      case 'info':
        return 'bg-blue-600/90 text-white shadow-blue-300/50';
      default:
        return 'bg-slate-700/90 text-white shadow-slate-300/50';
    }
  };

  // Auto-dismiss errors after 10s to avoid piling up
  useEffect(() => {
    const timers = errors.map((err) =>
      setTimeout(() => removeError(err.id), 10000)
    );
    return () => timers.forEach(clearTimeout);
  }, [errors, removeError]);

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none max-w-md w-[min(420px,90vw)]">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`pointer-events-auto rounded-2xl px-4 py-3 shadow-xl ring-1 ring-white/10 backdrop-blur-md border border-white/10 animate-in slide-in-from-top-2 fade-in ${getTypeColor(
            error.type
          )}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-tight">{error.message}</p>
              {error.endpoint && (
                <p className="text-[11px] font-mono opacity-80">
                  {error.method || 'REQ'} {error.endpoint}
                  {error.status && ` (${error.status})`}
                </p>
              )}
              <p className="text-[10px] uppercase tracking-[0.08em] opacity-70">
                {error.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeError(error.id)}
              className="text-xs font-semibold opacity-80 hover:opacity-100 transition"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>

          {error.details && Object.keys(error.details).length > 0 && (
            <pre className="mt-2 text-[11px] bg-black/20 rounded-lg p-2 whitespace-pre-wrap overflow-auto max-h-32">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
