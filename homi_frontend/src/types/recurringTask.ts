// ─── Recurring Task Types ──────────────────────────────────────────
// Extracted from recurringTask.service.ts

export interface RecurringTaskTemplate {
  id: number;
  title: string;
  description: string;
  domicile: { id: number; name: string };
  assignedTo: { id: number; firstName: string; lastName: string; email: string };
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  daysOfWeek: string | null;
  preferredStartTime: string | null;
  estimatedDurationMinutes: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  lastGeneratedAt: string | null;
  createdAt: string;
}

export interface CreateRecurringTaskForm {
  title: string;
  description: string;
  domicileId: number;
  executorId: number;
  frequency: string;
  daysOfWeek?: string;
  preferredStartTime?: string;
  estimatedDurationMinutes?: number;
  startDate: string;
  endDate?: string;
}
