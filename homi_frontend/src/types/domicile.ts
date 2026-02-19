// ─── Domicile Types ────────────────────────────────────────────────
// Single source of truth. Reconciled from types/index.ts + domicile.service.ts

export interface Domicile {
  id: number;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  description?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  createdBy: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateDomicileForm {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  description?: string;
  phone?: string;
  notes?: string;
}
