import { api } from './api';
import type { LoginCredentials, AuthResponse, User, UserRole } from '../types';


// Décoder le payload JWT (base64)
function decodeJwtPayload(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

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
      // Stocker l'expiration du token (en ms)
      const payload = decodeJwtPayload(response.data.token);
      if (payload && payload.exp) {
        localStorage.setItem('authTokenExpiresAt', String(payload.exp * 1000));
      }
    }

    return { auth: response.data, user };
  },

  /**
   * Logout user — call backend then clear local state
   */
  logout: (): void => {
    // Fire-and-forget server-side logout
    try {
      api.post('/auth/logout', {}).catch(() => {});
    } catch {
      // Ignore errors — we're logging out regardless
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authTokenExpiresAt');
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
    const token = localStorage.getItem('authToken');
    const expiresAt = localStorage.getItem('authTokenExpiresAt');
    if (!token || !expiresAt) return false;
    const now = Date.now();
    return now < Number(expiresAt);
  },
  /**
   * Vérifie si le token JWT est expiré
   */
  isTokenExpired: (): boolean => {
    const expiresAt = localStorage.getItem('authTokenExpiresAt');
    if (!expiresAt) return true;
    return Date.now() > Number(expiresAt);
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
