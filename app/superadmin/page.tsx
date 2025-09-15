'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await fetch('/api/superadmin/setup');
      const data = await response.json();
      setNeedsSetup(data.needsSetup);
      if (data.needsSetup) {
        setSetupMode(true);
      }
    } catch (error) {
      console.error('Error checking setup:', error);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/superadmin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      alert('Super admin created successfully! You can now login.');
      setSetupMode(false);
      setNeedsSetup(false);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and admin data
      localStorage.setItem('superAdminToken', data.token);
      localStorage.setItem('superAdminData', JSON.stringify(data.admin));

      // Redirect to dashboard
      router.push('/superadmin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Super Admin {setupMode ? 'Setup' : 'Access'}
          </h1>
          <p className="text-gray-600">
            {setupMode
              ? 'Create your super admin account'
              : 'Restricted area - Authorized personnel only'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={setupMode ? handleSetup : handleLogin} className="space-y-6">
          {setupMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00bcd4] focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00bcd4] focus:border-transparent"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00bcd4] focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={setupMode ? 8 : undefined}
            />
            {setupMode && (
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00bcd4] hover:bg-[#00acc1] text-gray-800 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (setupMode ? 'Create Super Admin' : 'Access Dashboard')}
          </button>
        </form>

        {!setupMode && needsSetup && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setSetupMode(true)}
              className="text-[#00bcd4] hover:text-[#00acc1] text-sm"
            >
              Need to set up super admin? Click here
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            <span className="text-gray-500 text-sm">🔒 Secure Access</span>
            <span className="text-gray-500 text-sm">🛡️ Protected Area</span>
          </div>
        </div>
      </div>
    </div>
  );
}