/**
 * Proposals List Page
 * Lists all saved proposals with basic management actions.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Proposal, Client } from '@/types';
import { ProposalsTable } from '@/components/proposal/ProposalsTable';
import { ProposalViewDialog } from '@/components/proposal/ProposalViewDialog';
import { toast } from 'sonner';

export function ProposalsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const response = await api.proposals.getAll();
      return response.data.data as Proposal[];
    },
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.clients.getAll();
      return response.data.data as Client[];
    },
  });

  const proposals = proposalsData || [];
  const clients = clientsData || [];
  const clientFilterId = searchParams.get('client');
  const filteredProposals = clientFilterId
    ? proposals.filter((proposal) => proposal.clientId === clientFilterId)
    : proposals;
  const filteredClient = clientFilterId
    ? clients.find((client) => client.id === clientFilterId) || null
    : null;

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId || proposals.length === 0) return;
    const found = proposals.find((p) => p.id === viewId);
    if (found) {
      setViewProposal(found);
      setViewDialogOpen(true);
    }
  }, [searchParams, proposals]);

  const refetchProposals = () => {
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
  };

  const handleDeleteProposal = async (proposal: Proposal) => {
    if (!window.confirm(`Delete proposal ${proposal.proposalNumber}?`)) return;
    try {
      await api.proposals.delete(proposal.id);
      toast.success('Proposal deleted');
      refetchProposals();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete proposal');
    }
  };

  const handleViewProposal = (proposal: Proposal) => {
    setViewProposal(proposal);
    setViewDialogOpen(true);
  };

  const selectedClient = viewProposal
    ? clients.find(c => c.id === viewProposal.clientId) || null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-primary-900">Proposals</h1>
          <p className="text-sm text-slate-600 mt-1">
            {filteredClient
              ? `Showing proposals for ${filteredClient.companyName}`
              : 'View and manage all proposals'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {clientFilterId && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('client');
                  return next;
                });
              }}
            >
              Clear filter
            </Button>
          )}
          <Button onClick={() => navigate('/proposals/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
        </div>
      </div>

      <ProposalsTable
        proposals={filteredProposals}
        clients={clients}
        onView={handleViewProposal}
        onDelete={handleDeleteProposal}
      />

      <ProposalViewDialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('view');
              return next;
            });
          }
        }}
        proposal={viewProposal}
        client={selectedClient}
      />
    </div>
  );
}
