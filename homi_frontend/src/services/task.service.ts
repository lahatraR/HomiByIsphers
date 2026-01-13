import { api } from './api';
import type { Task, CreateTaskForm, UpdateTaskForm, TaskStats } from '../types';

interface PaginatedTasksResponse {
  tasks: Task[];
  page: number;
  limit: number;
}

export const taskService = {
  /**
   * Get all tasks
   */
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<PaginatedTasksResponse>('/tasks');
    return response.data.tasks;
  },

  /**
   * Get task by ID
   */
  getTaskById: async (id: string): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  /**
   * Create new task
   */
  createTask: async (taskData: CreateTaskForm): Promise<Task> => {
    // If there are attachments, use FormData
    if (taskData.attachments && taskData.attachments.length > 0) {
      const formData = new FormData();
      formData.append('title', taskData.title);
      formData.append('description', taskData.description);
      formData.append('priority', taskData.priority);
      formData.append('dueDate', taskData.dueDate);

      if (taskData.dueTime) {
        formData.append('dueTime', taskData.dueTime);
      }

      formData.append('recurring', String(taskData.recurring));

      if (taskData.executorId) {
        formData.append('executorId', taskData.executorId);
      }

      taskData.attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });

      const response = await api.upload<Task>('/tasks', formData);
      return response.data;
    }

    // Otherwise, send JSON
    const response = await api.post<Task>('/tasks', taskData);
    return response.data;
  },

  /**
   * Update task
   */
  updateTask: async (id: string, taskData: UpdateTaskForm): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}`, taskData);
    return response.data;
  },

  /**
   * Delete task
   */
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  /**
   * Get task statistics
   */
  getTaskStats: async (): Promise<TaskStats> => {
    const response = await api.get<TaskStats>('/tasks/stats');
    return response.data;
  },

  /**
   * Start task timer
   */
  startTaskTimer: async (id: string): Promise<Task> => {
    const response = await api.post<Task>(`/tasks/${id}/start`);
    return response.data;
  },

  /**
   * Stop task timer
   */
  stopTaskTimer: async (id: string): Promise<Task> => {
    const response = await api.post<Task>(`/tasks/${id}/stop`);
    return response.data;
  },

  /**
   * Get my tasks (as executor)
   */
  getMyTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks/my-tasks');
    return response.data;
  },
};
