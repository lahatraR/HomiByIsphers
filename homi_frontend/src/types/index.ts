// User types
export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_EXECUTOR';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt?: string;
}

export const UserRoles = {
  USER: 'ROLE_USER' as const,
  ADMIN: 'ROLE_ADMIN' as const,
  EXECUTOR: 'ROLE_EXECUTOR' as const,
};

// Task types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
  assignedTo?: User;
  domicile?: {
    id: number;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Statistics types (computed client-side)
export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  userId: number;
  email: string;
  role: UserRole;
}

// API Response types
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

// Form types
export interface CreateTaskForm {
  title: string;
  description: string;
  domicileId: number;
  executorId: number;
  startTime?: string;
  endTime?: string;
}

export interface UpdateTaskForm extends Partial<CreateTaskForm> {
  status?: TaskStatus;
}
