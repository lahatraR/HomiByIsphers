// User types
export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

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
  actualStartTime?: string;
  actualEndTime?: string;
  assignedTo?: User;
  createdBy?: User;
  domicile?: {
    id: number;
    name: string;
    address?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Domicile types
export interface Domicile {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  notes?: string;
  createdAt?: string;
  createdBy?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

// Time tracking types
export type TimeLogStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TimeLog {
  id: number;
  taskId: number;
  taskTitle?: string;
  hoursWorked: number;
  status: TimeLogStatus;
  notes?: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

// Invoice types
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  domicile: { id: number; name: string };
  executor: { id: number; firstName: string; lastName: string };
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  hourlyRate: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueAmount: number;
}

// Statistics types
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
  firstName?: string;
  lastName?: string;
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

export interface CreateDomicileForm {
  name: string;
  address: string;
  phone?: string;
  notes?: string;
}

export interface CreateInvoiceForm {
  domicileId: number;
  executorId: number;
  periodStart: string;
  periodEnd: string;
  hourlyRate?: number;
  taxRate?: number;
  notes?: string;
}
