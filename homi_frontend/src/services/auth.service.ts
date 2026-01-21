import { api } from './api';
import type { LoginCredentials, AuthResponse, User, UserRole } from '../types';

const mapAuthToUser = (auth: AuthResponse): User => ({
  id: auth.userId,
  email: auth.email,
  role: auth.role,
});

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<{ auth: AuthResponse; user: User }> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const user = mapAuthToUser(response.data);

    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    return { auth: response.data, user };
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
   * Register user (returns message, NO auto-login anymore)
   */
  register: async (userData: { email: string; password: string; role: UserRole ; firstName: string; lastName: string }): Promise<{ message: string; email: string }> => {
    console.log('🔌 Calling /auth/register with:', {
      ...userData,
      password: '***hidden***'
    });
    
    try {
      const response = await api.post<{ message: string; email: string }>('/auth/register', userData);
      console.log('✅ Register API response:', response.data);
      
      // Ne PAS stocker de token - l'utilisateur doit vérifier son email d'abord
      return response.data;
    } catch (error: any) {
      console.error('❌ Register API error:', {
        status: error.status,
        message: error.message,
        data: error.response?.data,
        fullError: error
      });
      throw error;
    }
  },
};
