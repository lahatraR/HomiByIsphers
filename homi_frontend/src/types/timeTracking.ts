// ─── Time Tracking Types ───────────────────────────────────────────
// Single source of truth. Reconciled from types/index.ts + timeTracking.service.ts + timerPersistence.service.ts

export type TimeLogStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TimeLog {
  id: number;
  taskId: number;
  taskTitle: string;
  hoursWorked: number;
  status: TimeLogStatus;
  notes?: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface AdminTimeLogStats {
  statuses: {
    PENDING: { count: number; hours: number };
    APPROVED: { count: number; hours: number };
    REJECTED: { count: number; hours: number };
  };
  hoursByExecutor: Array<{
    executorId: number;
    firstName: string | null;
    lastName: string | null;
    totalHours: number;
  }>;
  pendingByExecutor: Array<{
    executorId: number;
    firstName: string | null;
    lastName: string | null;
    pendingCount: number;
  }>;
  totalApprovedHours: number;
  totalPendingCount: number;
}

export interface PersistedTimer {
  userId: number;
  taskId: number;
  startedAt: string;
  accumulatedSeconds: number;
  lastResumedAt: string | null;
  isPaused: boolean;
  isFrozen: boolean;
  savedAt: string;
}
