/**
 * Client Table
 * Displays list of clients with actions:
 * - Info (i) icon to view details
 * - Delete
 */

// import React from 'react';
import { Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Client } from '@/types';

interface ClientTableProps {
  clients: Client[];
  onInfo: (client: Client) => void;
  onProposals: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientTable({ clients, onInfo, onProposals, onDelete }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-500">No clients added yet.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead className="bg-primary-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Client Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((client) => (
              <tr key={client.id} className="table-row-hover">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {client.companyName}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {client.billingAddress.split('\n')[0]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {client.contactName || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {client.contactEmail || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {client.contactPhone || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => onProposals(client)}
                    >
                      Proposals
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary-50"
                      title="View client details"
                      onClick={() => onInfo(client)}
                    >
                      <Info className="h-4 w-4 text-primary-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-danger-50"
                      title="Delete client"
                      onClick={() => onDelete(client)}
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

