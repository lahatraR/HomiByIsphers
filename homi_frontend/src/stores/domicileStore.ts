import { create } from 'zustand';
import { domicileService, type Domicile } from '../services/domicile.service';

interface DomicileStore {
    domiciles: Domicile[];
    isLoading: boolean;
    error: string | null;
    fetchDomiciles: () => Promise<void>;
    createDomicile: (data: any) => Promise<Domicile>;
    deleteDomicile: (id: number) => Promise<void>;
}

export const useDomicileStore = create<DomicileStore>((set) => ({
    domiciles: [],
    isLoading: false,
    error: null,

    fetchDomiciles: async () => {
        set({ isLoading: true, error: null });
        try {
            const domiciles = await domicileService.getAllDomiciles();
            set({ domiciles, isLoading: false });
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to fetch domiciles';
            set({ error: errorMsg, isLoading: false });
        }
    },

    createDomicile: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
            const newDomicile = await domicileService.createDomicile(data);
            set(state => ({
                domiciles: [...state.domiciles, newDomicile],
                isLoading: false,
            }));
            return newDomicile;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to create domicile';
            set({ error: errorMsg, isLoading: false });
            throw error;
        }
    },

    deleteDomicile: async (id: number) => {
        try {
            await domicileService.deleteDomicile(id);
            set(state => ({
                domiciles: state.domiciles.filter(d => d.id !== id),
            }));
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to delete domicile';
            set({ error: errorMsg });
            throw error;
        }
    },
}));