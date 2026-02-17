/**
 * Proposal Builder Page
 * Main CPQ interface
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DeviceCombobox } from '@/components/proposal/DeviceCombobox';
import { ProposalLineItemsTable } from '@/components/proposal/ProposalLineItemsTable';
import { ProposalSummary } from '@/components/proposal/ProposalSummary';
import { PDFPreviewModal } from '@/components/proposal/PDFPreviewModal';
import { useProposalStore } from '@/store/useProposalStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Client } from '@/types';

export function ProposalBuilderPage() {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Manual item form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    make: '',
    model: '',
    price: '' as string | number,
    quantity: 1 as string | number,
    discount: '' as string | number,
  });

  const client = useProposalStore((state) => state.client);
  const setClient = useProposalStore((state) => state.setClient);
  const addItem = useProposalStore((state) => state.addItem);
  const items = useProposalStore((state) => state.items);
  const status = useProposalStore((state) => state.status);
  const validate = useProposalStore((state) => state.validate);
  const startPreview = useProposalStore((state) => state.startPreview);
  const proposalTitle = useProposalStore((state) => state.proposalTitle);
  const setProposalTitle = useProposalStore((state) => state.setProposalTitle);
  const createdBy = useProposalStore((state) => state.createdBy);
  const setCreatedBy = useProposalStore((state) => state.setCreatedBy);

  // Fetch devices from master catalog
  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await api.devices.getAll();
      return response.data.data;
    },
  });

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.clients.getAll();
      return response.data.data;
    },
  });


  const handleAddDevice = (device: any) => {
    addItem({
      inventoryItemId: device.id,
      name: device.name,
      make: device.make,
      model: device.model,
      price: device.unitPrice,
      specifications: device.specifications,
      quantity: 1,
      discount: 0,
    });
    toast.success('Device added to proposal');
  };

  const handleAddItem = () => {
    const price = typeof newItem.price === 'string' ? parseFloat(newItem.price) : newItem.price;
    const quantity = typeof newItem.quantity === 'string' ? parseInt(newItem.quantity) : newItem.quantity;
    const discount = typeof newItem.discount === 'string' ? parseFloat(newItem.discount) : newItem.discount;
    
    if (!newItem.name || !newItem.make || !newItem.model || price <= 0) {
      toast.error('Please fill in all item details');
      return;
    }
    
    addItem({
      inventoryItemId: '',
      name: newItem.name,
      make: newItem.make,
      model: newItem.model,
      price: price || 0,
      specifications: {},
      quantity: quantity || 1,
      discount: discount || 0,
    });
    
    // Reset form
    setNewItem({
      name: '',
      make: '',
      model: '',
      price: '',
      quantity: 1,
      discount: '',
    });
    
    toast.success('Item added to proposal');
  };

  const handlePreview = () => {
    const validation = validate();
    if (!validation.valid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }
    startPreview();
    setPreviewOpen(true);
  };

  const handleSave = async (_blob: Blob) => {
    const proposalData = useProposalStore.getState();
    await api.proposals.create({
      clientId: proposalData.clientId!,
      proposalTitle: proposalData.proposalTitle,
      items: proposalData.items.map((item) => ({
        quantity: item.quantity,
        discount: item.discount,
        snapshotName: item.name,
        snapshotMake: item.make,
        snapshotModel: item.model,
        snapshotPrice: item.price,
        snapshotSpecs: item.specifications,
        lineTotal: item.lineTotal,
      })),
      taxRate: proposalData.taxRate,
      notes: proposalData.notes,
      termsConditions: proposalData.termsConditions,
      validUntil: proposalData.validUntil?.toISOString(),
      createdBy: proposalData.createdBy,
    });
    navigate('/proposals');
  };

  const handleCreateProposal = async () => {
    const validation = validate();
    if (!validation.valid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    if (!createdBy.trim()) {
      toast.error('Please enter the name of the person managing this proposal');
      return;
    }

    try {
      const proposalData = useProposalStore.getState();
      const response = await api.proposals.create({
        clientId: proposalData.clientId!,
        proposalTitle: proposalData.proposalTitle,
        items: proposalData.items.map((item) => ({
          quantity: item.quantity,
          discount: item.discount,
          snapshotName: item.name,
          snapshotMake: item.make,
          snapshotModel: item.model,
          snapshotPrice: item.price,
          snapshotSpecs: item.specifications,
          lineTotal: item.lineTotal,
        })),
        taxRate: proposalData.taxRate,
        notes: proposalData.notes,
        termsConditions: proposalData.termsConditions,
        validUntil: proposalData.validUntil?.toISOString(),
        createdBy: proposalData.createdBy,
      });
      toast.success(`Proposal created successfully! (${response.data.data.proposalNumber})`);
      // Don't redirect - stay on page to allow preview/download
    } catch (error) {
      toast.error('Failed to create proposal');
      console.error(error);
    }
  };

  const canPreview = items.length > 0 && client !== null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header - Enhanced */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/proposals')}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-page-title text-primary-900 font-semibold tracking-tight">
              Create Proposal
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              Configure line items and pricing for your client
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handlePreview}
            disabled={!canPreview || status === 'previewing'}
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview PDF
          </Button>
          <Button
            onClick={handleCreateProposal}
            disabled={!canPreview || status === 'previewing'}
            className="shadow-md hover:shadow-lg transition-shadow bg-green-600 hover:bg-green-700"
          >
            Create Proposal
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Proposal Info - Enhanced */}
          <div className="card p-6 hover:shadow-md transition-all duration-200 space-y-4">
            <h3 className="text-section-header text-slate-900 font-semibold">
              Client & Proposal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Client
                </label>
                <select
                  className="input h-10 bg-slate-50 focus:bg-white transition-colors"
                  value={client?.id || ''}
                  onChange={(e) => {
                    const selectedClient = clientsData?.find(
                      (c: Client) => c.id === e.target.value
                    );
                    setClient(selectedClient || null);
                  }}
                >
                  <option value="">Select a client...</option>
                  {clientsData?.map((c: Client) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proposal Title (shown on PDF cover)
                </label>
                <Input
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="e.g. Proposal for Camera Installation – Max Hospital, Lucknow"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Created By (Person managing this proposal) *
                </label>
                <Input
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="e.g. John Doe - Admin"
                  required
                />
              </div>
            </div>
          </div>

          {/* Add Items - Enhanced */}
          <div className="card p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-section-header text-slate-900 font-semibold">
                Add Line Items
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualForm(!showManualForm)}
              >
                {showManualForm ? 'Select from Catalog' : 'Add Manually'}
              </Button>
            </div>
            
            {!showManualForm ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Search Devices from Master Catalog
                </label>
                <DeviceCombobox
                  devices={devicesData || []}
                  onSelect={handleAddDevice}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Device Name
                  </label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g. SITC of 5 MP Dome cameras - I-HIPD5PI-MF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Make / Brand
                  </label>
                  <Input
                    value={newItem.make}
                    onChange={(e) => setNewItem({ ...newItem, make: e.target.value })}
                    placeholder="e.g. Hikvision"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Model
                  </label>
                  <Input
                    value={newItem.model}
                    onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                    placeholder="e.g. DS-2CD2143G0-I"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit Selling Price (₹)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newItem.discount}
                    onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleAddItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item to Proposal
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <ProposalLineItemsTable />
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <ProposalSummary />
        </div>
      </div>

      {/* Preview Modal */}
      <PDFPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onSave={handleSave}
      />
    </div>
  );
}
