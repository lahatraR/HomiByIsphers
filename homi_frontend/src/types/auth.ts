// ─── Auth & User Types ─────────────────────────────────────────────
// Single source of truth for all authentication and user-related types.

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

export const UserRoles = {
  USER: 'ROLE_USER' as const,
  ADMIN: 'ROLE_ADMIN' as const,
};

export interface User {
  id: number;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt?: string;
}

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
