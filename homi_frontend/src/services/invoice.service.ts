import { api } from './api';

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
  try {
    const url = status ? `/invoices?status=${encodeURIComponent(status)}` : '/invoices';
    const response = await api.get<Invoice[]>(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    throw error;
  }
};

/**
 * Récupérer une facture spécifique
 */
export const getInvoice = async (id: number): Promise<Invoice> => {
  try {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    throw error;
  }
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
  try {
    const response = await api.post<Invoice>('/invoices', data);
    return response.data;
  } catch (error) {
    console.error('Failed to create invoice:', error);
    throw error;
  }
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
  try {
    const response = await api.patch<Invoice>(`/invoices/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Failed to update invoice:', error);
    throw error;
  }
};

/**
 * Supprimer une facture (Admin only)
 */
export const deleteInvoice = async (id: number): Promise<void> => {
  try {
    await api.delete(`/invoices/${id}`);
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    throw error;
  }
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
  try {
    const response = await api.get<InvoiceStats>('/invoices/stats/totals');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch invoice stats:', error);
    throw error;
  }
};
