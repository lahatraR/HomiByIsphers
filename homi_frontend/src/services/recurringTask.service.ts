import { api } from './api';
import type { RecurringTaskTemplate, CreateRecurringTaskForm } from '../types/recurringTask';

// Re-export for backward compatibility
export type { RecurringTaskTemplate, CreateRecurringTaskForm };

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
