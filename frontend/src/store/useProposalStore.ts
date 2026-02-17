/**
 * Zustand Store for Proposal Builder
 * 
 * This store manages the state machine for the CPQ engine:
 * Draft -> Configure -> Preview -> Commit
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Client, ProposalLineItem } from '@/types';
import {
  calculateLineTotal,
  calculateProposalTotals,
  generateId,
  validateProposal,
} from '@/lib/utils';
import { DEFAULT_TERMS_CONDITIONS } from '@/constants/proposalDefaults';

interface ProposalState {
  // Client information
  clientId: string | null;
  client: Client | null;

  // Line items
  items: ProposalLineItem[];

  // Financial settings
  taxRate: number;

  // Metadata
  proposalTitle: string;
  createdBy: string;
  notes: string;
  termsConditions: string;
  validUntil: Date | null;

  // State machine status
  status: 'draft' | 'previewing' | 'ready_to_download';

  // PDF blob for download
  pdfBlob: Blob | null;

  // Computed values
  subtotal: number;
  taxAmount: number;
  total: number;
}

interface ProposalActions {
  // Client actions
  setClient: (client: Client | null) => void;

  // Item actions
  addItem: (item: Omit<ProposalLineItem, 'id' | 'lineTotal'>) => void;
  updateItem: (id: string, updates: Partial<ProposalLineItem>) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;

  // Financial actions
  setTaxRate: (rate: number) => void;

  // Metadata actions
  setProposalTitle: (title: string) => void;
  setCreatedBy: (name: string) => void;
  setNotes: (notes: string) => void;
  setTermsConditions: (terms: string) => void;
  setValidUntil: (date: Date | null) => void;

  // State machine actions
  startPreview: () => void;
  finishPreview: (blob: Blob) => void;
  cancelPreview: () => void;
  resetToDraft: () => void;

  // Utility actions
  recalculate: () => void;
  validate: () => { valid: boolean; errors: string[] };
  reset: () => void;
}

type ProposalStore = ProposalState & ProposalActions;

const initialState: ProposalState = {
  clientId: null,
  client: null,
  items: [],
  taxRate: 18,
  proposalTitle: '',
  createdBy: '',
  notes: '',
  termsConditions: DEFAULT_TERMS_CONDITIONS,
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  status: 'draft',
  pdfBlob: null,
  subtotal: 0,
  taxAmount: 0,
  total: 0,
};

export const useProposalStore = create<ProposalStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Client actions
      setClient: (client) => {
        set({
          clientId: client?.id ?? null,
          client,
          taxRate: client?.taxExempt ? 0 : get().taxRate,
        });
        get().recalculate();
      },

      // Item actions
      addItem: (itemData) => {
        const id = generateId();
        const lineTotal = calculateLineTotal(
          itemData.price,
          itemData.quantity,
          itemData.discount
        );

        const newItem: ProposalLineItem = {
          ...itemData,
          id,
          lineTotal,
        };

        set((state) => ({
          items: [...state.items, newItem],
        }));

        get().recalculate();
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;

            const updated = { ...item, ...updates };
            // Recalculate line total if price, quantity, or discount changed
            if (
              'price' in updates ||
              'quantity' in updates ||
              'discount' in updates
            ) {
              updated.lineTotal = calculateLineTotal(
                updated.price,
                updated.quantity,
                updated.discount
              );
            }
            return updated;
          }),
        }));

        get().recalculate();
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
        get().recalculate();
      },

      clearItems: () => {
        set({ items: [] });
        get().recalculate();
      },

      // Financial actions
      setTaxRate: (rate) => {
        set({ taxRate: Math.max(0, Math.min(100, rate)) });
        get().recalculate();
      },

      // Metadata actions
      setProposalTitle: (title) => set({ proposalTitle: title }),
      setCreatedBy: (name) => set({ createdBy: name }),
      setNotes: (notes) => set({ notes }),
      setTermsConditions: (terms) => set({ termsConditions: terms }),
      setValidUntil: (date) => set({ validUntil: date }),

      // State machine actions
      startPreview: () => {
        const validation = get().validate();
        if (!validation.valid) {
          console.error('Validation failed:', validation.errors);
          return;
        }
        set({ status: 'previewing' });
      },

      finishPreview: (blob) => {
        set({
          status: 'ready_to_download',
          pdfBlob: blob,
        });
      },

      cancelPreview: () => {
        set({
          status: 'draft',
          pdfBlob: null,
        });
      },

      resetToDraft: () => {
        set({
          status: 'draft',
          pdfBlob: null,
        });
      },

      // Utility actions
      recalculate: () => {
        const state = get();
        const { subtotal, taxAmount, total } = calculateProposalTotals(
          state.items,
          state.taxRate
        );
        set({ subtotal, taxAmount, total });
      },

      validate: () => {
        const state = get();
        return validateProposal({
          clientId: state.clientId,
          items: state.items,
          proposalTitle: state.proposalTitle,
          createdBy: state.createdBy,
        });
      },

      reset: () => {
        // Revoke the blob URL if it exists
        if (get().pdfBlob) {
          URL.revokeObjectURL(URL.createObjectURL(get().pdfBlob!));
        }
        set(initialState);
      },
    }),
    {
      name: 'proposal-store',
    }
  )
);
