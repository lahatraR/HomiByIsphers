// ─── Budget Types ──────────────────────────────────────────────────
// Extracted from budget.service.ts

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
