// ─── Format Utilities ──────────────────────────────────────────────
// Shared formatting functions extracted from inline definitions
// previously duplicated in AdminInvoicesPage, AdminStatsPage, BudgetPage, etc.

/**
 * Format a number as currency (EUR by default)
 *
 * @example formatCurrency(1234.5)  → "1 234,50 €"
 * @example formatCurrency(1234.5, 'USD')  → "$1,234.50"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string to a localized date
 *
 * @example formatDate('2026-01-15')  → "15 janv. 2026"
 * @example formatDate('2026-01-15', 'long')  → "15 janvier 2026"
 */
export function formatDate(
  dateStr: string | undefined | null,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale: string = 'fr-FR'
): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';

    const options: Intl.DateTimeFormatOptions = (() => {
      switch (style) {
        case 'short':
          return { day: '2-digit', month: '2-digit', year: 'numeric' };
        case 'medium':
          return { day: 'numeric', month: 'short', year: 'numeric' };
        case 'long':
          return { day: 'numeric', month: 'long', year: 'numeric' };
        case 'full':
          return { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      }
    })();

    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format duration in seconds to human-readable string
 *
 * @example formatDuration(3661)  → "1h 01m 01s"
 * @example formatDuration(90)    → "1m 30s"
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

/**
 * Format hours (decimal) to h/min display
 *
 * @example formatHours(1.5)  → "1h 30min"
 * @example formatHours(0.25) → "15min"
 */
export function formatHours(hours: number): string {
  if (hours <= 0) return '0min';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

/**
 * Format a percentage value
 *
 * @example formatPercent(85.7)  → "85,7%"
 * @example formatPercent(null)  → "—"
 */
export function formatPercent(
  value: number | null | undefined,
  locale: string = 'fr-FR'
): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Get user initials from first/last name
 *
 * @example getUserInitials({ firstName: 'John', lastName: 'Doe' })  → "JD"
 * @example getUserInitials({ firstName: 'John' })                    → "JO"
 * @example getUserInitials({})                                        → "??"
 */
export function getUserInitials(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
}): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName.substring(0, 2).toUpperCase();
  }
  return '??';
}

/**
 * Get formatted display name
 *
 * @example getUserDisplayName({ firstName: 'John', lastName: 'Doe' }) → "John Doe"
 * @example getUserDisplayName({}, 'Utilisateur')                       → "Utilisateur"
 */
export function getUserDisplayName(
  user: { firstName?: string | null; lastName?: string | null },
  fallback: string = 'Utilisateur'
): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  return fallback;
}
