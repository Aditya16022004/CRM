/**
 * App Layout with Sidebar Navigation
 * Implements the Deep Indigo sidebar with white content area
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  History,
  Settings,
  LogOut,
  Bell,
  Search,
  Shield,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import type { User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'History', href: '/history', icon: Clock },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Device List', href: '/devices', icon: Package },
  { name: 'Audit Logs', href: '/audit', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<
    { type: 'client' | 'proposal' | 'device'; id: string; label: string; subLabel?: string }[]
  >([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(true);
  const pulseTimeout = useRef<number | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasNotificationPulse, setHasNotificationPulse] = useState(false);

  const initials = useMemo(() => {
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  }, [user]);

  type Notification = {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'REQUEST' | 'ACTION';
    entity?: string;
    recordId?: string;
    createdAt: string;
    read: boolean;
    meta?: { fields?: string[]; [key: string]: unknown };
  };

  const navigation = useMemo(() => {
    const items = [...baseNavigation];
    if (user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN')) {
      items.splice(4, 0, {
        name: 'User Admin',
        href: '/admin/users',
        icon: Shield,
      });
    }
    return items;
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    api.auth
      .me()
      .then((response) => {
        if (response.data?.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setUser(response.data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        navigate('/login');
      });
  }, [navigate]);

  // Keep user in sync when profile updates fire elsewhere
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<User>;
      if (custom.detail) {
        setUser(custom.detail);
      } else {
        const fresh = localStorage.getItem('user');
        if (fresh) setUser(JSON.parse(fresh));
      }
    };
    window.addEventListener('user-updated', handler as EventListener);
    return () => window.removeEventListener('user-updated', handler as EventListener);
  }, []);

  // Close notifications when clicking outside the bell/panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!notificationsOpen) return;
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  useEffect(() => {
    if (!user) return undefined;
    const token = localStorage.getItem('accessToken');
    if (!token) return undefined;

    shouldReconnect.current = true;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '/ws');

    const clearReconnectTimeout = () => {
      if (reconnectTimeout.current) {
        window.clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!shouldReconnect.current) return;
      reconnectAttempts.current += 1;
      const delay = Math.min(30000, 1000 * 2 ** reconnectAttempts.current);
      clearReconnectTimeout();
      reconnectTimeout.current = window.setTimeout(connect, delay);
    };

    const connect = () => {
      if (!shouldReconnect.current) return;
      // Send token via subprotocol to keep it out of the URL
      const socket = new WebSocket(wsUrl, token);
      wsRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        clearReconnectTimeout();
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed?.type === 'notification' && parsed.data) {
            const incoming = parsed.data as Notification;
            queryClient.setQueryData<{ data: Notification[] }>(['notifications'], (prev) => {
              const list = prev?.data || [];
              return { data: [incoming, ...list] };
            });

            if (incoming.entity === 'ProfileRequest') {
              queryClient.invalidateQueries({ queryKey: ['profile-requests'] });
            }

            setHasNotificationPulse(true);
            if (pulseTimeout.current) window.clearTimeout(pulseTimeout.current);
            pulseTimeout.current = window.setTimeout(() => setHasNotificationPulse(false), 1600);

            toast(incoming.title || 'New notification', {
              description: incoming.message,
              duration: 4000,
            });
          }
        } catch (err) {
          console.error('WebSocket message parse error', err);
        }
      };

      socket.onclose = () => {
        wsRef.current = null;
        scheduleReconnect();
      };

      socket.onerror = () => {
        wsRef.current = null;
        socket.close();
      };
    };

    connect();

    return () => {
      shouldReconnect.current = false;
      clearReconnectTimeout();
      if (pulseTimeout.current) {
        window.clearTimeout(pulseTimeout.current);
        pulseTimeout.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [queryClient, user]);

  type ProfileRequest = {
    id: string;
    requesterId: string;
    requesterRole: 'USER' | 'ADMIN' | 'SUPERADMIN';
    fields: string[];
    reason?: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'USED';
    createdAt: string;
  };

  const isApprover = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const notificationsQuery = useQuery<{ data: Notification[] }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.notifications.list();
      return res.data;
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const requestsQuery = useQuery<{ data: ProfileRequest[] }>({
    queryKey: ['profile-requests'],
    queryFn: async () => {
      const res = await api.profile.listRequests();
      return res.data;
    },
    enabled: !!user && isApprover,
    refetchOnWindowFocus: false,
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.notifications.markRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => api.notifications.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const decideRequestMutation = useMutation({
    mutationFn: (payload: { id: string; action: 'APPROVE' | 'DENY' }) =>
      api.profile.decideRequest(payload.id, payload.action),
    onSuccess: () => {
      toast.success('Request updated');
      queryClient.invalidateQueries({ queryKey: ['profile-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Action failed'),
  });

  const unreadCount = (notificationsQuery.data?.data || []).filter((n) => !n.read).length;

  const handleToggleNotifications = () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next) {
      notificationsQuery.refetch();
      if (isApprover) requestsQuery.refetch();
    }
  };

  useEffect(() => {
    if (searchTimeout.current) {
      window.clearTimeout(searchTimeout.current);
    }

    const query = searchTerm.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = window.setTimeout(async () => {
      try {
        const [clientsRes, proposalsRes, devicesRes] = await Promise.all([
          api.clients.getAll(),
          api.proposals.getAll(),
          api.devices.getAll(),
        ]);

        const clients = clientsRes.data.data || [];
        const proposals = proposalsRes.data.data || [];
        const devices = devicesRes.data.data || [];

        const lowered = query.toLowerCase();

        const clientResults = clients
          .filter((c: any) => c.companyName?.toLowerCase().includes(lowered))
          .slice(0, 5)
          .map((c: any) => ({
            type: 'client' as const,
            id: c.id,
            label: c.companyName,
            subLabel: 'Client',
          }));

        const proposalResults = proposals
          .filter((p: any) => p.proposalNumber?.toLowerCase().includes(lowered))
          .slice(0, 5)
          .map((p: any) => ({
            type: 'proposal' as const,
            id: p.id,
            label: p.proposalNumber,
            subLabel: 'Proposal',
          }));

        const deviceResults = devices
          .filter((d: any) => d.name?.toLowerCase().includes(lowered))
          .slice(0, 5)
          .map((d: any) => ({
            type: 'device' as const,
            id: d.id,
            label: d.name,
            subLabel: 'Device',
          }));

        const combined = [...clientResults, ...proposalResults, ...deviceResults];
        setSearchResults(combined);
        setSearchOpen(combined.length > 0);
      } catch {
        setSearchResults([]);
        setSearchOpen(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        window.clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  const handleResultClick = (result: {
    type: 'client' | 'proposal' | 'device';
    id: string;
  }) => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchOpen(false);

    if (result.type === 'client') {
      navigate(`/clients?view=${result.id}`);
      return;
    }
    if (result.type === 'proposal') {
      navigate(`/proposals?view=${result.id}`);
      return;
    }
    navigate(`/devices?edit=${result.id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Enhanced with better spacing and visual polish */}
      <aside className="w-[260px] bg-primary-900 text-white flex-shrink-0 shadow-lg">
        <div className="h-full flex flex-col">
          {/* Logo - Enhanced */}
          <div className="px-6 py-6 border-b border-primary-800/50">
            <h1 className="text-xl font-bold tracking-tight">IT Proposal CRM</h1>
            <p className="text-xs text-primary-200/80 mt-1.5 font-medium">
              Hardware & Services
            </p>
          </div>

          {/* Navigation - Enhanced with better hover states */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-sidebar">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    'group relative',
                    isActive
                      ? 'bg-white/10 text-white shadow-sm border-l-4 border-primary-400 pl-2.5'
                      : 'text-white/70 hover:bg-white/5 hover:text-white hover:translate-x-0.5'
                  )
                }
              >
                <item.icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  'group-hover:scale-110'
                )} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile - Enhanced */}
          <div className="p-4 border-t border-primary-800/50 bg-primary-950/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-semibold shadow-md ring-2 ring-primary-500/20">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </p>
                <p className="text-xs text-primary-200/70 truncate">
                  {user?.role || 'User'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Enhanced */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 gap-4 shadow-sm">
          {/* Global Search - Enhanced */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search for devices, proposals, or clients..."
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setSearchOpen(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setSearchOpen(false), 150);
                }}
              />
              {searchOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                          onMouseDown={() => handleResultClick(result)}
                        >
                          <div className="text-sm font-semibold text-slate-900">
                            {result.label}
                          </div>
                          {result.subLabel && (
                            <div className="text-xs text-slate-500">{result.subLabel}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 hover:bg-slate-100 transition-colors"
                onClick={handleToggleNotifications}
              >
                <Bell className="h-5 w-5 text-slate-600" />
                {unreadCount > 0 && (
                  <>
                    {hasNotificationPulse && (
                      <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-danger-200 opacity-75 animate-ping" />
                    )}
                    <span className="absolute top-2 right-2 min-w-[0.75rem] px-1 h-4 rounded-full bg-danger-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
                      {Math.min(unreadCount, 9)}
                    </span>
                  </>
                )}
              </Button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Notifications</div>
                      <div className="text-xs text-slate-500">Last 24 hours</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => markReadMutation.mutate()}
                        disabled={markReadMutation.isPending}
                      >
                        Mark read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => clearMutation.mutate()}
                        disabled={clearMutation.isPending}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {(notificationsQuery.data?.data || []).length === 0 ? (
                      <div className="px-4 py-6 text-sm text-slate-500 text-center">No notifications</div>
                    ) : (
                      (notificationsQuery.data?.data || []).map((n) => (
                        <div key={n.id} className={cn('px-4 py-3 space-y-1', !n.read ? 'bg-primary-50/50' : '')}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                            <div className="text-[11px] text-slate-500">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          <div className="text-sm text-slate-700">{n.message}</div>
                          {n.entity === 'ProfileRequest' && Array.isArray(n.meta?.fields) && (
                            <div className="text-xs text-slate-500">Fields: {n.meta.fields.join(', ')}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {isApprover && (
                    <div className="border-t border-slate-200">
                      <div className="px-4 py-3 text-sm font-semibold text-slate-900">Profile requests</div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {(requestsQuery.data?.data || []).length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-500">No pending requests</div>
                        ) : (
                          (requestsQuery.data?.data || []).map((req) => (
                            <div key={req.id} className="px-4 py-3 space-y-1">
                              <div className="text-sm font-semibold text-slate-900">{req.requesterRole} request</div>
                              <div className="text-xs text-slate-600">Fields: {req.fields.join(', ')}</div>
                              {req.reason && (
                                <div className="text-xs text-slate-500">Reason: {req.reason}</div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => decideRequestMutation.mutate({ id: req.id, action: 'APPROVE' })}
                                  disabled={decideRequestMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-danger-600 hover:text-danger-700"
                                  onClick={() => decideRequestMutation.mutate({ id: req.id, action: 'DENY' })}
                                  disabled={decideRequestMutation.isPending}
                                >
                                  Deny
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content - Enhanced spacing */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
