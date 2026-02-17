/**
 * Client Form Dialog
 * For adding/editing clients.
 * Fields: name, location, addresses, contact, tax, payment terms.
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Client } from '@/types';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialClient?: Client | null;
  clients?: Client[];
  onSubmit: (values: any, existing?: Client) => Promise<void> | void;
}

type FormState = {
  companyName: string;
  billingAddress: string;
  shippingAddress: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  taxId: string;
  defaultCurrency: string;
  paymentTerms: string;
};

const emptyForm: FormState = {
  companyName: '',
  billingAddress: '',
  shippingAddress: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  taxId: '',
  defaultCurrency: 'INR',
  paymentTerms: 'Net 30',
};

export function ClientFormDialog({
  open,
  onOpenChange,
  initialClient,
  clients = [],
  onSubmit,
}: ClientFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialClient) {
      setForm({
        companyName: initialClient.companyName,
        billingAddress: initialClient.billingAddress,
        shippingAddress: initialClient.shippingAddress || '',
        contactName: initialClient.contactName || '',
        contactEmail: initialClient.contactEmail || '',
        contactPhone: initialClient.contactPhone || '',
        taxId: initialClient.taxId || '',
        defaultCurrency: initialClient.defaultCurrency || 'INR',
        paymentTerms: initialClient.paymentTerms || 'Net 30',
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialClient, open]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompanyNameChange = (value: string) => {
    const match = clients.find(
      (client) => client.companyName.toLowerCase() === value.toLowerCase()
    );

    if (match) {
      setForm({
        companyName: match.companyName,
        billingAddress: match.billingAddress,
        shippingAddress: match.shippingAddress || '',
        contactName: match.contactName || '',
        contactEmail: match.contactEmail || '',
        contactPhone: match.contactPhone || '',
        taxId: match.taxId || '',
        defaultCurrency: match.defaultCurrency || 'INR',
        paymentTerms: match.paymentTerms || 'Net 30',
      });
      return;
    }

    handleChange('companyName', value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.billingAddress.trim()) return;

    const matchedExisting = clients.find(
      (client) =>
        client.companyName.toLowerCase() === form.companyName.trim().toLowerCase()
    );
    const existingForSubmit = initialClient ?? matchedExisting;

    const payload = {
      companyName: form.companyName.trim(),
      billingAddress: form.billingAddress.trim(),
      shippingAddress: form.shippingAddress.trim() || undefined,
      contactName: form.contactName.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      taxId: form.taxId.trim() || undefined,
      defaultCurrency: form.defaultCurrency.trim() || 'INR',
      paymentTerms: form.paymentTerms.trim() || 'Net 30',
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload, existingForSubmit ?? undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = initialClient ? 'Edit Client' : 'Add Client';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Add or update client details and contact information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Client Name
            </label>
            <select
              className="input h-10 bg-slate-50 focus:bg-white transition-colors mb-2"
              value=""
              onChange={(e) => handleCompanyNameChange(e.target.value)}
            >
              <option value="">Select existing client (optional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.companyName}>
                  {client.companyName}
                </option>
              ))}
            </select>
            <Input
              value={form.companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="e.g. Max Super Speciality Hospital, Lucknow"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location / Billing Address
            </label>
            <textarea
              className="input min-h-[70px]"
              value={form.billingAddress}
              onChange={(e) => handleChange('billingAddress', e.target.value)}
              placeholder="Full billing address of the client"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Shipping Address (optional)
            </label>
            <textarea
              className="input min-h-[70px]"
              value={form.shippingAddress}
              onChange={(e) => handleChange('shippingAddress', e.target.value)}
              placeholder="If different from billing address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Person
              </label>
              <Input
                value={form.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                placeholder="Name of primary contact"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Email
              </label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Phone
              </label>
              <Input
                value={form.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                placeholder="+91-XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tax ID / GST (optional)
              </label>
              <Input
                value={form.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                placeholder="Client GST / Tax registration ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Currency
              </label>
              <Input
                value={form.defaultCurrency}
                onChange={(e) =>
                  handleChange('defaultCurrency', e.target.value)
                }
                placeholder="INR"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Terms
              </label>
              <Input
                value={form.paymentTerms}
                onChange={(e) =>
                  handleChange('paymentTerms', e.target.value)
                }
                placeholder="Net 30, 50% advance, etc."
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialClient ? 'Save Changes' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

