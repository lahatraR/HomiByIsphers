import { api } from './api';
import type { TimeLog, AdminTimeLogStats } from '../types/timeTracking';

// Re-export for backward compatibility
export type { TimeLog, AdminTimeLogStats };


/**
 * Soumettre un log de temps pour une tâche
 */
export const submitTimeLog = async (
  taskId: number,
  startTime: Date,
  endTime: Date,
  notes?: string
): Promise<TimeLog> => {
  try {
    const response = await api.post<TimeLog>('/time-logs', {
      taskId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Failed to submit time log:', error);
    throw error;
  }
};

/**
 * Récupérer tous les logs de l'utilisateur
 */
export const getMyTimeLogs = async (status?: string): Promise<TimeLog[]> => {
  try {
    const url = status ? `/time-logs?status=${encodeURIComponent(status)}` : '/time-logs';
    const response = await api.get<TimeLog[]>(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch time logs:', error);
    throw error;
  }
};

/**
 * Récupérer un log spécifique
 */
export const getTimeLog = async (id: number): Promise<TimeLog> => {
  try {
    const response = await api.get<TimeLog>(`/time-logs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch time log:', error);
    throw error;
  }
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
  try {
    const response = await api.patch<TimeLog>(`/time-logs/${id}`, {
      startTime: startTime?.toISOString(),
      endTime: endTime?.toISOString(),
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update time log:', error);
    throw error;
  }
};

/**
 * Supprimer un log de temps
 */
export const deleteTimeLog = async (id: number): Promise<void> => {
  try {
    await api.delete(`/time-logs/${id}`);
  } catch (error) {
    console.error('Failed to delete time log:', error);
    throw error;
  }
};

/**
 * Statistiques globales (Admin)
 */
export const getAdminTimeLogStats = async (): Promise<AdminTimeLogStats> => {
  try {
    const response = await api.get<AdminTimeLogStats>('/time-logs/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch admin time log stats:', error);
    throw error;
  }
};

/**
 * Récupérer les statistiques des heures
 */
export const getTimeLogStats = async (startDate?: Date, endDate?: Date) => {
  try {
    let url = '/time-logs/stats/executor';
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate.toISOString().split('T')[0]}`);
    if (endDate) params.push(`endDate=${endDate.toISOString().split('T')[0]}`);
    if (params.length) url += '?' + params.join('&');
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch time log stats:', error);
    throw error;
  }
};

/**
 * Récupérer les logs en attente (Admin)
 */
export const getPendingTimeLogs = async (): Promise<TimeLog[]> => {
  try {
    const response = await api.get<TimeLog[]>('/time-logs/admin/pending');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pending time logs:', error);
    throw error;
  }
};

/**
 * Approuver un log (Admin)
 */
export const approveTimeLog = async (id: number): Promise<void> => {
  try {
    await api.patch(`/time-logs/${id}/approve`, {});
  } catch (error) {
    console.error('Failed to approve time log:', error);
    throw error;
  }
};

/**
 * Rejeter un log (Admin)
 */
export const rejectTimeLog = async (id: number, reason?: string): Promise<void> => {
  try {
    await api.patch(`/time-logs/${id}/reject`, { reason });
  } catch (error) {
    console.error('Failed to reject time log:', error);
    throw error;
  }
};
