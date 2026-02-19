import { api } from './api';

export interface TaskReviewData {
  id: number;
  taskId: number;
  taskTitle: string;
  rating: number;
  comment: string | null;
  reviewedBy: { id: number; firstName: string; lastName: string };
  executor: { id: number; firstName: string; lastName: string };
  createdAt: string;
}

export interface ExecutorReviewStats {
  averageRating: number;
  totalReviews: number;
  recentReviews: TaskReviewData[];
}

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
