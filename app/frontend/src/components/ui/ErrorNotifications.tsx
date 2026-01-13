/**
 * Error Notification Component
 *
 * Displays sequential error notifications as a non-intrusive jeweled indicator.
 * Shows as a small badge in the corner that expands on hover.
 */

'use client';

import { useState } from 'react';
import { useErrorNotification } from '@/lib/hooks/useErrorNotification';

export function ErrorNotifications() {
  const { errors, removeError, clearErrors, getErrorLog } = useErrorNotification();
  const [showLog, setShowLog] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  if (errors.length === 0) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-300 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'error':
        return '✕';
      case 'warning':
        return '!';
      case 'info':
        return 'ⓘ';
      default:
        return '•';
    }
  };

  const getIconBg = () => {
    const hasError = errors.some(e => e.type === 'error');
    const hasWarning = errors.some(e => e.type === 'warning');
    
    if (hasError) return 'bg-red-500';
    if (hasWarning) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Error Badge - Always Visible */}
      <div className={`${getIconBg()} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg cursor-pointer hover:shadow-xl transition-shadow`}>
        {errors.length}
      </div>

      {/* Expanded Panel - Visible on Hover */}
      {isHovering && (
        <div className="absolute bottom-12 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md min-w-96 z-50 animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900">
              {errors.length} error{errors.length !== 1 ? 's' : ''}
            </h3>
            <button
              onClick={clearErrors}
              className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Error List */}
          <div className="space-y-0 max-h-80 overflow-y-auto">
            {errors.map((error, idx) => (
              <div
                key={error.id}
                className={`p-3 border-l-4 ${getTypeColor(error.type)} ${idx !== errors.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-lg leading-none mt-0.5">{getTypeEmoji(error.type)}</span>
                    <div className="flex-1">
                      {/* Message */}
                      <p className="font-medium text-sm leading-tight">{error.message}</p>

                      {/* Request Context */}
                      {error.endpoint && (
                        <p className="text-xs opacity-75 mt-1 font-mono">
                          {error.method || 'REQ'} {error.endpoint}
                          {error.status && ` (${error.status})`}
                        </p>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs opacity-60 mt-0.5">
                        {error.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => removeError(error.id)}
                    className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
                    aria-label="Close notification"
                  >
                    ✕
                  </button>
                </div>

                {/* Details (if present) */}
                {error.details && Object.keys(error.details).length > 0 && (
                  <details className="mt-2 text-xs opacity-80">
                    <summary className="cursor-pointer font-medium hover:opacity-100">Details</summary>
                    <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto">
                      {JSON.stringify(error.details, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Stack Trace (if present) */}
                {error.stackTrace && (
                  <details className="mt-2 text-xs opacity-80">
                    <summary className="cursor-pointer font-medium hover:opacity-100">Stack Trace</summary>
                    <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                      {error.stackTrace}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => setShowLog(!showLog)}
              className="w-full text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              {showLog ? 'Hide' : 'View'} Log
            </button>
          </div>

          {/* Error Log */}
          {showLog && (
            <div className="p-3 bg-gray-900 rounded-b-lg text-gray-100 text-xs font-mono border-t border-gray-200">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {getErrorLog() || 'No errors logged'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
