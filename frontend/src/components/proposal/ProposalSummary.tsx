/**
 * Proposal Summary Component
 * Displays calculated totals with tax
 */

import { useProposalStore } from '@/store/useProposalStore';
import { formatCurrency } from '@/lib/utils';

export function ProposalSummary() {
  const subtotal = useProposalStore((state) => state.subtotal);
  const taxAmount = useProposalStore((state) => state.taxAmount);
  const total = useProposalStore((state) => state.total);
  const client = useProposalStore((state) => state.client);
  const notes = useProposalStore((state) => state.notes);
  const termsConditions = useProposalStore((state) => state.termsConditions);
  const setNotes = useProposalStore((state) => state.setNotes);
  const setTermsConditions = useProposalStore(
    (state) => state.setTermsConditions
  );

  return (
    <div className="card p-6 shadow-sm sticky top-6">
      <h3 className="text-section-header text-slate-900 mb-5 font-semibold">
        Proposal Summary
      </h3>

      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
          <span className="text-sm text-slate-600 font-medium">Subtotal</span>
          <span className="text-sm font-semibold text-slate-900 tabular-nums">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Tax Rate - Fixed at 18% */}
        <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">
              GST {client?.taxExempt && <span className="text-success-600">(Tax Exempt)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 tabular-nums">18%</span>
          </div>
        </div>

        {/* Tax Amount */}
        <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
          <span className="text-sm text-slate-600 font-medium">Tax Amount</span>
          <span className="text-sm font-semibold text-slate-900 tabular-nums">
            {formatCurrency(taxAmount)}
          </span>
        </div>

        {/* Total - Enhanced */}
        <div className="flex justify-between items-center py-4 bg-primary-50 -mx-6 px-6 rounded-lg mt-4 border border-primary-100">
          <span className="text-lg font-semibold text-slate-900">Total</span>
          <span className="text-2xl font-bold text-primary-600 tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      {/* Payment & Terms - editable and included in PDF */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
            Payment & Terms (shown in PDF)
          </label>
          <textarea
            className="input min-h-[80px]"
            value={termsConditions}
            onChange={(e) => setTermsConditions(e.target.value)}
            placeholder="Enter payment terms, validity, and other commercial conditions that should appear on the proposal PDF. Use numbers for terms and bullets for technical points."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
            Additional Notes (optional, shown in PDF)
          </label>
          <textarea
            className="input min-h-[60px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra notes for the client..."
          />
        </div>
        <div className="mt-2 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 leading-relaxed">
            All prices are in{' '}
            <span className="font-semibold">
              {client?.defaultCurrency || 'INR'}
            </span>
            . Default payment terms:{' '}
            <span className="font-semibold">
              {client?.paymentTerms || 'Net 30'}
            </span>
            . You can override or extend these in the fields above.
          </p>
        </div>
      </div>
    </div>
  );
}
