/**
 * Specification Dialog Component
 * Displays device specifications from JSONB data
 * Triggered by the 'i' icon in inventory and dropdowns
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import type { InventoryItem } from '@/types';

interface SpecificationDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpecificationDialog({
  item,
  open,
  onOpenChange,
}: SpecificationDialogProps) {
  if (!item) return null;

  const specs = item.specifications || {};
  const specEntries = Object.entries(specs);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary-900">
            {item.make} {item.model}
          </DialogTitle>
          <DialogDescription>
            Name: <span className="font-mono text-slate-700">{item.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="border-b border-slate-200 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Category</p>
                <p className="text-sm font-medium text-slate-900">
                  {item.category}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">List Price</p>
                  <p className="text-sm font-semibold text-primary-600 tabular-nums">
                    ₹{(item.unitPrice ?? 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2">
                Description
              </h4>
              <p className="text-sm text-slate-600">{item.description}</p>
            </div>
          )}

          {/* Technical Specifications */}
          {specEntries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">
                Technical Specifications
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                  >
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {specEntries.length === 0 && !item.description && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">
                No detailed specifications available for this item.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
