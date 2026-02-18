import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authService } from '../services/auth.service';

// Vérification auto de l'expiration du token à chaque chargement
if (authService.isTokenExpired()) {
  authService.logout();
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: User['role'], firstName: string,lastName: string) => Promise<{ message: string; email: string }>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: authService.getCurrentUser(),
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
      error: null,

      setUser: (user) => {
        // Si le token est expiré, forcer la déconnexion
        if (authService.isTokenExpired()) {
          authService.logout();
          set({ user: null, isAuthenticated: false });
        } else {
          set({ user, isAuthenticated: !!user });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authService.login({ email, password });
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error?.message || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      register: async (email, password, role ,firstName,lastName) => {
        set({ isLoading: true, error: null });
        try {
          console.log('📝 Registration attempt:', { email, role, firstName, lastName });
          const response = await authService.register({ email, password, role,firstName,lastName });
          console.log('✅ Registration successful:', response);
          // NE PAS connecter automatiquement - l'utilisateur doit vérifier son email
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          // Retourner le message pour affichage
          return response;
        } catch (error: any) {
          console.error('❌ Registration failed:', {
            message: error.message,
            status: error.status,
            response: error.response,
            fullError: error
          });
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
