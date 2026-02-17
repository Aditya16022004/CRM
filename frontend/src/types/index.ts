// Type definitions for the IT Proposal Management System

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER' | 'SUPERADMIN';
  isActive: boolean;
}

export interface Client {
  id: string;
  companyName: string;
  billingAddress: string;
  shippingAddress?: string;
  taxId?: string;
  taxExempt: boolean;
  defaultCurrency: string;
  paymentTerms: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  make: string;
  model: string;
  category: string;
  unitCost: number;
  unitPrice: number;
  specifications: Record<string, any>; // JSONB
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalItem {
  id: string;
  proposalId: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  snapshotName: string;
  snapshotMake: string;
  snapshotModel: string;
  snapshotPrice: number;
  snapshotSpecs?: Record<string, any>;
  quantity: number;
  discount: number;
  lineTotal: number;
}

export type ProposalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SENT' | 'ACCEPTED' | 'REJECTED';

export interface Proposal {
  id: string;
  proposalNumber: string;
  proposalTitle?: string;
  clientId: string;
  client?: Client;
  userId?: string;
  user?: User;
  createdBy?: string;
  status: ProposalStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  termsConditions?: string;
  version: number;
  parentId?: string;
  isPreviewed: boolean;
  items: ProposalItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Bundle {
  id: string;
  name: string;
  description?: string;
  totalPrice: number;
  isActive: boolean;
  items: BundleItem[];
}

export interface BundleItem {
  id: string;
  bundleId: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  quantity: number;
}

export interface AuditLog {
  id: string;
  entity: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: string;
  user?: User;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Frontend-specific types for the Proposal Builder
export interface ProposalLineItem {
  id: string; // Temporary ID for UI
  inventoryItemId?: string;
  name: string;
  make: string;
  model: string;
  price: number;
  specifications?: Record<string, any>;
  quantity: number;
  discount: number;
  lineTotal: number;
}

export interface ProposalBuilderState {
  clientId: string | null;
  client: Client | null;
  items: ProposalLineItem[];
  taxRate: number;
  proposalTitle: string;
  notes: string;
  termsConditions: string;
  validUntil: Date | null;
  status: 'draft' | 'previewing' | 'ready_to_download';
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
