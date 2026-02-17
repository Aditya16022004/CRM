/**
 * PDF Preview Modal
 * Implements the "Preview-First" workflow state machine
 * 
 * State Flow:
 * 1. User clicks "Preview PDF" -> Opens modal with PDF viewer
 * 2. PDF renders and blob is generated
 * 3. "Download & Save" button becomes enabled
 * 4. User can download and/or save to database
 */

import { useState, useEffect, useMemo } from 'react';
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
import { useProposalStore } from '@/store/useProposalStore';
import { downloadBlob } from '@/lib/utils';
import { toast } from 'sonner';

interface PDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (blob: Blob) => Promise<void>;
}

export function PDFPreviewModal({
  open,
  onOpenChange,
  onSave,
}: PDFPreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const client = useProposalStore((state) => state.client);
  const items = useProposalStore((state) => state.items);
  const subtotal = useProposalStore((state) => state.subtotal);
  const taxRate = useProposalStore((state) => state.taxRate);
  const taxAmount = useProposalStore((state) => state.taxAmount);
  const total = useProposalStore((state) => state.total);
  const proposalTitle = useProposalStore((state) => state.proposalTitle);
  const createdBy = useProposalStore((state) => state.createdBy);
  const notes = useProposalStore((state) => state.notes);
  const termsConditions = useProposalStore((state) => state.termsConditions);
  const validUntil = useProposalStore((state) => state.validUntil);
  const finishPreview = useProposalStore((state) => state.finishPreview);
  const cancelPreview = useProposalStore((state) => state.cancelPreview);

  // Generate proposal number (in real app, this comes from backend)
  const proposalNumber = useMemo(
    () => `PROP-${Date.now().toString().slice(-6)}`,
    []
  );

  // Generate PDF blob when modal opens
  useEffect(() => {
    if (open && !pdfBlob && client) {
      generatePDFBlob();
    }
  }, [open, client]);

  const generatePDFBlob = async () => {
    if (!client) return;

    setIsGenerating(true);
    try {
      const pdfDocument = (
        <ProposalPDF
          proposalNumber={proposalNumber}
          proposalTitle={proposalTitle}
          createdByName={createdBy}
          client={client}
          items={items}
          subtotal={subtotal}
          taxRate={taxRate}
          taxAmount={taxAmount}
          total={total}
          validUntil={validUntil}
          notes={notes}
          termsConditions={termsConditions}
          createdAt={new Date()}
        />
      );

      const blob = await pdf(pdfDocument).toBlob();
      setPdfBlob(blob);
      finishPreview(blob);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;

    const filename = `${proposalNumber}_${client?.companyName.replace(/\s+/g, '_')}.pdf`;
    downloadBlob(pdfBlob, filename);
    toast.success('PDF downloaded successfully');
  };

  const handleSaveAndDownload = async () => {
    if (!pdfBlob) return;

    setIsSaving(true);
    try {
      await onSave(pdfBlob);
      handleDownload();
      toast.success('Proposal saved and downloaded');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save proposal:', error);
      toast.error('Failed to save proposal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setPdfBlob(null);
    cancelPreview();
    onOpenChange(false);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200">
          <DialogTitle>Preview Proposal - {proposalNumber}</DialogTitle>
          <DialogDescription>
            Preview the PDF before saving or downloading.
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
          ) : (
            client && (
              <div className="h-[600px] border border-slate-200 rounded-lg overflow-hidden bg-white">
                <PDFViewer
                  width="100%"
                  height="100%"
                  showToolbar={false}
                  className="border-none"
                >
                  <ProposalPDF
                    proposalNumber={proposalNumber}
                    proposalTitle={proposalTitle}
                    createdByName={createdBy}
                    client={client}
                    items={items}
                    subtotal={subtotal}
                    taxRate={taxRate}
                    taxAmount={taxAmount}
                    total={total}
                    validUntil={validUntil}
                    notes={notes}
                    termsConditions={termsConditions}
                    createdAt={new Date()}
                  />
                </PDFViewer>
              </div>
            )
          )}
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
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleDownload}
                disabled={!pdfBlob || isSaving}
                variant="secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Only
              </Button>
              <Button
                onClick={handleSaveAndDownload}
                disabled={!pdfBlob || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download & Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
