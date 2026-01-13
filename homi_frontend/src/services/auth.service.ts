import { api } from './api';
import type { LoginCredentials, AuthResponse, User } from '../types';

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    // Store token and user in localStorage
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Logout user
   */
  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/refresh');
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },
};
