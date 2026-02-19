import { api } from './api';
import type { BudgetOverview, TodayCost, MonthlyBudgetData } from '../types/budget';

// Re-export for backward compatibility
export type { BudgetOverview, TodayCost, MonthlyBudgetData };

export const budgetService = {
  getOverview: async (year?: number, month?: number): Promise<BudgetOverview> => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    const res = await api.get<BudgetOverview>(`/budgets/overview?${params}`);
    return res.data;
  },

  getToday: async (): Promise<TodayCost> => {
    const res = await api.get<TodayCost>('/budgets/today');
    return res.data;
  },

  setBudget: async (data: {
    domicileId: number;
    year: number;
    month: number;
    budgetAmount: number;
  }): Promise<MonthlyBudgetData> => {
    const res = await api.post<MonthlyBudgetData>('/budgets', data);
    return res.data;
  },

  getAll: async (): Promise<MonthlyBudgetData[]> => {
    const res = await api.get<MonthlyBudgetData[]>('/budgets');
    return res.data;
  },
};
