import { create } from 'zustand';
import { taskService, type Task, type TaskStats } from '../services/task.service';

/** Compute stats from the tasks array — no backend endpoint needed */
function computeStats(tasks: Task[]): TaskStats {
    return {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        pendingTasks: tasks.filter(t => t.status === 'TODO').length,
    };
}

interface TaskState {
    tasks: Task[];
    stats: TaskStats | null;
    isLoading: boolean;
    error: string | null;
    fetchTasks: () => Promise<void>;
    createTask: (data: any) => Promise<Task>;
    startTask: (id: number) => Promise<Task>;
    completeTask: (id: number) => Promise<Task>;
    cancelTask: (id: number) => Promise<Task>;
    updateTask: (id: number, data: any) => Promise<Task>;
    deleteTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
    tasks: [],
    stats: null,
    isLoading: false,
    error: null,

    fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
            const tasks = await taskService.getAllTasks();
            set({ tasks, stats: computeStats(tasks), isLoading: false });
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to fetch tasks';
            set({ error: errorMsg, isLoading: false });
        }
    },

    createTask: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
            const newTask = await taskService.createTask(data);
            set(state => {
                const tasks = [...state.tasks, newTask];
                return { tasks, stats: computeStats(tasks), isLoading: false };
            });
            return newTask;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to create task';
            set({ error: errorMsg, isLoading: false });
            throw error;
        }
    },

    startTask: async (id: number) => {
        try {
            const updatedTask = await taskService.startTask(id);
            set(state => {
                const tasks = state.tasks.map(t => t.id === id ? updatedTask : t);
                return { tasks, stats: computeStats(tasks) };
            });
            return updatedTask;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to start task';
            set({ error: errorMsg });
            throw error;
        }
    },

    completeTask: async (id: number) => {
        try {
            const updatedTask = await taskService.completeTask(id);
            set(state => {
                const tasks = state.tasks.map(t => t.id === id ? updatedTask : t);
                return { tasks, stats: computeStats(tasks) };
            });
            return updatedTask;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to complete task';
            set({ error: errorMsg });
            throw error;
        }
    },

    cancelTask: async (id: number) => {
        try {
            const updatedTask = await taskService.cancelTask(id);
            set(state => {
                const tasks = state.tasks.map(t => t.id === id ? updatedTask : t);
                return { tasks, stats: computeStats(tasks) };
            });
            return updatedTask;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to cancel task';
            set({ error: errorMsg });
            throw error;
        }
    },

    updateTask: async (id: number, data: any) => {
        try {
            const updatedTask = await taskService.updateTask(id, data);
            set(state => {
                const tasks = state.tasks.map(t => t.id === id ? updatedTask : t);
                return { tasks, stats: computeStats(tasks) };
            });
            return updatedTask;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to update task';
            set({ error: errorMsg });
            throw error;
        }
    },

    deleteTask: async (id: number) => {
        try {
            await taskService.deleteTask(id);
            set(state => {
                const tasks = state.tasks.filter(t => t.id !== id);
                return { tasks, stats: computeStats(tasks) };
            });
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to delete task';
            set({ error: errorMsg });
            throw error;
        }
    },
}));
