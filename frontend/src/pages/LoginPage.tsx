/**
 * Login Page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response =
        loginMode === 'admin'
          ? await api.auth.adminLogin(email, password)
          : await api.auth.login(email, password);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary-900">IT Proposal CRM</h1>
          <p className="text-slate-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              className={
                loginMode === 'user'
                  ? 'flex-1 h-10 rounded-lg bg-primary-600 text-white text-sm font-semibold'
                  : 'flex-1 h-10 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold'
              }
              onClick={() => setLoginMode('user')}
            >
              User Login
            </button>
            <button
              type="button"
              className={
                loginMode === 'admin'
                  ? 'flex-1 h-10 rounded-lg bg-primary-600 text-white text-sm font-semibold'
                  : 'flex-1 h-10 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold'
              }
              onClick={() => setLoginMode('admin')}
            >
              Admin Login
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-sm text-center text-slate-600 mt-4">
          Access is granted by an admin. Contact your administrator if you need an account.
        </p>

      </div>
    </div>
  );
}
