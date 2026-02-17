/**
 * Client Proposals Dialog
 * List proposals tied to a selected client.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Client, Proposal } from '@/types';
import { Link } from 'react-router-dom';

interface ClientProposalsDialogProps {
  client: Client | null;
  proposals: Proposal[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusVariant(status: Proposal['status']) {
  switch (status) {
    case 'APPROVED':
    case 'SENT':
    case 'ACCEPTED':
      return 'success';
    case 'SUBMITTED':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    case 'DRAFT':
    default:
      return 'secondary';
  }
}

export function ClientProposalsDialog({
  client,
  proposals,
  open,
  onOpenChange,
}: ClientProposalsDialogProps) {
  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary-900">
            {client.companyName}
          </DialogTitle>
          <DialogDescription>
            Proposals for this client.
          </DialogDescription>
        </DialogHeader>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Proposals
            </h4>
            <Button asChild variant="link" size="sm" className="px-0 h-auto">
              <Link to={`/proposals?client=${client.id}`}>View all</Link>
            </Button>
          </div>
          {proposals.length === 0 ? (
            <p className="text-sm text-slate-500">No proposals found.</p>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">
                        {proposal.proposalNumber}
                      </p>
                      <Badge variant={getStatusVariant(proposal.status)}>
                        {proposal.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Created {formatDate(proposal.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(proposal.totalAmount)}
                    </span>
                    <Button asChild variant="link" size="sm" className="px-0 h-auto">
                      <Link to={`/proposals?view=${proposal.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
