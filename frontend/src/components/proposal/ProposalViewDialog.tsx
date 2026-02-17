/**
 * Proposal View Dialog
 * View and download PDF for saved proposals
 */

import { useState, useEffect } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Download, Loader2 } from 'lucide-react';
import { ProposalPDF } from './ProposalPDF';
import { downloadBlob } from '@/lib/utils';
import { toast } from 'sonner';
import type { Proposal, Client } from '@/types';
import { DEFAULT_TERMS_CONDITIONS } from '@/constants/proposalDefaults';

interface ProposalViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: Proposal | null;
  client: Client | null;
}

export function ProposalViewDialog({
  open,
  onOpenChange,
  proposal,
  client,
}: ProposalViewDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const pdfTitle = proposal && client
    ? (proposal.proposalTitle?.trim() || `Proposal for ${client.companyName}`)
    : '';
  const createdByName = proposal?.createdBy || proposal?.user?.firstName || '';

  // Generate PDF blob when modal opens
  useEffect(() => {
    if (open && proposal && client) {
      generatePDFBlob();
    } else {
      setPdfBlob(null);
    }
  }, [open, proposal, client]);

  const generatePDFBlob = async () => {
    if (!proposal || !client) return;

    setIsGenerating(true);
    try {
      const pdfDocument = (
        <ProposalPDF
          proposalNumber={proposal.proposalNumber}
          proposalTitle={pdfTitle}
          createdByName={createdByName}
          client={client}
          items={proposal.items.map(item => ({
            id: item.id,
            inventoryItemId: item.inventoryItemId,
            name: item.snapshotName,
            make: item.snapshotMake,
            model: item.snapshotModel,
            price: item.snapshotPrice,
            specifications: item.snapshotSpecs || {},
            quantity: item.quantity,
            discount: item.discount || 0,
            lineTotal: item.lineTotal,
          }))}
          subtotal={proposal.subtotal}
          taxRate={proposal.taxRate}
          taxAmount={proposal.taxAmount}
          total={proposal.totalAmount}
          validUntil={proposal.validUntil ? new Date(proposal.validUntil) : null}
          notes={proposal.notes || ''}
          termsConditions={proposal.termsConditions || DEFAULT_TERMS_CONDITIONS}
          createdAt={new Date(proposal.createdAt)}
        />
      );

      const blob = await pdf(pdfDocument).toBlob();
      setPdfBlob(blob);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob || !proposal) return;

    const filename = `${proposal.proposalNumber}_${client?.companyName.replace(/\s+/g, '_')}.pdf`;
    downloadBlob(pdfBlob, filename);
    toast.success('PDF downloaded successfully');
  };

  if (!proposal || !client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200">
          <DialogTitle>
            View Proposal - {proposal.proposalNumber}
            {(proposal as any).createdBy && (
              <span className="text-sm font-normal text-slate-600 ml-2">
                by {(proposal as any).createdBy}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Review the proposal and download the PDF.
          </DialogDescription>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-slate-100 px-6">
          {isGenerating ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
                <p className="text-slate-600">Generating PDF preview...</p>
              </div>
            </div>
          ) : pdfBlob ? (
            <div className="h-[600px] border border-slate-200 rounded-lg overflow-hidden bg-white">
              <PDFViewer
                width="100%"
                height="100%"
                showToolbar={false}
                className="border-none"
              >
                <ProposalPDF
                  proposalNumber={proposal.proposalNumber}
                  proposalTitle={pdfTitle}
                  createdByName={createdByName}
                  client={client}
                  items={proposal.items.map(item => ({
                    id: item.id,
                    inventoryItemId: item.inventoryItemId,
                    name: item.snapshotName,
                    make: item.snapshotMake,
                    model: item.snapshotModel,
                    price: item.snapshotPrice,
                    specifications: item.snapshotSpecs || {},
                    quantity: item.quantity,
                    discount: item.discount || 0,
                    lineTotal: item.lineTotal,
                  }))}
                  subtotal={proposal.subtotal}
                  taxRate={proposal.taxRate}
                  taxAmount={proposal.taxAmount}
                  total={proposal.totalAmount}
                  validUntil={proposal.validUntil ? new Date(proposal.validUntil) : null}
                  notes={proposal.notes || ''}
                  termsConditions={proposal.termsConditions || DEFAULT_TERMS_CONDITIONS}
                  createdAt={new Date(proposal.createdAt)}
                />
              </PDFViewer>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-600">
              {pdfBlob
                ? 'PDF ready for download'
                : 'Generating preview...'}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                disabled={!pdfBlob}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
