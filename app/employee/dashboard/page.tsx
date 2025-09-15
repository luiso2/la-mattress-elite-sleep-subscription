'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CouponList from '@/components/coupons/CouponList';
import CouponForm from '@/components/coupons/CouponForm';
import CouponStats from '@/components/coupons/CouponStats';

interface ProtectorReplacement {
  number: number;
  used: boolean;
  date: string | null;
}

interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  description: string;
  status: string;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  currentUses: number;
  maxUses: number | null;
  minimumPurchase: number | null;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
}

interface CashbackTransaction {
  id: string;
  date: string;
  amount: number;
  cashback: number;
  description: string;
  employee: string;
  employeeEmail: string;
  type: 'earned' | 'used';
}

interface CustomerData {
  email: string;
  searchedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  credits?: {
    total: number;
    used: number;
    reserved: number;
    available: number;
  };
  cashback?: {
    balance: number;
    history: CashbackTransaction[];
    lastUpdate?: string;
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
  coupons?: Coupon[];
  stripeDataError?: string;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState('');
  const [cashbackDescription, setCashbackDescription] = useState('');
  const [cashbackLoading, setCashbackLoading] = useState(false);
  const [showUseCashbackModal, setShowUseCashbackModal] = useState(false);
  const [useCashbackAmount, setUseCashbackAmount] = useState('');
  const [useCashbackDescription, setUseCashbackDescription] = useState('');
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponStats, setCouponStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('employeeToken');
    const name = localStorage.getItem('employeeName');

    if (!token || !name) {
      router.push('/employee/login');
      return;
    }

    setEmployeeName(name);
    fetchCouponStats();
  }, [router]);

  const fetchCouponStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/coupons/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCouponStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch coupon stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/employee/customer-search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: searchEmail.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // The actual data is in result.data
        const data = result.data;
        setCustomerData(data);
        // Set coupons from the response directly and normalize the data
        if (data.coupons && data.coupons.coupons) {
          const normalizedCoupons = data.coupons.coupons.map((coupon: any) => ({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discount_type || coupon.discountType,
            discountValue: parseFloat(coupon.discount_value || coupon.discountValue || 0),
            description: coupon.description,
            status: coupon.status,
            validFrom: coupon.valid_from || coupon.validFrom,
            validUntil: coupon.valid_until || coupon.validUntil,
            currentUses: coupon.current_uses || coupon.currentUses || 0,
            maxUses: coupon.max_uses || coupon.maxUses || null,
            minimumPurchase: parseFloat(coupon.minimum_purchase || coupon.minimumPurchase || 0),
            customer: coupon.customer
          }));
          setCoupons(normalizedCoupons);
        } else {
          setCoupons([]);
        }
      } else {
        setError(result.error || 'Customer not found');
        setCustomerData(null);
        setCoupons([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search customer');
      setCustomerData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerCoupons = async (email: string) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`/api/coupons?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Failed to fetch customer coupons:', error);
    }
  };

  const handleConfirmCredit = async () => {
    if (!customerData?.credits) return;

    setConfirmLoading(true);
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/employee/confirm-credit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: customerData.email,
          creditAmount: customerData.credits.reserved
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Credit confirmed successfully!');
        handleSearch(new Event('submit') as any);
      } else {
        setError(data.error || 'Failed to confirm credit');
      }
    } catch (error) {
      console.error('Confirm credit error:', error);
      setError('Failed to confirm credit');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleAddCashback = async () => {
    const purchaseAmount = parseFloat(cashbackAmount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      setError('Please enter a valid purchase amount');
      return;
    }

    // Calculate 10% cashback
    const cashbackEarned = parseFloat((purchaseAmount * 0.10).toFixed(2));

    setCashbackLoading(true);
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/employee/cashback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: customerData?.email,
          amount: cashbackEarned, // Send the calculated cashback amount
          description: `${cashbackDescription} - Purchase: $${purchaseAmount}`,
          type: 'earned'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Purchase added! Customer earned $${cashbackEarned} cashback (10% of $${purchaseAmount})`);
        setShowCashbackModal(false);
        setCashbackAmount('');
        setCashbackDescription('');
        handleSearch(new Event('submit') as any);
      } else {
        setError(data.error || 'Failed to add purchase');
      }
    } catch (error) {
      console.error('Add purchase error:', error);
      setError('Failed to add purchase');
    } finally {
      setCashbackLoading(false);
    }
  };

  const handleUseCashback = async () => {
    const amount = parseFloat(useCashbackAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (customerData?.cashback && amount > customerData.cashback.balance) {
      setError('Amount exceeds available balance');
      return;
    }

    setCashbackLoading(true);
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/employee/cashback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: customerData?.email,
          amount,
          description: useCashbackDescription || 'Cashback redemption',
          type: 'used'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Cashback used successfully!');
        setShowUseCashbackModal(false);
        setUseCashbackAmount('');
        setUseCashbackDescription('');
        handleSearch(new Event('submit') as any);
      } else {
        setError(data.error || 'Failed to use cashback');
      }
    } catch (error) {
      console.error('Use cashback error:', error);
      setError('Failed to use cashback');
    } finally {
      setCashbackLoading(false);
    }
  };

  const handleCreateCoupon = async (formData: any) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Coupon created successfully!');
        setShowCouponForm(false);
        fetchCustomerCoupons(formData.customerEmail);
        fetchCouponStats();
      } else {
        throw new Error(data.error || 'Failed to create coupon');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleMarkCouponUsed = async (couponId: number) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/employee/coupon-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_used',
          couponId: couponId.toString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Coupon marked as used!');
        if (customerData?.customer) {
          fetchCustomerCoupons(customerData.customer.email);
        }
        fetchCouponStats();
      } else {
        setError(data.error || 'Failed to mark coupon as used');
      }
    } catch (error) {
      console.error('Mark coupon used error:', error);
      setError('Failed to mark coupon as used');
    }
  };

  const handleDeleteCoupon = async (couponId: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('/api/employee/coupon-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          couponId: couponId.toString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Coupon deleted successfully!');
        if (customerData?.customer) {
          fetchCustomerCoupons(customerData.customer.email);
        }
        fetchCouponStats();
      } else {
        setError(data.error || 'Failed to delete coupon');
      }
    } catch (error) {
      console.error('Delete coupon error:', error);
      setError('Failed to delete coupon');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeName');
    router.push('/employee/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center mr-8">
                <img
                  src="/logo.png"
                  alt="LA Mattress"
                  className="h-10 mr-3"
                />
                <span className="text-xl font-bold text-[#1e40af]">Employee Portal</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {employeeName}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Coupon Statistics */}
        <div className="mb-8">
          <CouponStats stats={couponStats || {
            totalCoupons: 0,
            activeCoupons: 0,
            usedCoupons: 0,
            expiredCoupons: 0,
            totalDiscountGiven: 0
          }} loading={statsLoading} />
        </div>

        {/* Customer Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-[#1e40af] mb-4">Customer Search</h2>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter customer email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00bcd4]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#00bcd4] text-white rounded-lg hover:bg-[#00acc1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Customer Information */}
        {customerData && (
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-[#1e40af] mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-semibold">{customerData.customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-semibold">{customerData.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Customer ID</p>
                  <p className="font-semibold">{customerData.customer?.id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Search</p>
                  <p className="font-semibold">{new Date(customerData.searchedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Credits Section */}
            {customerData.credits && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-[#1e40af] mb-4">Store Credits</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">${customerData.credits.total}</p>
                    <p className="text-gray-600">Total</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">${customerData.credits.available}</p>
                    <p className="text-gray-600">Available</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded">
                    <p className="text-2xl font-bold text-yellow-600">${customerData.credits.reserved}</p>
                    <p className="text-gray-600">Reserved</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-600">${customerData.credits.used}</p>
                    <p className="text-gray-600">Used</p>
                  </div>
                </div>
                {customerData.credits.reserved > 0 && (
                  <button
                    onClick={handleConfirmCredit}
                    disabled={confirmLoading}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {confirmLoading ? 'Confirming...' : `Confirm Reserved Credit ($${customerData.credits.reserved})`}
                  </button>
                )}
              </div>
            )}

            {/* Cashback Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-[#1e40af]">Cashback</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCashbackModal(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Add Purchase
                    </button>
                    <button
                      onClick={() => setShowUseCashbackModal(true)}
                      disabled={!customerData.cashback || customerData.cashback.balance <= 0}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Use Cashback
                    </button>
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg mb-4">
                  <p className="text-3xl font-bold text-green-600">${(customerData.cashback?.balance || 0).toFixed(2)}</p>
                  <p className="text-gray-600">Current Balance</p>
                </div>

                {/* Transaction History */}
                {customerData.cashback?.history && customerData.cashback.history.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Recent Transactions</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {customerData.cashback.history.map((transaction) => (
                        <div key={transaction.id} className={`p-3 rounded ${transaction.type === 'earned' ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{transaction.description}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(transaction.date).toLocaleDateString()} - {transaction.employee}
                              </p>
                            </div>
                            <p className={`font-bold ${transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'earned' ? '+' : '-'}${transaction.cashback.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p>No cashback transactions yet</p>
                    <p className="text-sm">Add a purchase to start earning cashback!</p>
                  </div>
                )}
            </div>

            {/* Coupons Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1e40af]">Customer Coupons</h3>
                <button
                  onClick={() => setShowCouponForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Create New Coupon
                </button>
              </div>

              <CouponList
                coupons={coupons}
                showActions={true}
                onMarkUsed={handleMarkCouponUsed}
                onDelete={handleDeleteCoupon}
                emptyMessage="No coupons found for this customer"
              />
            </div>

            {/* Protector Replacements */}
            {customerData.protectorReplacements && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-[#1e40af] mb-4">Protector Replacements</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">{customerData.protectorReplacements.total}</p>
                    <p className="text-gray-600">Total</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">{customerData.protectorReplacements.available}</p>
                    <p className="text-gray-600">Available</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-600">{customerData.protectorReplacements.used}</p>
                    <p className="text-gray-600">Used</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {customerData.protectorReplacements.protectors.map((protector) => (
                    <div
                      key={protector.number}
                      className={`p-3 rounded text-center ${
                        protector.used
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-green-50 text-green-700 font-semibold'
                      }`}
                    >
                      <p>Protector #{protector.number}</p>
                      {protector.used && protector.date && (
                        <p className="text-xs">Used: {new Date(protector.date).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Purchase Modal */}
        {showCashbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add Purchase</h3>
              <p className="text-sm text-gray-600 mb-4">Enter the customer's purchase amount. 10% cashback will be automatically calculated and added.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashbackAmount}
                    onChange={(e) => setCashbackAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100.00"
                  />
                  {cashbackAmount && !isNaN(parseFloat(cashbackAmount)) && (
                    <p className="text-sm text-green-600 mt-1">
                      Cashback: ${(parseFloat(cashbackAmount) * 0.10).toFixed(2)} (10%)
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={cashbackDescription}
                    onChange={(e) => setCashbackDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mattress purchase"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCashback}
                    disabled={cashbackLoading}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {cashbackLoading ? 'Adding...' : 'Add Purchase'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCashbackModal(false);
                      setCashbackAmount('');
                      setCashbackDescription('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Use Cashback Modal */}
        {showUseCashbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Use Cashback</h3>
              <p className="text-sm text-gray-600 mb-4">
                Available Balance: ${customerData?.cashback?.balance.toFixed(2)}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={useCashbackAmount}
                    onChange={(e) => setUseCashbackAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    max={customerData?.cashback?.balance}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={useCashbackDescription}
                    onChange={(e) => setUseCashbackDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Purchase with cashback"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUseCashback}
                    disabled={cashbackLoading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {cashbackLoading ? 'Processing...' : 'Use Cashback'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUseCashbackModal(false);
                      setUseCashbackAmount('');
                      setUseCashbackDescription('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Coupon Modal */}
        {showCouponForm && customerData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CouponForm
                onSubmit={handleCreateCoupon}
                onCancel={() => setShowCouponForm(false)}
                customerEmail={customerData.customer?.email || customerData.email}
                customerName={customerData.customer?.name || ''}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}