import { api } from './api';

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

export const recurringTaskService = {
  getAll: async (): Promise<RecurringTaskTemplate[]> => {
    const res = await api.get<RecurringTaskTemplate[]>('/recurring-tasks');
    return res.data;
  },

  create: async (data: CreateRecurringTaskForm): Promise<RecurringTaskTemplate> => {
    const res = await api.post<RecurringTaskTemplate>('/recurring-tasks', data);
    return res.data;
  },

  update: async (id: number, data: Partial<CreateRecurringTaskForm> & { isActive?: boolean }): Promise<RecurringTaskTemplate> => {
    const res = await api.put<RecurringTaskTemplate>(`/recurring-tasks/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/recurring-tasks/${id}`);
  },

  toggle: async (id: number): Promise<RecurringTaskTemplate> => {
    const res = await api.patch<RecurringTaskTemplate>(`/recurring-tasks/${id}/toggle`);
    return res.data;
  },

  generate: async (date?: string): Promise<{ message: string; tasks: string[]; date: string }> => {
    const res = await api.post<{ message: string; tasks: string[]; date: string }>('/recurring-tasks/generate', { date });
    return res.data;
  },
};
