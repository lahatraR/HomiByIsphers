import { api } from './api';
import type { TaskReviewData, ExecutorReviewStats } from '../types/taskReview';

// Re-export for backward compatibility
export type { TaskReviewData, ExecutorReviewStats };

export const taskReviewService = {
  create: async (data: { taskId: number; rating: number; comment?: string }): Promise<TaskReviewData> => {
    const res = await api.post<TaskReviewData>('/reviews', data);
    return res.data;
  },

  getByTask: async (taskId: number): Promise<TaskReviewData | null> => {
    const res = await api.get<TaskReviewData | null>(`/reviews/task/${taskId}`);
    return res.data;
  },

  getExecutorStats: async (executorId: number): Promise<ExecutorReviewStats> => {
    const res = await api.get<ExecutorReviewStats>(`/reviews/executor/${executorId}/stats`);
    return res.data;
  },

  getAll: async (): Promise<TaskReviewData[]> => {
    const res = await api.get<TaskReviewData[]>('/reviews');
    return res.data;
  },
};
