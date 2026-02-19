import React from 'react';
import { Card } from '../common';

// ─── StatsCard ─────────────────────────────────────────────────────
// Reusable stats card used in Dashboard, Admin pages, Performance, Budget.
// Previously: 4 nearly identical blocks of JSX copy-pasted in each page.
//
// Usage:
//   <StatsCard
//     label="Total Tasks"
//     value={42}
//     icon={<CheckCircleIcon />}
//     gradient="from-primary-500 to-primary-700"
//     subtitle="Across all domiciles"
//   />

interface StatsCardProps {
  /** Card label text */
  label: string;
  /** Main big number or string */
  value: string | number;
  /** Optional icon (rendered top-right) */
  icon?: React.ReactNode;
  /** Tailwind gradient classes, e.g. "from-primary-500 to-primary-700" */
  gradient?: string;
  /** Small text below the value */
  subtitle?: string;
  /** Additional className */
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  gradient = 'from-primary-500 to-primary-700',
  subtitle,
  className = '',
}) => {
  return (
    <Card className={`p-6 bg-gradient-to-br ${gradient} text-white ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium opacity-90">{label}</span>
        {icon && (
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
    </Card>
  );
};

// ─── StatsGrid ─────────────────────────────────────────────────────
// Grid wrapper for StatsCard items.
//
// Usage:
//   <StatsGrid columns={4}>
//     <StatsCard ... />
//     <StatsCard ... />
//   </StatsGrid>

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`grid ${GRID_COLS[columns]} gap-6 ${className}`}>
      {children}
    </div>
  );
};
