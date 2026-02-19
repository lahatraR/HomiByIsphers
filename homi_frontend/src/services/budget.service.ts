import { api } from './api';

export interface BudgetOverview {
  year: number;
  month: number;
  totalBudget: number;
  totalSpent: number;
  totalProjected: number;
  percentUsed: number | null;
  domiciles: DomicileBudget[];
}

export interface DomicileBudget {
  domicileId: number;
  domicileName: string;
  budget: number | null;
  spent: number;
  hoursWorked: number;
  projected: number;
  percentUsed: number | null;
  status: 'ok' | 'warning' | 'over';
}

export interface TodayCost {
  todayCost: number;
  todayHours: number;
  tasksCount: number;
}

export interface MonthlyBudgetData {
  id: number;
  domicileId: number;
  domicileName: string;
  year: number;
  month: number;
  budgetAmount: number;
}

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
