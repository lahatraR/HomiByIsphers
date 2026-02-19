import React from 'react';

// ─── EmptyState ────────────────────────────────────────────────────
// Reusable empty state component. Previously, every list page had
// its own inline SVG + text + CTA button for empty states.
//
// Usage:
//   <EmptyState
//     icon={<ClipboardIcon />}
//     title="Aucune tâche"
//     description="Créez votre première tâche pour commencer."
//     action={{ label: '+ Créer une tâche', onClick: () => navigate('/create-task') }}
//   />

interface EmptyStateProps {
  /** SVG icon or emoji to display */
  icon?: React.ReactNode;
  /** Main title text */
  title: string;
  /** Supporting description */
  description?: string;
  /** Optional call-to-action button */
  action?: {
    label: string;
    onClick: () => void;
    className?: string;
  };
  /** Additional className */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="text-surface-300 mb-3 flex justify-center">
          {icon}
        </div>
      )}
      <p className="text-surface-700 font-medium">{title}</p>
      {description && (
        <p className="text-sm text-surface-500 mt-1">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={action.className || 'mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors'}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
