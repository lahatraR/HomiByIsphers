// ─── API Types ─────────────────────────────────────────────────────
// Shared types for the API layer (axios client, error handling)

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}
