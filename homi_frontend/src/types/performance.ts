// ─── Performance Types ─────────────────────────────────────────────
// Extracted from performance.service.ts

export interface PerformanceData {
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completionRate: number;
  };
  speed: {
    avgHoursPerTask: number;
    fastestTask: number;
    slowestTask: number;
    totalHours: number;
  };
  onTimeRate: number;
  rating: {
    averageRating: number;
    totalReviews: number;
  };
  streak: number;
  weeklyActivity: {
    weekStart: string;
    tasksCompleted: number;
    hoursWorked: number;
  }[];
  domicileBreakdown: {
    domicileName: string;
    taskCount: number;
    totalHours: number;
  }[];
}
