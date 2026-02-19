import React from 'react';

// ─── ErrorAlert ────────────────────────────────────────────────────
// Consistent error banner. Previously copy-pasted across every page.
//
// Usage:
//   <ErrorAlert message={error} />
//   <ErrorAlert message={error} onDismiss={() => setError(null)} />

interface ErrorAlertProps {
  message: string | null | undefined;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div className={`mb-6 p-4 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-sm font-medium flex items-center justify-between ${className}`}>
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-3 text-red-400 hover:text-red-600 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
