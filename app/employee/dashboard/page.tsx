'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProtectorReplacement {
  number: number;
  used: boolean;
  date: string | null;
}

interface CustomerData {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  credits: {
    total: number;
    used: number;
    reserved: number;
    available: number;
  };
  protectorReplacements?: {
    total: number;
    used: number;
    available: number;
    protectors: ProtectorReplacement[];
  };
  lastTransaction?: {
    amount: number;
    date: string;
    employee: string;
  };
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('employeeToken');
    const name = localStorage.getItem('employeeName');
    
    if (!token) {
      router.push('/employee/login');
      return;
    }
    
    setEmployeeName(name || 'Employee');
  }, [router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setCustomerData(null);

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/employee/customer-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: searchEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCustomerData(data.data);
      } else {
        setError(data.error || 'Customer not found');
      }
    } catch (err) {
      setError('Failed to search customer');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCredit = async () => {
    if (!customerData || !customerData.credits.reserved) {
      return;
    }

    setConfirmLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/employee/confirm-credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          customerId: customerData.customer.id,
          amount: customerData.credits.reserved,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh customer data
        await handleSearch(new Event('submit') as any);
        alert(`Successfully confirmed $${customerData.credits.reserved} credit usage!`);
      } else {
        setError(data.error || 'Failed to confirm credit');
      }
    } catch (err) {
      setError('Failed to confirm credit usage');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeName');
    router.push('/employee/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* White Header with Logo */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center mr-8">
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
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-gray-500 text-sm">Employee Portal</span>
                <span className="text-gray-400">•</span>
                <span className="text-[#1e40af] font-semibold text-sm">{employeeName}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="hidden md:block text-gray-600 hover:text-gray-800 text-sm transition-colors"
              >
                Main Site
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Title Bar */}
      <div className="bg-[#1e40af] text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Credit Management System</h1>
          <p className="text-white/80 text-sm mt-1">Search and manage customer Elite Sleep+ credits</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-[#00bcd4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Customer Credit Lookup
          </h2>
          
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="email"
              placeholder="Enter customer email address"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4] focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#00bcd4] text-white rounded-lg hover:bg-[#00bcd4]/90 transition-colors disabled:opacity-50 font-semibold"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Customer Data Section */}
        {customerData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{customerData.customer.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold">{customerData.customer.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Customer ID:</span>
                  <span className="font-mono text-sm">{customerData.customer.id}</span>
                </div>
              </div>
            </div>

            {/* Credit Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Credit Balance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total Earned:</span>
                  <span className="font-semibold">${customerData.credits.total}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Already Used:</span>
                  <span className="font-semibold text-red-600">-${customerData.credits.used}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Reserved for Use:</span>
                  <span className="font-semibold text-orange-600">${customerData.credits.reserved}</span>
                </div>
                <div className="flex justify-between py-3 bg-green-50 px-3 rounded">
                  <span className="text-gray-700 font-medium">Available:</span>
                  <span className="font-bold text-green-600 text-xl">${customerData.credits.available}</span>
                </div>
              </div>
            </div>

            {/* Credit Confirmation Section */}
            {customerData.credits.reserved > 0 && (
              <div className="lg:col-span-2 bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-orange-700 mb-4">⚠️ Pending Credit Usage</h3>
                <div className="bg-white rounded-lg p-6 mb-4">
                  <p className="text-gray-700 mb-4">
                    Customer has <span className="font-bold text-orange-600">${customerData.credits.reserved}</span> reserved 
                    for in-store purchase.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Only confirm after the customer has completed their purchase.
                    </p>
                  </div>
                  <button
                    onClick={handleConfirmCredit}
                    disabled={confirmLoading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
                  >
                    {confirmLoading ? 'Processing...' : `Confirm $${customerData.credits.reserved} Credit Usage`}
                  </button>
                </div>
              </div>
            )}

            {/* Mattress Protector Replacements */}
            {customerData.protectorReplacements && (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Mattress Protector Replacements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {customerData.protectorReplacements.protectors.map((protector) => (
                    <div key={protector.number} className="border rounded-lg p-3">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Protector #{protector.number}
                      </div>
                      {protector.used ? (
                        <div>
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            Used
                          </span>
                          {protector.date && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(protector.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Available
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Used:</span>
                    <span className="font-semibold">{customerData.protectorReplacements.used} of {customerData.protectorReplacements.total}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-semibold text-green-600">{customerData.protectorReplacements.available}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Last Transaction */}
            {customerData.lastTransaction && (
              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-700 mb-3">Last Transaction</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600">
                      Amount: <span className="font-semibold">${customerData.lastTransaction.amount}</span>
                    </p>
                    <p className="text-gray-600">
                      Date: <span className="font-semibold">{new Date(customerData.lastTransaction.date).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">
                      Processed by: <span className="font-semibold">{customerData.lastTransaction.employee}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!customerData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-3">📋 Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Enter the customer's email address in the search box above</li>
              <li>Review the customer's available credit balance</li>
              <li>If customer has reserved credit, confirm usage after purchase completion</li>
              <li>All transactions are logged for audit purposes</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}