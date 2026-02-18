/**
 * Devices Page
 * Master catalog of devices (no stock tracking)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';

type Device = {
  id: string;
  name: string;
  make: string;
  model: string;
  category: string;
  description?: string;
  unit: string;
  unitCost: number;
  unitPrice: number;
  specifications?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

type DeviceFormData = {
  name: string;
  make: string;
  model: string;
  category: string;
  description?: string;
  unit: string;
  unitCost: string | number;
  unitPrice: string | number;
  specifications?: Record<string, any>;
};

export function DevicesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [selectedDeviceName, setSelectedDeviceName] = useState('');
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    make: '',
    model: '',
    category: '',
    description: '',
    unit: 'Unit',
    unitCost: '',
    unitPrice: '',
    specifications: {},
  });

  const currentUser = useMemo(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';

  // Fetch devices
  const { data: devicesData, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await api.devices.getAll();
      return response.data.data;
    },
  });

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !devicesData?.length) return;
    const found = devicesData.find((d: Device) => d.id === editId);
    if (found) {
      handleOpenDialog(found);
    }
  }, [searchParams, devicesData]);

  // Create device mutation
  const createMutation = useMutation({
    mutationFn: (data: DeviceFormData) => api.devices.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device created successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to create device');
    },
  });

  // Update device mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeviceFormData }) =>
      api.devices.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update device');
    },
  });

  // Delete device mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.devices.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete device');
    },
  });

  const handleOpenDialog = (device?: Device, options?: { readOnly?: boolean }) => {
    const readonly = options?.readOnly || false;
    if (!canManage && !readonly) {
      toast.error('Only admins can manage the device catalog');
      return;
    }
    setViewOnly(readonly);

    if (device) {
      setEditingDevice(device);
      setSelectedDeviceName('');
      setFormData({
        name: device.name,
        make: device.make,
        model: device.model,
        category: device.category,
        description: device.description || '',
        unit: device.unit || 'Unit',
        unitCost: device.unitCost,
        unitPrice: device.unitPrice,
        specifications: device.specifications || {},
      });
    } else {
      setEditingDevice(null);
      setSelectedDeviceName('');
      setFormData({
        name: '',
        make: '',
        model: '',
        category: '',
        description: '',
        unit: 'Unit',
        unitCost: 0,
        unitPrice: 0,
        specifications: {},
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDevice(null);
    setViewOnly(false);
    setSelectedDeviceName('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('edit');
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewOnly) return;
    const submitData = {
      ...formData,
      unitCost: typeof formData.unitCost === 'string' ? parseFloat(formData.unitCost) || 0 : formData.unitCost,
      unitPrice: typeof formData.unitPrice === 'string' ? parseFloat(formData.unitPrice) || 0 : formData.unitPrice,
    };
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (!canManage) {
      toast.error('Only admins can manage the device catalog');
      return;
    }
    if (confirm('Are you sure you want to delete this device?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-primary-900 font-semibold tracking-tight">
            Device Catalog
          </h1>
          <p className="text-sm text-slate-600 mt-1.5">
            Manage your master device catalog
          </p>
        </div>
        {canManage && (
          <Button onClick={() => handleOpenDialog()} className="shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        )}
      </div>

      {/* Devices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Device Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Make
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading devices...
                  </td>
                </tr>
              ) : devicesData && devicesData.length > 0 ? (
                devicesData.map((device: Device) => (
                  <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {device.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {device.make}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {device.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {device.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                      ₹{device.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(device, { readOnly: !canManage })}
                        aria-label={canManage ? 'Edit device' : 'View device'}
                      >
                        {canManage ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(device.id)}
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No devices found. Add your first device to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? 'Edit Device' : 'Add New Device'}
            </DialogTitle>
            <DialogDescription>
              {viewOnly ? 'Device details (view only)' : 'Enter device details for the master catalog.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4" aria-disabled={viewOnly}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Device Name *
                </label>

                {!editingDevice && (
                  <select
                    disabled={viewOnly}
                    className="input h-10 bg-slate-50 focus:bg-white transition-colors mb-2 disabled:opacity-70"
                    value={selectedDeviceName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedDeviceName(value);
                      if (!value || viewOnly) {
                        return;
                      }
                      const match = devicesData?.find(
                        (device: Device) => device.name === value
                      );
                      if (match) {
                        // Prefill from existing device as a template; stay in create mode
                        setEditingDevice(null);
                        setFormData({
                          name: match.name,
                          make: match.make,
                          model: match.model,
                          category: match.category,
                          description: match.description || '',
                          unit: match.unit || 'Unit',
                          unitCost: match.unitCost,
                          unitPrice: match.unitPrice,
                          specifications: match.specifications || {},
                        });
                      }
                    }}
                  >
                    <option value="">Select existing device (optional)</option>
                    {(devicesData || []).map((device: Device) => (
                      <option key={device.id} value={device.name}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                )}

                <Input
                  disabled={viewOnly}
                  value={formData.name}
                  onChange={(e) => {
                    if (viewOnly) return;
                    const value = e.target.value;
                    setFormData({ ...formData, name: value });
                  }}
                  placeholder="e.g. SITC of 5 MP Dome cameras - I-HIPD5PI-MF"
                  required
                />
                {selectedDeviceName && !editingDevice && (
                  <p className="text-xs text-slate-600 mt-1">
                    Loaded from an existing device as a starting point. Submitting will create a new device.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <Input
                  disabled={viewOnly}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Camera, Switch, Router"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Make / Brand *
                </label>
                <Input
                  disabled={viewOnly}
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g. Hikvision"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Model *
                </label>
                <Input
                  disabled={viewOnly}
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g. DS-2CD2143G0-I"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Unit
                </label>
                <Input
                  disabled={viewOnly}
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. Unit, Piece, Box"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Purchase/Manufacturing Cost (₹) *
                </label>
                <Input
                  disabled={viewOnly}
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) =>
                    setFormData({ ...formData, unitCost: e.target.value })
                  }
                  placeholder="What you pay"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Unit Selling Price (₹) *
                </label>
                <Input
                  disabled={viewOnly}
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  placeholder="What you charge"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  disabled={viewOnly}
                  className="input min-h-[80px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Device description..."
                />
              </div>
              </div>
            </div>
            {!viewOnly && (
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDevice ? 'Update Device' : 'Create Device'}
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
