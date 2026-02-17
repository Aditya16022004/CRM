/**
 * Client Details Dialog
 * Read-only view of client information, opened from the "i" icon.
 */

// import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import type { Client } from '@/types';

interface ClientDetailsDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailsDialog({
  client,
  open,
  onOpenChange,
}: ClientDetailsDialogProps) {
  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary-900">
            {client.companyName}
          </DialogTitle>
          <DialogDescription>
            Client details and contact information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Billing Address</p>
              <p className="text-sm font-medium text-slate-900 whitespace-pre-line">
                {client.billingAddress}
              </p>
            </div>
            {client.shippingAddress && (
              <div>
                <p className="text-sm text-slate-500">Shipping Address</p>
                <p className="text-sm font-medium text-slate-900 whitespace-pre-line">
                  {client.shippingAddress}
                </p>
              </div>
            )}
          </div>

          {(client.contactName ||
            client.contactEmail ||
            client.contactPhone) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {client.contactName && (
                <div>
                  <p className="text-sm text-slate-500">Contact Person</p>
                  <p className="text-sm font-medium text-slate-900">
                    {client.contactName}
                  </p>
                </div>
              )}
              {client.contactEmail && (
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-900">
                    {client.contactEmail}
                  </p>
                </div>
              )}
              {client.contactPhone && (
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-900">
                    {client.contactPhone}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {client.taxId && (
              <div>
                <p className="text-sm text-slate-500">Tax ID / GST</p>
                <p className="text-sm font-medium text-slate-900">
                  {client.taxId}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Default Currency</p>
              <p className="text-sm font-medium text-slate-900">
                {client.defaultCurrency || 'INR'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Payment Terms</p>
              <p className="text-sm font-medium text-slate-900">
                {client.paymentTerms || 'Net 30'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

