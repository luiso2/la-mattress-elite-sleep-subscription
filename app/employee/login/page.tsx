'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmployeeLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('admin123'); // Default password for all employees
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/employee/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data); // Debug log

      if (response.ok && data.success) {
        // Save token and employee info - FIXED: accessing correct properties
        localStorage.setItem('employeeToken', data.token);
        localStorage.setItem('employeeName', data.employee.name);
        
        console.log('Token saved:', data.token);
        console.log('Employee name saved:', data.employee.name);
        
        // Redirect to employee dashboard
        router.push('/employee/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple White Header */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="LA Mattress" 
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const textLogo = document.createElement('div');
                  textLogo.className = 'text-xl font-bold text-[#1e40af]';
                  textLogo.textContent = 'LA MATTRESS';
                  e.currentTarget.parentElement?.appendChild(textLogo);
                }}
              />
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm">
              Back to Main Site →
            </Link>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Employee Badge */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-[#1e40af] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-4">
                Employee Access
              </div>
              <h1 className="text-3xl font-bold text-[#1e40af] mb-2">
                Store Staff Login
              </h1>
              <p className="text-gray-600">
                Access the Elite Sleep+ credit management system
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Employee Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your employee email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                />
              </div>

              {/* Password field is hidden - all employees use 'admin123' */}
              <input
                type="hidden"
                id="password"
                value={password}
                readOnly
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e40af] text-white py-3 rounded-lg hover:bg-[#1e40af]/90 transition-colors font-bold text-lg disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Authorized access only. All activities are logged for security purposes.
              </p>
              <p className="text-center text-xs text-gray-400 mt-2">
                Contact IT support if you need assistance with your credentials.
              </p>
            </div>
          </div>

          {/* Test Credentials for Development - Hidden */}
          {false && process.env.NODE_ENV === 'development' && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">Test Credentials:</p>
              <p className="text-xs text-yellow-700">Email: lbencomo94@gmail.com</p>
              <p className="text-xs text-yellow-700">Password: admin123 (auto-filled)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}