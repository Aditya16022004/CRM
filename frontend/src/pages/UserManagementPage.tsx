import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import type { User } from '@/types';

type ManagedUser = User & { source: 'users' | 'admins' };

type CreateUserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
};

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const currentUser = useMemo<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const isSuperadmin = currentUser?.role === 'SUPERADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperadmin;

  const [form, setForm] = useState<CreateUserForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'USER',
  });

  const { data: usersData, isLoading } = useQuery<ManagedUser[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.users.list();
      return response.data.data || [];
    },
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserForm) => api.users.create(payload),
    onSuccess: () => {
      toast.success('User created');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'USER' });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: () => {
      toast.success('User removed');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to remove user');
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (id: string) => api.users.promote(id),
    onSuccess: () => {
      toast.success('User promoted to admin');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to promote user');
    },
  });

  const demoteMutation = useMutation({
    mutationFn: (id: string) => api.users.demote(id),
    onSuccess: () => {
      toast.success('Admin demoted to user');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to demote admin');
    },
  });

  if (!isAdmin) {
    return (
      <div className="card p-6">
        <h1 className="text-lg font-semibold text-slate-900">Access restricted</h1>
        <p className="text-sm text-slate-600 mt-1">Only admins can manage user accounts.</p>
      </div>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      role: isSuperadmin ? form.role : 'USER',
    });
  };

  const canDelete = (user: ManagedUser) => {
    if (user.role === 'SUPERADMIN') return false;
    if (user.role === 'ADMIN' && !isSuperadmin) return false;
    return true;
  };

  const canPromote = (user: ManagedUser) => isSuperadmin && user.source === 'users' && user.role === 'USER';
  const canDemote = (user: ManagedUser) => isSuperadmin && user.role === 'ADMIN';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">User Administration</p>
          <h1 className="text-page-title text-primary-900 font-semibold tracking-tight">Manage Users</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-primary-900">Add User</h2>
              <p className="text-sm text-slate-500">Admins create accounts; no public signup.</p>
            </div>
          </div>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                required
              />
              <Input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <Input
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            {isSuperadmin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' }))}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-primary-900">Accounts</h2>
            </div>
            <p className="text-xs text-slate-500">Admins can manage users; only superadmin can promote/demote admins.</p>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-600">Loading users...</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData?.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium text-slate-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">{user.email}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                          <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          {canPromote(user) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => promoteMutation.mutate(user.id)}
                              disabled={promoteMutation.isPending}
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-1" /> Promote
                            </Button>
                          )}
                          {canDemote(user) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => demoteMutation.mutate(user.id)}
                              disabled={demoteMutation.isPending}
                            >
                              <ArrowDownCircle className="h-4 w-4 mr-1" /> Demote
                            </Button>
                          )}
                          {canDelete(user) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-danger-600 hover:text-danger-700"
                              onClick={() => deleteMutation.mutate(user.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usersData?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
