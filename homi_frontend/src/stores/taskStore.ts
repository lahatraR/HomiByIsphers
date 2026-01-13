import { create } from 'zustand';
import type { Task, TaskStats } from '../types';
import { taskService } from '../services/task.service';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  stats: TaskStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (taskData: any) => Promise<void>;
  updateTask: (id: string, taskData: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  currentTask: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getTasks();
      set({ tasks, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchTaskById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.getTaskById(id);
      set({ currentTask: task, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createTask: async (taskData: any) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await taskService.createTask(taskData);
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTask: async (id: string, taskData: any) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTask = await taskService.updateTask(id, taskData);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
        currentTask:
          state.currentTask?.id === id ? updatedTask : state.currentTask,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await taskService.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const stats = await taskService.getTaskStats();
      set({ stats });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));
