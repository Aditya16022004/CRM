/**
 * Device Selection Combobox
 * Custom searchable dropdown with specifications preview
 * Features:
 * - Search/filter devices
 * - 'i' icon to view specs without selecting
 * - Proper event handling with stopPropagation
 */

import { useState, useMemo } from 'react';
import { Command } from 'cmdk';
import { Check, Info, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SpecificationDialog } from '@/components/inventory/SpecificationDialog';
import type { InventoryItem } from '@/types';
import { cn } from '@/lib/utils';

interface DeviceComboboxProps {
  devices: InventoryItem[];
  onSelect: (device: InventoryItem) => void;
  selectedId?: string;
}

export function DeviceCombobox({
  devices,
  onSelect,
  selectedId,
}: DeviceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [specDialogItem, setSpecDialogItem] = useState<InventoryItem | null>(
    null
  );

  const filteredDevices = useMemo(() => {
    if (!search) return devices;

    const searchLower = search.toLowerCase();
    return devices.filter(
      (device) =>
        device.make.toLowerCase().includes(searchLower) ||
        device.model.toLowerCase().includes(searchLower) ||
        device.name.toLowerCase().includes(searchLower) ||
        device.category.toLowerCase().includes(searchLower)
    );
  }, [devices, search]);

  const selectedDevice = devices.find((d) => d.id === selectedId);

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2.5 bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 transition-all"
          onClick={() => setOpen(!open)}
        >
          {selectedDevice ? (
            <span className="text-left">
              <span className="font-medium text-slate-900">{selectedDevice.name}</span>
            </span>
          ) : (
            <span className="text-slate-500">Select a device...</span>
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        </Button>

        {open && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl animate-scale-in max-h-[70vh] overflow-hidden">
            <Command className="max-h-[70vh] overflow-hidden">
              <div className="flex items-center border-b border-slate-200 px-3 bg-slate-50 sticky top-0 z-10">
                <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 focus:bg-white transition-colors"
                  placeholder="Search devices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto scrollbar-thin p-1.5 pr-2">
                {filteredDevices.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    No devices found.
                  </div>
                ) : (
                  filteredDevices.map((device) => {
                    const isSelected = device.id === selectedId;

                    return (
                      <div
                        key={device.id}
                        className={cn(
                          'relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-all duration-150',
                          'hover:bg-primary-50 hover:shadow-sm',
                          isSelected && 'bg-primary-100 border border-primary-200'
                        )}
                        onClick={() => {
                          onSelect(device);
                          setOpen(false);
                          setSearch('');
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary-600 shrink-0" />
                            )}
                            <div className="flex-1 truncate">
                              <span className="font-semibold text-slate-900">
                                {device.make}
                              </span>{' '}
                              <span className="text-slate-700">
                                {device.model}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 text-xs">
                            <div className="text-slate-600 truncate">
                              {device.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-primary-600 font-semibold tabular-nums">
                              ₹{device.unitPrice.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Info button with stopPropagation */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 ml-2 hover:bg-primary-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSpecDialogItem(device);
                          }}
                          title="View specifications"
                        >
                          <Info className="h-4 w-4 text-primary-600" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </Command>
          </div>
        )}

        {/* Click outside to close */}
        {open && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setSearch('');
            }}
          />
        )}
      </div>

      {/* Specification Dialog */}
      <SpecificationDialog
        item={specDialogItem}
        open={!!specDialogItem}
        onOpenChange={(open) => !open && setSpecDialogItem(null)}
      />
    </>
  );
}
