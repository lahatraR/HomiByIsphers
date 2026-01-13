// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export type UserRole = 'ROLE_OWNER' | 'ROLE_USER' | 'ROLE_EXECUTOR';

export const UserRoles = {
  OWNER: 'ROLE_OWNER' as const,
  USER: 'ROLE_USER' as const,
  EXECUTOR: 'ROLE_EXECUTOR' as const,
};

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  dueTime?: string;
  recurring: boolean;
  attachments?: Attachment[];
  assignedTo?: User;
  createdBy: User;
  executorId?: string;
  workedTime?: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export const TaskPriorities = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  URGENT: 'urgent' as const,
};

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export const TaskStatuses = {
  TODO: 'todo' as const,
  IN_PROGRESS: 'in_progress' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const,
};

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Statistics types
export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  todayWorkedTime: number;
  weeklyWorkedTime: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
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
  priority: TaskPriority;
  dueDate: string;
  dueTime?: string;
  recurring: boolean;
  executorId?: string;
  attachments?: File[];
}

export interface UpdateTaskForm extends Partial<CreateTaskForm> {
  status?: TaskStatus;
}
