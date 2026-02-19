import { api } from './api';
import type { PerformanceData } from '../types/performance';

// Re-export for backward compatibility
export type { PerformanceData };

export const performanceService = {
  getDashboard: async (executorId?: number): Promise<PerformanceData> => {
    const query = executorId ? `?executorId=${executorId}` : '';
    const res = await api.get<PerformanceData>(`/performance${query}`);
    return res.data;
  },
};
