/**
 * Proposal Line Items Table
 * Displays selected devices with quantity, price, and controls
 */

import { useState } from 'react';
import { Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SpecificationDialog } from '@/components/inventory/SpecificationDialog';
import { useProposalStore } from '@/store/useProposalStore';
import { formatCurrency, cn } from '@/lib/utils';
import type { InventoryItem } from '@/types';

export function ProposalLineItemsTable() {
  const items = useProposalStore((state) => state.items);
  const updateItem = useProposalStore((state) => state.updateItem);
  const removeItem = useProposalStore((state) => state.removeItem);
  
  const [specDialogItem, setSpecDialogItem] = useState<InventoryItem | null>(
    null
  );

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">
          No items added yet. Use the device selector above to add items to this
          proposal.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead className="bg-primary-600 shadow-sm">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Device
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Device Name
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-white uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-white uppercase tracking-wider">
                  Discount %
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-white uppercase tracking-wider">
                  Line Total
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                // Mock inventory item for spec dialog
                const mockInventoryItem: InventoryItem = {
                  id: item.inventoryItemId ?? item.id,
                  name: item.name,
                  make: item.make,
                  model: item.model,
                  category: 'N/A',
                  unitCost: 0,
                  unitPrice: item.price,
                  specifications: item.specifications || {},
                  isActive: true,
                  createdAt: '',
                  updatedAt: '',
                };

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'table-row-hover transition-all duration-150',
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    )}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {item.make} {item.model}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-700">
                        {item.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          updateItem(item.id, { price });
                        }}
                        className="w-24 text-right tabular-nums h-9 text-sm border-slate-200 focus:border-primary-500"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value, 10) || 1;
                          updateItem(item.id, { quantity: Math.max(1, quantity) });
                        }}
                        className="w-20 text-center tabular-nums h-9 text-sm mx-auto border-slate-200 focus:border-primary-500"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Input
                        type="number"
                        value={item.discount}
                        onChange={(e) => {
                          const discount = parseFloat(e.target.value) || 0;
                          updateItem(item.id, {
                            discount: Math.max(0, Math.min(100, discount)),
                          });
                        }}
                        className="w-20 text-right tabular-nums h-9 text-sm border-slate-200 focus:border-primary-500"
                        step="0.1"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-primary-600 tabular-nums text-base">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSpecDialogItem(mockInventoryItem)}
                          title="View specifications"
                          className="h-8 w-8 hover:bg-primary-50"
                        >
                          <Info className="h-4 w-4 text-primary-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                          className="h-8 w-8 hover:bg-danger-50"
                        >
                          <Trash2 className="h-4 w-4 text-danger-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SpecificationDialog
        item={specDialogItem}
        open={!!specDialogItem}
        onOpenChange={(open) => !open && setSpecDialogItem(null)}
      />
    </>
  );
}
