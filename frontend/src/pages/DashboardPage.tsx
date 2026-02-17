/**
 * Dashboard Page
 * Overview of key metrics and recent activity
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await api.dashboard.getSummary();
      return response.data.data;
    },
    refetchInterval: 10000,
  });

  const stats = [
    {
      name: 'Active Clients',
      value: summaryData?.activeClients ?? 0,
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      name: 'Active Proposals',
      value: summaryData?.activeProposals ?? 0,
      icon: FileText,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      name: 'No. of Devices',
      value: summaryData?.activeDevices ?? 0,
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      name: 'Total Value',
      value: formatCurrency(summaryData?.totalValue ?? 0),
      icon: DollarSign,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
  ];

  const recentProposals = summaryData?.recentProposals ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header - Enhanced */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-primary-900 font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1.5">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! Here's what's happening today.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/proposals/new')}
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          Create New Proposal
        </Button>
      </div>

      {/* Stats Grid - Enhanced with better visual hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={stat.name} 
            className="card p-6 hover:shadow-md transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-xl shadow-sm`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-xs font-semibold text-slate-500">Live</div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1 tabular-nums">
              {stat.value}
            </h3>
            <p className="text-sm text-slate-600 font-medium">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Proposals */}
        <div className="card p-6 hover:shadow-md transition-all duration-200">
          <h3 className="text-section-header text-slate-900 mb-5 font-semibold">
            Recent Proposals
          </h3>
          <div className="space-y-3">
            {recentProposals.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">
                No recent proposals. Create one to get started.
              </p>
            ) : (
              recentProposals.map((proposal: any) => (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {proposal.proposalNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {proposal.clientName || proposal.clientId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(proposal.totalAmount || 0)}
                    </p>
                    <p className="text-xs text-slate-500">{proposal.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 hover:bg-slate-50"
            onClick={() => navigate('/proposals')}
          >
            View All Proposals
          </Button>
        </div>
      </div>
    </div>
  );
}
