import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { toast } from 'sonner';

type Role = 'USER' | 'ADMIN' | 'SUPERADMIN';

interface StoredUser {
  userId: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}

interface PreferenceState {
  emailUpdates: boolean;
  securityAlerts: boolean;
  productTips: boolean;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const PREFS_KEY = 'settingsPrefs';

export function SettingsPage() {
  const [prefs, setPrefs] = useState<PreferenceState>({
    emailUpdates: true,
    securityAlerts: true,
    productTips: false,
  });

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [requestedFields, setRequestedFields] = useState({
    firstName: true,
    lastName: true,
    email: true,
    password: false,
  });

  const [reason, setReason] = useState('');

  const user = useMemo<StoredUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const canEditDirect = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const canRequest = user?.role === 'USER';

  const queryClient = useQueryClient();

  const approvalQuery = useQuery({
    queryKey: ['profile-approval'],
    queryFn: async () => {
      const res = await api.profile.myApproval();
      return res.data?.data as { id: string; fields: string[] } | null;
    },
    enabled: canRequest,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const storedPrefs = localStorage.getItem(PREFS_KEY);
    if (storedPrefs) {
      try {
        const parsed = JSON.parse(storedPrefs) as PreferenceState;
        setPrefs({
          emailUpdates: parsed.emailUpdates ?? true,
          securityAlerts: parsed.securityAlerts ?? true,
          productTips: parsed.productTips ?? false,
        });
      } catch {
        // ignore malformed prefs
      }
    }

    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
      });
    }
  }, [user]);

  const profileUpdate = useMutation({
    mutationFn: (payload: Partial<FormState>) => api.profile.updateSelf(payload),
    onSuccess: async () => {
      try {
        const me = await api.auth.me();
        const updatedUser = me.data?.user as StoredUser | undefined;
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new CustomEvent('user-updated', { detail: updatedUser }));
          setForm((prev) => ({
            ...prev,
            firstName: updatedUser.firstName || prev.firstName,
            lastName: updatedUser.lastName || prev.lastName,
            email: updatedUser.email || prev.email,
            password: '',
          }));
        }
      } catch {
        // ignore refresh failure; toast still shown
      }
      toast.success('Profile updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Update failed'),
  });

  const requestChange = useMutation({
    mutationFn: (payload: { fields: string[]; reason?: string }) =>
      api.profile.requestChange(payload.fields, payload.reason),
    onSuccess: () => toast.success('Change request sent to admin'),
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Request failed'),
  });

  const handleToggle = (key: keyof PreferenceState) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePrefs = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    toast.success('Preferences saved');
  };

  const handleResetPrefs = () => {
    const defaults: PreferenceState = {
      emailUpdates: true,
      securityAlerts: true,
      productTips: false,
    };
    setPrefs(defaults);
    localStorage.setItem(PREFS_KEY, JSON.stringify(defaults));
    toast.success('Preferences reset');
  };

  const handleProfileSave = () => {
    if (!canEditDirect && !(approvalQuery.data?.fields?.length)) return;
    const payload: Partial<FormState> = {};
    const allowList = canEditDirect ? ['firstName', 'lastName', 'email', 'password'] : approvalQuery.data?.fields || [];
    if (allowList.includes('firstName') && form.firstName) payload.firstName = form.firstName;
    if (allowList.includes('lastName') && form.lastName) payload.lastName = form.lastName;
    if (allowList.includes('email') && form.email) payload.email = form.email;
    if (allowList.includes('password') && form.password) payload.password = form.password;
    if (Object.keys(payload).length === 0) {
      toast.error('Nothing to update');
      return;
    }
    profileUpdate.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profile-approval'] });
      },
    });
  };

  const handleRequestChange = () => {
    if (!canRequest) return;
    const fields = Object.entries(requestedFields)
      .filter(([, value]) => value)
      .map(([key]) => key);
    if (!fields.length) {
      toast.error('Select at least one field to request');
      return;
    }
    requestChange.mutate({ fields, reason: reason.trim() || undefined });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-primary-900 font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-slate-600 mt-1.5">
            Manage your account details and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetPrefs}>Reset</Button>
          <Button onClick={handleSavePrefs}>Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Account</h2>
              <p className="text-sm text-slate-500">Your profile details</p>
            </div>
            {(canEditDirect || approvalQuery.data?.fields?.length) && (
              <Button size="sm" onClick={handleProfileSave} disabled={profileUpdate.isPending}>
                {profileUpdate.isPending ? 'Saving…' : 'Save profile'}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First name</label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                disabled={!canEditDirect && !(approvalQuery.data?.fields || []).includes('firstName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last name</label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                disabled={!canEditDirect && !(approvalQuery.data?.fields || []).includes('lastName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <Input value={user?.role || '—'} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <Input
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                disabled={!canEditDirect && !(approvalQuery.data?.fields || []).includes('email')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <Input
                type="password"
                placeholder="Leave blank to keep current password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                disabled={!canEditDirect && !(approvalQuery.data?.fields || []).includes('password')}
              />
            </div>
          </div>

          {canRequest && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-900">Request changes</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'firstName', label: 'First name' },
                  { key: 'lastName', label: 'Last name' },
                  { key: 'email', label: 'Email' },
                  { key: 'password', label: 'Password' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={requestedFields[item.key as keyof typeof requestedFields]}
                      onChange={() =>
                        setRequestedFields((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key as keyof typeof requestedFields],
                        }))
                      }
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <Input
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button size="sm" onClick={handleRequestChange} disabled={requestChange.isPending}>
                {requestChange.isPending ? 'Sending…' : 'Request change'}
              </Button>
              <div className="text-xs text-slate-500">Once approved, you can apply the change once.</div>
            </div>
          )}

          {canRequest && approvalQuery.data?.fields?.length ? (
            <div className="p-3 rounded-md border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
              Approved fields: {approvalQuery.data.fields.join(', ')} — edit and save now (one-time).
            </div>
          ) : null}

          {!canEditDirect && !canRequest && (
            <div className="text-xs text-slate-500">Profile details are managed by admins.</div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-500">Choose how you stay informed</p>
          </div>
          <div className="space-y-3">
            {[{
              key: 'emailUpdates' as const,
              title: 'Proposal and client updates',
              desc: 'Get status changes, comments, and assignments via email.'
            }, {
              key: 'securityAlerts' as const,
              title: 'Security alerts',
              desc: 'Login alerts and important security notifications.'
            }, {
              key: 'productTips' as const,
              title: 'Product tips',
              desc: 'Occasional tips to use the app more effectively.'
            }].map((item) => (
              <label key={item.key} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50/40 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={prefs[item.key]}
                  onChange={() => handleToggle(item.key)}
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Data & Sessions</h2>
          <p className="text-sm text-slate-500">Manage cached preferences on this device</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Clear local preferences</div>
            <div className="text-xs text-slate-500">Removes locally stored settings on this browser.</div>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              localStorage.removeItem(PREFS_KEY);
              toast.success('Local preferences cleared');
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
