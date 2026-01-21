import axios from 'axios';
import { API_BASE_URL } from './api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/time-logs`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Ajouter le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface TimeLog {
  id: number;
  taskId: number;
  taskTitle: string;
  hoursWorked: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface AdminTimeLogStats {
  statuses: {
    PENDING: { count: number; hours: number };
    APPROVED: { count: number; hours: number };
    REJECTED: { count: number; hours: number };
  };
  hoursByExecutor: Array<{
    executorId: number;
    firstName: string | null;
    lastName: string | null;
    totalHours: number;
  }>;
  pendingByExecutor: Array<{
    executorId: number;
    firstName: string | null;
    lastName: string | null;
    pendingCount: number;
  }>;
  totalApprovedHours: number;
  totalPendingCount: number;
}

/**
 * Soumettre un log de temps pour une tâche
 */
export const submitTimeLog = async (
  taskId: number,
  startTime: Date,
  endTime: Date,
  notes?: string
): Promise<TimeLog> => {
  const response = await api.post('/', {
    taskId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    notes
  });
  return response.data;
};

/**
 * Récupérer tous les logs de l'utilisateur
 */
export const getMyTimeLogs = async (status?: string): Promise<TimeLog[]> => {
  const params = status ? { status } : {};
  const response = await api.get('/', { params });
  return response.data;
};

/**
 * Récupérer un log spécifique
 */
export const getTimeLog = async (id: number): Promise<TimeLog> => {
  const response = await api.get(`/${id}`);
  return response.data;
};

/**
 * Mettre à jour un log de temps
 */
export const updateTimeLog = async (
  id: number,
  startTime?: Date,
  endTime?: Date,
  notes?: string
): Promise<TimeLog> => {
  const response = await api.patch(`/${id}`, {
    startTime: startTime?.toISOString(),
    endTime: endTime?.toISOString(),
    notes
  });
  return response.data;
};

/**
 * Supprimer un log de temps
 */
export const deleteTimeLog = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};

/**
 * Statistiques globales (Admin)
 */
export const getAdminTimeLogStats = async (): Promise<AdminTimeLogStats> => {
  const response = await api.get('/admin/stats');
  return response.data;
};

/**
 * Récupérer les statistiques des heures
 */
export const getTimeLogStats = async (startDate?: Date, endDate?: Date) => {
  const params: any = {};
  if (startDate) params.startDate = startDate.toISOString().split('T')[0];
  if (endDate) params.endDate = endDate.toISOString().split('T')[0];

  const response = await api.get('/stats/executor', { params });
  return response.data;
};

/**
 * Récupérer les logs en attente (Admin)
 */
export const getPendingTimeLogs = async (): Promise<TimeLog[]> => {
  const response = await api.get('/admin/pending');
  return response.data;
};

/**
 * Approuver un log (Admin)
 */
export const approveTimeLog = async (id: number): Promise<void> => {
  await api.patch(`/${id}/approve`);
};

/**
 * Rejeter un log (Admin)
 */
export const rejectTimeLog = async (id: number, reason?: string): Promise<void> => {
  await api.patch(`/${id}/reject`, { reason });
};
