/**
 * Clients Page
 * Allows adding, listing, viewing and deleting clients.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Client } from '@/types';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { ClientDetailsDialog } from '@/components/clients/ClientDetailsDialog';
import { ClientTable } from '@/components/clients/ClientTable';
import { ClientProposalsDialog } from '../components/clients/ClientProposalsDialog';
import type { Proposal } from '@/types';

export function ClientsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [proposalsOpen, setProposalsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.clients.getAll();
      return response.data.data as Client[];
    },
  });

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const response = await api.proposals.getAll();
      return response.data.data as Proposal[];
    },
  });

  const clients = data || [];
  const proposals = proposalsData || [];
  const selectedClientProposals = selectedClient
    ? proposals.filter((proposal) => proposal.clientId === selectedClient.id)
    : [];

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId || clients.length === 0) return;
    const found = clients.find((c) => c.id === viewId);
    if (found) {
      setSelectedClient(found);
      setDetailsOpen(true);
    }
  }, [searchParams, clients]);

  const refetchClients = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const handleSaveClient = async (values: any, existing?: Client) => {
    try {
      if (existing) {
        await api.clients.update(existing.id, values);
        toast.success('Client updated');
      } else {
        await api.clients.create(values);
        toast.success('Client added');
      }
      setFormOpen(false);
      setSelectedClient(null);
      refetchClients();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save client');
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!window.confirm(`Delete client "${client.companyName}"?`)) return;
    try {
      await api.clients.delete(client.id);
      toast.success('Client deleted');
      refetchClients();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete client');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-primary-900">Clients</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your client relationships
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedClient(null);
            setFormOpen(true);
          }}
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <ClientTable
        clients={clients}
        onInfo={(client) => {
          setSelectedClient(client);
          setDetailsOpen(true);
        }}
        onProposals={(client) => {
          setSelectedClient(client);
          setProposalsOpen(true);
        }}
        onDelete={handleDeleteClient}
      />

      <ClientFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedClient(null);
        }}
        initialClient={selectedClient}
        clients={clients}
        onSubmit={handleSaveClient}
      />

      <ClientDetailsDialog
        client={selectedClient}
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('view');
              return next;
            });
          }
        }}
      />

      <ClientProposalsDialog
        client={selectedClient}
        proposals={selectedClientProposals}
        open={proposalsOpen}
        onOpenChange={(open: boolean) => {
          setProposalsOpen(open);
        }}
      />
    </div>
  );
}
