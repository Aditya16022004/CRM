/**
 * Audit Logs Page
 */

import { useQuery } from '@tanstack/react-query';
import { AuditLogTimeline } from '@/components/audit/AuditLogTimeline';
import { api } from '@/lib/api';

export function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await api.audit.getAll();
      return response.data.logs;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title text-primary-900">Audit Logs</h1>
        <p className="text-sm text-slate-600 mt-1">
          Track all changes to devices, proposals, and clients
        </p>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center">
          <p className="text-slate-500">Loading audit logs...</p>
        </div>
      ) : (
        <AuditLogTimeline logs={data || []} />
      )}
    </div>
  );
}
