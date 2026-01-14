import { api } from './api';
import type { User } from '../types';

const normalizeUser = (raw: any): User => ({
  id: Number(raw.id),
  email: raw.email,
  role: raw.role,
  firstName: raw.firstName ?? raw.first_name,
  lastName: raw.lastName ?? raw.last_name,
  createdAt: raw.createdAt ?? raw.created_at,
});

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    const payload = Array.isArray((response as any).data)
      ? (response as any).data
      : (response as any).data?.users ?? [];
    return payload.map(normalizeUser);
  },

  getNonAdminUsers: async (): Promise<User[]> => {
    const users = await userService.getAll();
    return users.filter((u) => u.role !== 'ROLE_ADMIN');
  },
};
