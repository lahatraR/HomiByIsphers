import axios from 'axios';
import { API_BASE_URL } from './api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/invoices`,
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

export interface Invoice {
  id: number;
  invoiceNumber: string;
  domicile: {
    id: number;
    name: string;
  };
  executor: {
    id: number;
    firstName: string;
    lastName: string;
  };
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  hourlyRate: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueAmount: number;
}

/**
 * Récupérer toutes les factures (Admin) ou ses propres factures (User)
 */
export const getInvoices = async (status?: string): Promise<Invoice[]> => {
  const params = status ? { status } : {};
  const response = await api.get('/', { params });
  return response.data;
};

/**
 * Récupérer une facture spécifique
 */
export const getInvoice = async (id: number): Promise<Invoice> => {
  const response = await api.get(`/${id}`);
  return response.data;
};

/**
 * Créer une nouvelle facture (Admin only)
 */
export const createInvoice = async (data: {
  domicileId: number;
  executorId: number;
  periodStart: string;
  periodEnd: string;
  hourlyRate?: number;
  taxRate?: number;
  notes?: string;
}): Promise<Invoice> => {
  const response = await api.post('/', data);
  return response.data;
};

/**
 * Mettre à jour une facture (Admin only)
 */
export const updateInvoice = async (
  id: number,
  data: Partial<{
    status: string;
    notes: string;
    dueDate: string;
    paidDate: string;
  }>
): Promise<Invoice> => {
  const response = await api.patch(`/${id}`, data);
  return response.data;
};

/**
 * Supprimer une facture (Admin only)
 */
export const deleteInvoice = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};

/**
 * Marquer une facture comme payée (Admin only)
 */
export const markInvoiceAsPaid = async (id: number): Promise<Invoice> => {
  return updateInvoice(id, {
    status: 'PAID',
    paidDate: new Date().toISOString()
  });
};

/**
 * Récupérer les statistiques globales (Admin only)
 */
export const getInvoiceStats = async (): Promise<InvoiceStats> => {
  const response = await api.get('/stats/totals');
  return response.data;
};
