// ─── Central Type Barrel ───────────────────────────────────────────
// Re-exports all domain types from their dedicated files.
// Import from here for convenience, or from individual files for clarity.
//
// Domain files:
//   auth.ts          — User, UserRole, LoginCredentials, AuthResponse
//   task.ts          — Task, TaskStatus, TaskStats, CreateTaskForm, UpdateTaskForm
//   domicile.ts      — Domicile, CreateDomicileForm
//   invoice.ts       — Invoice, InvoiceStatus, InvoiceStats, CreateInvoiceForm
//   timeTracking.ts  — TimeLog, TimeLogStatus, AdminTimeLogStats, PersistedTimer
//   budget.ts        — BudgetOverview, DomicileBudget, TodayCost, MonthlyBudgetData
//   performance.ts   — PerformanceData
//   recurringTask.ts — RecurringTaskTemplate, CreateRecurringTaskForm
//   smartEstimate.ts — SmartEstimateResult, OverrunCheck
//   taskReview.ts    — TaskReviewData, ExecutorReviewStats
//   api.ts           — ApiResponse, ApiError

export * from './auth';
export * from './task';
export * from './domicile';
export * from './invoice';
export * from './timeTracking';
export * from './budget';
export * from './performance';
export * from './recurringTask';
export * from './smartEstimate';
export * from './taskReview';
export * from './api';
