// ─── Invoice Types ─────────────────────────────────────────────────
// Single source of truth. Reconciled from types/index.ts + invoice.service.ts

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  domicile: { id: number; name: string };
  executor: { id: number; firstName: string; lastName: string };
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  hourlyRate: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
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

export interface CreateInvoiceForm {
  domicileId: number;
  executorId: number;
  periodStart: string;
  periodEnd: string;
  hourlyRate?: number;
  taxRate?: number;
  notes?: string;
}
