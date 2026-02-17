/**
 * Proposals Table
 * Lists saved proposals with basic info and actions.
 */

import { Eye, Trash2 } from 'lucide-react';
import type { Proposal, Client } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ProposalsTableProps {
  proposals: Proposal[];
  clients: Client[];
  onView: (proposal: Proposal) => void;
  onDelete: (proposal: Proposal) => void;
}

export function ProposalsTable({
  proposals,
  clients,
  onView,
  onDelete,
}: ProposalsTableProps) {
  if (proposals.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-500">
          No proposals created yet. Click &quot;Create Proposal&quot; to start.
        </p>
      </div>
    );
  }

  const clientNameMap = new Map(clients.map((c) => [c.id, c.companyName]));

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead className="bg-primary-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Proposal #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Created By
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Valid Until
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proposals.map((proposal) => (
              <tr key={proposal.id} className="table-row-hover">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {proposal.proposalNumber}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {clientNameMap.get(proposal.clientId) || 'Unknown Client'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {(proposal as any).createdBy || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {proposal.status}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatDate(proposal.createdAt)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {proposal.validUntil
                    ? formatDate(proposal.validUntil)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-900 text-right tabular-nums">
                  {formatCurrency(proposal.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary-50"
                      title="View proposal details"
                      onClick={() => onView(proposal)}
                    >
                      <Eye className="h-4 w-4 text-primary-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-danger-50"
                      title="Delete proposal"
                      onClick={() => onDelete(proposal)}
                    >
                      <Trash2 className="h-4 w-4 text-danger-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

