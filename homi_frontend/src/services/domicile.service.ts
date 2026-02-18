import { api } from './api';

export interface Domicile {
    id: number;
    name: string;
    address: string;
    city: string;
    postalCode: string;
    description?: string;
    createdAt: string;
    createdBy: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    };
}

export const domicileService = {
    /**
     * Récupérer tous les domiciles
     */
        getAllDomiciles: async (): Promise<Domicile[]> => {
            const response = await api.get<Domicile[]>('/domiciles');
            return response.data;
        },

    /**
     * Récupérer un domicile par ID
     */
        getDomicileById: async (id: number): Promise<Domicile> => {
            const response = await api.get<Domicile>(`/domiciles/${id}`);
            return response.data;
        },

    /**
     * Créer un nouveau domicile
     */
    createDomicile: async (data: {
        name: string;
        address: string;
        city: string;
        postalCode: string;
        description?: string;
    }): Promise<Domicile> => {
        const response = await api.post<Domicile>('/domiciles', data);
        return response.data;
    },

    /**
     * Mettre à jour un domicile
     */
    updateDomicile: async (id: number, data: Partial<Domicile>): Promise<Domicile> => {
        const response = await api.put<Domicile>(`/domiciles/${id}`, data);
        return response.data;
    },

    /**
     * Supprimer un domicile
     */
    deleteDomicile: async (id: number): Promise<void> => {
        await api.delete(`/domiciles/${id}`);
    },
};