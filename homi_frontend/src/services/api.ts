import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ApiError, ApiResponse } from '../types';

// ============================================
// Configuration API automatique par environnement
// npm run dev          → .env.development (LOCAL)
// npm run dev:deployed → .env.deployed    (RENDER)
// npm run build        → .env.production  (PROD)
// ============================================
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const ENV_LABEL = import.meta.env.VITE_ENV_LABEL || 'UNKNOWN';

console.log(`🔧 API [${ENV_LABEL}] → ${API_BASE_URL}`);

// Create axios instance with default config
// Note: Timeout increased to 60s for Render free tier cold starts
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for Render cold starts
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    console.error('🔴 API Error intercepted:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    const apiError: ApiError = {
      message: 'An error occurred',
      status: error.response?.status || 500,
    };

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      apiError.message = 'Le serveur met trop de temps à répondre. Veuillez réessayer dans quelques instants.';
      apiError.status = 408; // Request Timeout
    }

    if (error.response?.data) {
      const data = error.response.data as any;
      apiError.message = data.message || data.error || 'An error occurred';
      apiError.errors = data.errors;
    }

    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      // Ne pas rediriger si on est déjà sur une page publique (login/register)
      const currentPath = window.location.pathname;
      const isPublicPage = currentPath.includes('/login') || currentPath.includes('/register');
      
      if (!isPublicPage) {
        // Clear auth and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/HomiByIsphers/login';
      }
    }

    return Promise.reject(apiError);
  }
);

// Generic API methods
export const api = {
  get: async <T>(url: string): Promise<ApiResponse<T>> => {
    const response = await apiClient.get<T>(url);
    return {
      data: response.data,
      status: response.status,
    };
  },

  post: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<T>(url, data);
    return {
      data: response.data,
      status: response.status,
    };
  },

  put: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    const response = await apiClient.put<T>(url, data);
    return {
      data: response.data,
      status: response.status,
    };
  },

  patch: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    const response = await apiClient.patch<T>(url, data);
    return {
      data: response.data,
      status: response.status,
    };
  },

  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    const response = await apiClient.delete<T>(url);
    return {
      data: response.data,
      status: response.status,
    };
  },

  upload: async <T>(url: string, formData: FormData): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      data: response.data,
      status: response.status,
    };
  },
};

export default apiClient;
