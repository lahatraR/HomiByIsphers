import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ApiError, ApiResponse } from '../types';

// API Configuration
// Prod: utilise directement VITE_API_BASE_URL (pas de détection async)
// Dev: essaie localhost si aucune env fournie
const backendUrls = [
  'http://127.0.0.1:8000/api',  // Symfony par défaut
  'http://localhost:8000/api',   // Alternative localhost
  'https://localhost:8000/api',  // HTTPS localhost
];

const envApiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
export let API_BASE_URL = envApiUrl || backendUrls[0];

// Si pas d'URL définie et en dev, tenter de détecter un backend local
if (!envApiUrl && !import.meta.env.PROD) {
  const detectLocalApi = async () => {
    for (const url of backendUrls) {
      try {
        const response = await axios.get(`${url}/health`, {
          timeout: 1500,
          validateStatus: () => true,
        });
        if (response.status < 500) {
          console.log(`✅ Backend local trouvé: ${url}`);
          return url;
        }
      } catch (_) {
        continue;
      }
    }
    console.error('❌ ERREUR: Aucun backend local disponible!');
    return backendUrls[0];
  };

  detectLocalApi().then((url) => {
    API_BASE_URL = url;
    apiClient.defaults.baseURL = API_BASE_URL;
    console.log('🔧 API Configuration finalisée (auto-détection):', {
      isProd: import.meta.env.PROD,
      url: API_BASE_URL,
    });
  }).catch(() => {
    API_BASE_URL = backendUrls[0];
    apiClient.defaults.baseURL = API_BASE_URL;
    console.error('❌ Impossible de configurer l\'URL API');
  });
} else {
  console.log('🔧 API Configuration finalisée:', {
    isProd: import.meta.env.PROD,
    url: API_BASE_URL,
  });
}

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
    const apiError: ApiError = {
      message: 'An error occurred',
      status: error.response?.status || 500,
    };

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
