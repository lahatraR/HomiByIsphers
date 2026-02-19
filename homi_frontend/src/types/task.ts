// ─── Task Types ────────────────────────────────────────────────────
// Single source of truth for all task-related types.
// Reconciled from types/index.ts + task.service.ts

import type { User } from './auth';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  domicile: {
    id: number;
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    description?: string;
  };
  assignedTo: User;
  createdBy: User;
  startTime?: string;
  endTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
}

export interface CreateTaskForm {
  title: string;
  description: string;
  domicileId: number;
  executorId: number;
  startTime?: string;
  endTime?: string;
}

export interface UpdateTaskForm extends Partial<CreateTaskForm> {
  status?: TaskStatus;
}
