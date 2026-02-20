import React from 'react';

// ─── StatusBadge ───────────────────────────────────────────────────
// Consistent status badge rendering. Replaces inline conditionals
// that map status strings to colors across DashboardPage, TasksPage,
// AdminInvoicesPage, MyTimeLogsPage, etc.
//
// Usage:
//   <StatusBadge status="COMPLETED" />
//   <StatusBadge status="PAID" type="invoice" />

type BadgeType = 'task' | 'invoice' | 'timeLog';

const TASK_COLORS: Record<string, string> = {
  TODO:        'bg-surface-100 text-surface-700',
  IN_PROGRESS: 'bg-primary-100 text-primary-700',
  COMPLETED:   'bg-success-100 text-success-700',
};

const INVOICE_COLORS: Record<string, string> = {
  DRAFT:     'bg-surface-100 text-surface-700',
  SENT:      'bg-blue-100 text-blue-700',
  PAID:      'bg-success-100 text-success-700',
  OVERDUE:   'bg-red-100 text-red-700',
  CANCELLED: 'bg-surface-200 text-surface-500',
};

const TIME_LOG_COLORS: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-success-100 text-success-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const COLOR_MAPS: Record<BadgeType, Record<string, string>> = {
  task: TASK_COLORS,
  invoice: INVOICE_COLORS,
  timeLog: TIME_LOG_COLORS,
};

interface StatusBadgeProps {
  status: string;
  type?: BadgeType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'task',
  className = '',
}) => {
  const colorMap = COLOR_MAPS[type] || TASK_COLORS;
  const colors = colorMap[status] || 'bg-surface-100 text-surface-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors} ${className}`}>
      {status}
    </span>
  );
};

// ─── StatusDot ─────────────────────────────────────────────────────
// Colored dot for task status (used in list items)

const DOT_COLORS: Record<string, string> = {
  TODO:        'bg-surface-400',
  IN_PROGRESS: 'bg-primary-500',
  COMPLETED:   'bg-success-500',
};

interface StatusDotProps {
  status: string;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, className = '' }) => {
  const color = DOT_COLORS[status] || 'bg-surface-400';
  return <div className={`w-2 h-2 rounded-full ${color} ${className}`} />;
};
