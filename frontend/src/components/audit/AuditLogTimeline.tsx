/**
 * Audit Log Timeline
 * Displays a chronological list of audit events
 * Expandable to show diff details
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AuditDiffView } from './AuditDiffView';
import type { AuditLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AuditLogTimelineProps {
  logs: AuditLog[];
}

export function AuditLogTimeline({ logs }: AuditLogTimelineProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  if (logs.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-500">No audit logs found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log, index) => {
        const isExpanded = expandedLogs.has(log.id);
        const isLast = index === logs.length - 1;

        return (
          <div
            key={log.id}
            className="card hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Log Header */}
            <button
              className="w-full px-6 py-4 flex items-start gap-4 text-left hover:bg-slate-50 transition-colors"
              onClick={() => toggleExpanded(log.id)}
            >
              {/* Timeline Connector */}
              <div className="relative flex-shrink-0 pt-1">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full border-2 border-primary-600',
                    log.action === 'CREATE'
                      ? 'bg-success-500'
                      : log.action === 'DELETE'
                      ? 'bg-danger-500'
                      : 'bg-primary-600'
                  )}
                />
                {!isLast && (
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-slate-200" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
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
                  <span className="text-sm font-semibold text-slate-900">
                    {log.entity}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>
                      {log.user
                        ? `${log.user.firstName} ${log.user.lastName} (${log.user.role === 'SUPERADMIN' ? 'SuperAdmin' : log.user.role === 'ADMIN' ? 'Admin' : 'User'})`
                        : 'System'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(log.timestamp, { 
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</span>
                  </div>
                </div>

                {log.ipAddress && (
                  <div className="text-xs text-slate-500 mt-1">
                    IP: {log.ipAddress}
                  </div>
                )}
              </div>

              {/* Expand Icon */}
              <div className="flex-shrink-0 pt-1">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Expanded Diff View */}
            {isExpanded && (
              <div className="px-6 pb-6 border-t border-slate-200 bg-slate-50/50">
                <div className="mt-4">
                  <AuditDiffView log={log} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
