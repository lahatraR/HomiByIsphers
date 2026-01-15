import { api } from './api';

export interface Domicile {
    id: number;
    name: string;
    address: string;
    city?: string;
    postalCode?: string;
    description?: string;
}

export interface User {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
    domicile: Domicile;
    assignedTo: User;
    createdBy: User;
    startTime?: string;
    endTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskStats {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
}

export const taskService = {
    /**
     * Récupérer toutes les tâches
     */
    getAllTasks: async (): Promise<Task[]> => {
      
        const response = await api.get<Task[]>('/tasks/');
        return response.data;
    },

    /**
     * Récupérer une tâche par ID
     */
    getTaskById: async (id: number): Promise<Task> => {
     
        const response = await api.get<Task>(`/tasks/${id}/`);
        return response.data;
    },

    /**
     * Créer une nouvelle tâche
     */
    createTask: async (data: any): Promise<Task> => {
        const response = await api.post<Task>('/tasks/', data);
        return response.data;
    },

    /**
     * Mettre à jour une tâche
     */
    updateTask: async (id: number, data: any): Promise<Task> => {
        const response = await api.put<Task>(`/tasks/${id}/`, data);
        return response.data;
    },

    /**
     * Démarrer une tâche (actualStartTime)
     */
    startTask: async (id: number): Promise<Task> => {
        const response = await api.patch<Task>(`/tasks/${id}/start`, {});
        return response.data;
    },

    /**
     * Terminer une tâche (actualEndTime)
     */
    completeTask: async (id: number): Promise<Task> => {
        const response = await api.patch<Task>(`/tasks/${id}/complete/`, {});
        return response.data;
    },

    /**
     * Obtenir les statistiques
     */
    getStats: async (): Promise<TaskStats> => {
     
        const response = await api.get<TaskStats>('/tasks/stats/');
        return response.data;
    },

    /**
     * Supprimer une tâche
     */
    deleteTask: async (id: number): Promise<void> => {
        await api.delete(`/tasks/${id}/`);
    },
};
