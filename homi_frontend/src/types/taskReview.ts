// ─── Task Review Types ─────────────────────────────────────────────
// Extracted from taskReview.service.ts

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
