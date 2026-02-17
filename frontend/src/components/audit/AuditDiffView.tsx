/**
 * Audit Log Diff Viewer
 * Displays side-by-side comparison of changed values
 * Highlights additions in green, deletions in red
 */

// import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { AuditLog } from '@/types';

interface AuditDiffViewProps {
  log: AuditLog;
}

export function AuditDiffView({ log }: AuditDiffViewProps) {
  const oldValues = log.oldValues || {};
  const newValues = log.newValues || {};

  // Get all keys that changed
  const changedKeys = new Set([
    ...Object.keys(oldValues),
    ...Object.keys(newValues),
  ]);

  if (changedKeys.size === 0) {
    return (
      <div className="text-center py-4 text-sm text-slate-500">
        No changes detected
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant={
            log.action === 'CREATE'
              ? 'success'
              : log.action === 'DELETE'
              ? 'danger'
              : 'default'
          }
        >
          {log.action}
        </Badge>
        <span className="text-sm text-slate-600">
          {log.entity} • Record ID: {log.recordId.slice(0, 8)}
        </span>
      </div>

      {/* Diff Grid */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200">
          <div className="px-4 py-2 text-xs font-semibold text-slate-700 uppercase">
            Field
          </div>
          <div className="px-4 py-2 text-xs font-semibold text-slate-700 uppercase border-l border-slate-200">
            Old Value
          </div>
          <div className="px-4 py-2 text-xs font-semibold text-slate-700 uppercase border-l border-slate-200">
            New Value
          </div>
        </div>

        {/* Rows */}
        {Array.from(changedKeys).map((key) => {
          const oldValue = oldValues[key];
          const newValue = newValues[key];
          const hasChanged = oldValue !== newValue;

          return (
            <div
              key={key}
              className="grid grid-cols-3 border-b border-slate-200 last:border-b-0"
            >
              {/* Field Name */}
              <div className="px-4 py-3 text-sm font-medium text-slate-900 bg-slate-50">
                {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>

              {/* Old Value */}
              <div
                className={`px-4 py-3 text-sm font-mono border-l border-slate-200 ${
                  hasChanged && oldValue !== undefined
                    ? 'bg-danger-50 text-danger-700'
                    : 'bg-white text-slate-700'
                }`}
              >
                {oldValue !== undefined ? (
                  <span className="break-all">
                    {typeof oldValue === 'object'
                      ? JSON.stringify(oldValue, null, 2)
                      : String(oldValue)}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">—</span>
                )}
              </div>

              {/* New Value */}
              <div
                className={`px-4 py-3 text-sm font-mono border-l border-slate-200 ${
                  hasChanged && newValue !== undefined
                    ? 'bg-success-50 text-success-700'
                    : 'bg-white text-slate-700'
                }`}
              >
                {newValue !== undefined ? (
                  <span className="break-all">
                    {typeof newValue === 'object'
                      ? JSON.stringify(newValue, null, 2)
                      : String(newValue)}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
