import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, Eye } from 'lucide-react';
import { api } from '../lib/api';
import { format } from 'date-fns';
import type { Proposal, Client } from '@/types';
import { Button } from '@/components/ui/Button';
import { ProposalViewDialog } from '@/components/proposal/ProposalViewDialog';
import { toast } from 'sonner';
import { useState } from 'react';

export function ProposalsHistoryPage() {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const { data, isLoading } = useQuery<{ data: Proposal[] }>({
    queryKey: ['proposal-history'],
    queryFn: async () => {
      const res = await api.proposals.getAll();
      return res.data;
    },
  });

  const proposals = data?.data || [];

  const openViewer = async (proposalId: string) => {
    try {
      const res = await api.proposals.getById(proposalId);
      const proposal = res.data.data as Proposal;
      // Try to get client from list first
      const listClient = proposals.find((p) => p.id === proposalId)?.client || null;
      let client = listClient;
      if (!client && proposal.clientId) {
        const cRes = await api.clients.getById(proposal.clientId);
        client = cRes.data.data as Client;
      }

      setSelectedProposal(proposal);
      setSelectedClient(client);
      setViewerOpen(true);
    } catch (error) {
      toast.error('Unable to load proposal');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">All proposals across clients</p>
          <h1 className="text-page-title text-primary-900 font-semibold tracking-tight">Proposal History</h1>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary-900">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-white uppercase tracking-wider text-xs">Number</th>
                <th className="px-6 py-3 text-left font-semibold text-white uppercase tracking-wider text-xs">Client</th>
                <th className="px-6 py-3 text-left font-semibold text-white uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-white uppercase tracking-wider text-xs">Total</th>
                <th className="px-6 py-3 text-left font-semibold text-white uppercase tracking-wider text-xs">Created</th>
                <th className="px-6 py-3 text-left font-semibold text-white uppercase tracking-wider text-xs">Managed By</th>
                <th className="px-6 py-3 text-right font-semibold text-white uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-slate-500">Loading proposals...</td>
                </tr>
              ) : proposals.length ? (
                proposals.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-primary-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary-600" />
                      {p.proposalNumber}
                    </td>
                    <td className="px-6 py-3 text-slate-800">{p.client?.companyName || '—'}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{p.status}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-900 font-semibold">₹{p.totalAmount?.toLocaleString?.() ?? '0'}</td>
                    <td className="px-6 py-3 text-slate-700 flex items-center gap-1">
                      <Clock className="h-4 w-4 text-slate-500" />
                      {p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td className="px-6 py-3 text-slate-700">{p.createdBy || p.user?.email || p.user?.firstName || '—'}</td>
                    <td className="px-6 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openViewer(p.id)}>
                        <Eye className="h-4 w-4 mr-1" /> View PDF
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-center text-slate-500">No proposals found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProposalViewDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        proposal={selectedProposal}
        client={selectedClient}
      />
    </div>
  );
}
