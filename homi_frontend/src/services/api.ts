import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ApiError, ApiResponse } from '../types';

// API Configuration
// En dev local: essaie http://127.0.0.1:8000, http://localhost:8000, puis HTTPS
// En prod: utilise le backend déployé
const getApiBaseUrl = async (): Promise<string> => {
  const backendUrls = [
    'http://127.0.0.1:8000/api',  // Symfony par défaut
    'http://localhost:8000/api',   // Alternative localhost
    'https://localhost:8000/api',  // HTTPS localhost
  ];
  // const fallbackUrl = 'https://homi-backend-ybjp.onrender.com/api';

  // Si VITE_API_BASE_URL est défini, l'utiliser
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL as string;
  }

  // En production, utiliser le fallback (décommentez si nécessaire)
  // if (import.meta.env.PROD) {
  //   return fallbackUrl;
  // }

  // En développement, essayer les URLs locales
  for (const url of backendUrls) {
    try {
      const response = await axios.get(`${url}/health`, { 
        timeout: 1500,
        validateStatus: () => true // Accepter tous les statuts pour ce test
      });
      if (response.status < 500) {
        console.log(`✅ Backend local trouvé: ${url}`);
        return url;
      }
    } catch (error) {
      // Continue vers la prochaine URL
      continue;
    }
  }

  console.error(`❌ ERREUR: Aucun backend local disponible!`);
  console.error(`Assurez-vous que Symfony démarre sur l'une de ces adresses:`);
  console.error(`  - http://127.0.0.1:8000`);
  console.error(`  - http://localhost:8000`);
  console.error(`Commande: symfony server start (depuis homi_backend/)`);
  
  // Retourner la première URL locale (pour que les erreurs soient claires)
  return backendUrls[0];
};

export let API_BASE_URL = 'http://127.0.0.1:8000/api'; // Default pour dev

// Initialiser l'URL au démarrage
getApiBaseUrl().then((url) => {
  API_BASE_URL = url;
  // Réinitialiser axios avec la bonne URL
  apiClient.defaults.baseURL = API_BASE_URL;
  console.log('🔧 API Configuration finalisée:', {
    isProd: import.meta.env.PROD,
    url: API_BASE_URL
  });
}).catch(() => {
  API_BASE_URL = 'http://127.0.0.1:8000/api';
  apiClient.defaults.baseURL = API_BASE_URL;
  console.error('❌ Impossible de configurer l\'URL API');
});

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
