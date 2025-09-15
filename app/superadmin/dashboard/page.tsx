'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CouponList from '@/components/coupons/CouponList';
import CouponForm from '@/components/coupons/CouponForm';

interface DashboardStats {
  totalUsers: number;
  totalEmployees: number;
  totalCustomers: number;
  totalCoupons: number;
  activeCoupons: number;
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  recentActivity: any[];
}


interface Employee {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}


interface Coupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  description?: string;
  validUntil: string;
  status: 'active' | 'expired' | 'used' | 'cancelled';
  minimumPurchase?: number;
  currentUses: number;
  maxUses?: number;
}

interface ProtectorReplacement {
  number: number;
  used: boolean;
  date: string | null;
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

interface CustomerSearchData {
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

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [adminData, setAdminData] = useState<any>(null);

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Loading states for each tab
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);

  // Modal states
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<string>('');

  // Employee sync states
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Customer search functionality states
  const [searchEmail, setSearchEmail] = useState('');
  const [customerSearchData, setCustomerSearchData] = useState<CustomerSearchData | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState('');
  const [cashbackDescription, setCashbackDescription] = useState('');
  const [cashbackLoading, setCashbackLoading] = useState(false);
  const [showUseCashbackModal, setShowUseCashbackModal] = useState(false);
  const [useCashbackAmount, setUseCashbackAmount] = useState('');
  const [useCashbackDescription, setUseCashbackDescription] = useState('');
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [customerCoupons, setCustomerCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('superAdminToken');
    const admin = localStorage.getItem('superAdminData');

    if (!token) {
      router.push('/superadmin');
      return;
    }

    if (admin) {
      setAdminData(JSON.parse(admin));
    }

    fetchDashboardStats(token);
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('superAdminToken');
    if (!token) return;

    // Load data based on active tab
    switch (activeTab) {
      case 'employees':
        fetchEmployees(token);
        break;
      case 'coupons':
        fetchCoupons(token);
        break;
    }
  }, [activeTab]);

  const fetchDashboardStats = async (token: string) => {
    try {
      const response = await fetch('/api/superadmin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('superAdminToken');
          localStorage.removeItem('superAdminData');
          router.push('/superadmin');
          return;
        }
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchEmployees = async (token: string) => {
    setEmployeesLoading(true);
    try {
      const response = await fetch('/api/superadmin/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setEmployeesLoading(false);
    }
  };


  const fetchCoupons = async (token: string) => {
    setCouponsLoading(true);
    try {
      const response = await fetch('/api/superadmin/coupons', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem('superAdminToken');

    try {
      const response = await fetch('/api/superadmin/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.get('email'),
          name: formData.get('name'),
          password: formData.get('password')
        })
      });

      if (response.ok) {
        setShowAddEmployeeModal(false);
        fetchEmployees(token!);
        // Update stats
        if (stats) {
          setStats({ ...stats, totalEmployees: stats.totalEmployees + 1 });
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add employee');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Failed to add employee');
    }
  };

  const handleToggleEmployeeStatus = async (employeeId: number, currentStatus: boolean) => {
    const token = localStorage.getItem('superAdminToken');

    try {
      const response = await fetch(`/api/superadmin/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchEmployees(token!);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };


  const handleDeleteEmployee = async (employeeId: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    const token = localStorage.getItem('superAdminToken');

    try {
      const response = await fetch(`/api/superadmin/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchEmployees(token!);
        if (stats) {
          setStats({ ...stats, totalEmployees: stats.totalEmployees - 1 });
        }
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleEditEmployee = (employee: any) => {
    setEditingItem(employee);
    setEditingType('employee');
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem('superAdminToken');

    try {
      const updateData: any = {
        name: formData.get('name'),
        email: formData.get('email')
      };

      // Only include password if it's provided
      const password = formData.get('password') as string;
      if (password && password.trim() !== '') {
        updateData.password = password;
      }

      const response = await fetch(`/api/superadmin/employees/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingItem(null);
        setEditingType('');
        fetchEmployees(token!);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee');
    }
  };

  const handleSyncEmployees = async () => {
    const token = localStorage.getItem('superAdminToken');
    setSyncLoading(true);
    setSyncMessage('');

    try {
      const response = await fetch('/api/superadmin/employees/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSyncMessage(data.message);
        // Refresh employees list and stats
        fetchEmployees(token!);
        fetchDashboardStats(token!);

        // Clear message after 5 seconds
        setTimeout(() => setSyncMessage(''), 5000);
      } else {
        setSyncMessage(`Error: ${data.error || 'Failed to sync employees'}`);
        setTimeout(() => setSyncMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error syncing employees:', error);
      setSyncMessage('Error: Failed to sync employees');
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setSyncLoading(false);
    }
  };


  const handleMarkCouponUsed = async (couponId: number) => {
    const token = localStorage.getItem('superAdminToken');

    try {
      const response = await fetch(`/api/superadmin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'used' })
      });

      if (response.ok) {
        fetchCoupons(token!);
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
    }
  };

  const handleDeleteCoupon = async (couponId: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    const token = localStorage.getItem('superAdminToken');

    try {
      const response = await fetch(`/api/superadmin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCoupons(token!);
        if (stats) {
          setStats({ ...stats, totalCoupons: stats.totalCoupons - 1 });
        }
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminData');
    router.push('/superadmin');
  };

  // Customer search functionality
  const handleCustomerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setSearchLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch('/api/superadmin/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: searchEmail.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const customer = result.customer;

        // Transform to expected format
        const transformedData = {
          email: customer.email,
          searchedAt: new Date().toISOString(),
          customer: {
            id: customer.id.toString(),
            name: customer.name,
            email: customer.email
          }
        };

        setCustomerSearchData(transformedData);

        // Handle coupons
        if (customer.coupons && customer.coupons.length > 0) {
          const normalizedCoupons = customer.coupons.map((coupon: any) => ({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: parseFloat(coupon.discountValue || 0),
            description: coupon.description,
            status: coupon.status,
            validUntil: coupon.validUntil,
            currentUses: coupon.currentUses || 0,
            maxUses: coupon.maxUses || null,
            minimumPurchase: parseFloat(coupon.minimumPurchase || 0)
          }));
          setCustomerCoupons(normalizedCoupons);
        } else {
          setCustomerCoupons([]);
        }
      } else {
        setError(result.error || 'Customer not found');
        setCustomerSearchData(null);
        setCustomerCoupons([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search customer');
      setCustomerSearchData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConfirmCredit = async () => {
    if (!customerSearchData?.credits) return;

    setConfirmLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch('/api/employee/confirm-credit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: customerSearchData.email,
          creditAmount: customerSearchData.credits.reserved
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Credit confirmed successfully!');
        handleCustomerSearch(new Event('submit') as any);
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
    const amount = parseFloat(cashbackAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setCashbackLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch('/api/employee/cashback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: customerSearchData?.email,
          amount,
          description: cashbackDescription,
          type: 'earned'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Cashback added successfully!');
        setShowCashbackModal(false);
        setCashbackAmount('');
        setCashbackDescription('');
        handleCustomerSearch(new Event('submit') as any);
      } else {
        setError(data.error || 'Failed to add cashback');
      }
    } catch (error) {
      console.error('Add cashback error:', error);
      setError('Failed to add cashback');
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

    if (customerSearchData?.cashback && amount > customerSearchData.cashback.balance) {
      setError('Amount exceeds available balance');
      return;
    }

    setCashbackLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch('/api/employee/cashback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: customerSearchData?.email,
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
        handleCustomerSearch(new Event('submit') as any);
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

  const handleCreateCouponForCustomer = async (formData: any) => {
    try {
      const token = localStorage.getItem('superAdminToken');
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
        if (customerSearchData?.customer) {
          // Refresh customer data to show new coupon
          handleCustomerSearch(new Event('submit') as any);
        }
      } else {
        throw new Error(data.error || 'Failed to create coupon');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleMarkCouponUsedInCustomer = async (couponId: number) => {
    try {
      const token = localStorage.getItem('superAdminToken');
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
        if (customerSearchData?.customer) {
          handleCustomerSearch(new Event('submit') as any);
        }
      } else {
        setError(data.error || 'Failed to mark coupon as used');
      }
    } catch (error) {
      console.error('Mark coupon used error:', error);
      setError('Failed to mark coupon as used');
    }
  };

  const handleDeleteCouponInCustomer = async (couponId: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const token = localStorage.getItem('superAdminToken');
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
        if (customerSearchData?.customer) {
          handleCustomerSearch(new Event('submit') as any);
        }
      } else {
        setError(data.error || 'Failed to delete coupon');
      }
    } catch (error) {
      console.error('Delete coupon error:', error);
      setError('Failed to delete coupon');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Super Admin Dashboard</h1>
              <span className="bg-[#00bcd4] text-white px-3 py-1 rounded-full text-sm">
                {adminData?.role}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="text-gray-600 text-sm sm:text-base">Welcome, {adminData?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-md overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-8 min-w-max sm:min-w-0">
            {['overview', 'employees', 'customers', 'coupons', 'analytics', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[#00bcd4] text-[#00bcd4]'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalUsers}</p>
                  </div>
                  <div className="text-blue-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Customers</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalCustomers}</p>
                  </div>
                  <div className="text-green-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Active Coupons</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.activeCoupons}</p>
                    <p className="text-xs text-gray-500 mt-1">of {stats.totalCoupons} total</p>
                  </div>
                  <div className="text-[#00bcd4]">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                      <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {formatCurrency(stats.revenue.total)}
                    </p>
                    <p className="text-xs text-green-400 mt-1">
                      +{formatCurrency(stats.revenue.thisMonth)} this month
                    </p>
                  </div>
                  <div className="text-yellow-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'coupon_created' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-gray-800">
                            {activity.type === 'coupon_created' ? 'Coupon created' : 'User registered'}
                          </p>
                          <p className="text-gray-600 text-sm">{activity.detail}</p>
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Employee Management</h2>
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="bg-[#00bcd4] hover:bg-[#00acc1] text-gray-800 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
              >
                Add Employee
              </button>
            </div>

            {/* Sync Message */}
            {syncMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                syncMessage.startsWith('Error')
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                {syncMessage}
              </div>
            )}

            {employeesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00bcd4] mx-auto"></div>
              </div>
            ) : employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 sm:px-4 py-3 text-gray-600 font-medium text-sm">Name</th>
                      <th className="px-2 sm:px-4 py-3 text-gray-600 font-medium text-sm">Email</th>
                      <th className="px-2 sm:px-4 py-3 text-gray-600 font-medium text-sm">Status</th>
                      <th className="px-2 sm:px-4 py-3 text-gray-600 font-medium text-sm">Joined</th>
                      <th className="px-2 sm:px-4 py-3 text-gray-600 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-3 text-gray-800 text-sm">{employee.name}</td>
                        <td className="px-2 sm:px-4 py-3 text-gray-800 text-sm">{employee.email}</td>
                        <td className="px-2 sm:px-4 py-3">
                          <button
                            onClick={() => handleToggleEmployeeStatus(employee.id, employee.isActive)}
                            className={`px-2 py-1 rounded text-xs ${
                              employee.isActive
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-red-600/20 text-red-400'
                            }`}
                          >
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-gray-600 text-sm">
                          {new Date(employee.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-2 sm:px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEmployee(employee)}
                              className="text-[#00bcd4] hover:text-[#00acc1] text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No employees found</p>
            )}
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Customer Search */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#00bcd4] mb-4">Customer Search & Management</h2>
              <form onSubmit={handleCustomerSearch} className="flex flex-col sm:flex-row gap-4">
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
                  disabled={searchLoading}
                  className="px-6 py-2 bg-[#00bcd4] text-white rounded-lg hover:bg-[#00acc1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
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
            {customerSearchData && (
              <div className="space-y-6">
                {/* Customer Details */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-[#00bcd4] mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-semibold">{customerSearchData.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-semibold">{customerSearchData.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Customer ID</p>
                      <p className="font-semibold">{customerSearchData.customer?.id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last Search</p>
                      <p className="font-semibold">{new Date(customerSearchData.searchedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Credits Section */}
                {customerSearchData.credits && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-[#00bcd4] mb-4">Store Credits</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-4 bg-blue-50 rounded">
                        <p className="text-2xl font-bold text-blue-600">${customerSearchData.credits.total}</p>
                        <p className="text-gray-600">Total</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded">
                        <p className="text-2xl font-bold text-green-600">${customerSearchData.credits.available}</p>
                        <p className="text-gray-600">Available</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded">
                        <p className="text-2xl font-bold text-yellow-600">${customerSearchData.credits.reserved}</p>
                        <p className="text-gray-600">Reserved</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <p className="text-2xl font-bold text-gray-600">${customerSearchData.credits.used}</p>
                        <p className="text-gray-600">Used</p>
                      </div>
                    </div>
                    {customerSearchData.credits.reserved > 0 && (
                      <button
                        onClick={handleConfirmCredit}
                        disabled={confirmLoading}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        {confirmLoading ? 'Confirming...' : `Confirm Reserved Credit ($${customerSearchData.credits.reserved})`}
                      </button>
                    )}
                  </div>
                )}

                {/* Cashback Section */}
                {customerSearchData.cashback && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <h3 className="text-xl font-bold text-[#00bcd4]">Cashback</h3>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => setShowCashbackModal(true)}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors w-full sm:w-auto"
                        >
                          Add Cashback
                        </button>
                        <button
                          onClick={() => setShowUseCashbackModal(true)}
                          disabled={customerSearchData.cashback.balance <= 0}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                        >
                          Use Cashback
                        </button>
                      </div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg mb-4">
                      <p className="text-3xl font-bold text-green-600">${customerSearchData.cashback.balance.toFixed(2)}</p>
                      <p className="text-gray-600">Current Balance</p>
                    </div>

                    {/* Transaction History */}
                    {customerSearchData.cashback.history && customerSearchData.cashback.history.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Recent Transactions</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {customerSearchData.cashback.history.map((transaction) => (
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
                    )}
                  </div>
                )}

                {/* Coupons Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold text-[#00bcd4]">Customer Coupons</h3>
                    <button
                      onClick={() => setShowCouponForm(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full sm:w-auto"
                    >
                      Create New Coupon
                    </button>
                  </div>

                  <CouponList
                    coupons={customerCoupons}
                    showActions={true}
                    onMarkUsed={handleMarkCouponUsedInCustomer}
                    onDelete={handleDeleteCouponInCustomer}
                    emptyMessage="No coupons found for this customer"
                  />
                </div>

                {/* Protector Replacements */}
                {customerSearchData.protectorReplacements && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-[#00bcd4] mb-4">Protector Replacements</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-4 bg-blue-50 rounded">
                        <p className="text-2xl font-bold text-blue-600">{customerSearchData.protectorReplacements.total}</p>
                        <p className="text-gray-600">Total</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded">
                        <p className="text-2xl font-bold text-green-600">{customerSearchData.protectorReplacements.available}</p>
                        <p className="text-gray-600">Available</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <p className="text-2xl font-bold text-gray-600">{customerSearchData.protectorReplacements.used}</p>
                        <p className="text-gray-600">Used</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {customerSearchData.protectorReplacements.protectors.map((protector) => (
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
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Coupon Management</h2>
            </div>

            {couponsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00bcd4] mx-auto"></div>
              </div>
            ) : (
              <CouponList
                coupons={coupons}
                loading={couponsLoading}
                showActions={true}
                onMarkUsed={handleMarkCouponUsed}
                onDelete={handleDeleteCoupon}
                emptyMessage="No coupons found"
              />
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Analytics & Reports</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coupon Usage Stats */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-gray-800 font-medium mb-3">Coupon Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active</span>
                      <span className="text-green-400">{stats?.activeCoupons || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Used</span>
                      <span className="text-blue-400">
                        {coupons.filter(c => c.status === 'used').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expired</span>
                      <span className="text-red-400">
                        {coupons.filter(c => c.status === 'expired').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-gray-800 font-medium mb-3">Revenue Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">This Month</span>
                      <span className="text-green-400">
                        {formatCurrency(stats?.revenue.thisMonth || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Month</span>
                      <span className="text-blue-400">
                        {formatCurrency(stats?.revenue.lastMonth || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total</span>
                      <span className="text-gray-800 font-bold">
                        {formatCurrency(stats?.revenue.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Growth */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-gray-800 font-medium mb-3">User Growth</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Users</span>
                      <span className="text-gray-800">{stats?.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employees</span>
                      <span className="text-gray-800">{stats?.totalEmployees || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customers</span>
                      <span className="text-gray-800">{stats?.totalCustomers || 0}</span>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-gray-800 font-medium mb-3">System Health</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Database</span>
                      <span className="text-green-400">Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">API Status</span>
                      <span className="text-green-400">Operational</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stripe</span>
                      <span className="text-green-400">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">System Settings</h2>

              <div className="space-y-6">
                {/* Webhook Configuration Link */}
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-800 font-medium mb-1">Webhook Configuration</h3>
                      <p className="text-gray-600 text-sm">Configure and manage Stripe webhooks for automatic coupon generation and subscription management</p>
                    </div>
                    <button
                      onClick={() => router.push('/superadmin/settings')}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Configure Webhooks
                    </button>
                  </div>
                </div>

                {/* Application Settings */}
                <div>
                  <h3 className="text-gray-800 font-medium mb-3">Application Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-600 mb-2">Application Name</label>
                      <input
                        type="text"
                        defaultValue="LA Mattress System"
                        className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-2">Support Email</label>
                      <input
                        type="email"
                        defaultValue="support@lamattress.com"
                        className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Coupon Settings */}
                <div>
                  <h3 className="text-gray-800 font-medium mb-3">Coupon Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-600 mb-2">Default Discount Type</label>
                      <select className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none">
                        <option value="percentage">Percentage</option>
                        <option value="fixed_amount">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-2">Default Validity Period (days)</label>
                      <input
                        type="number"
                        defaultValue="30"
                        className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div>
                  <h3 className="text-gray-800 font-medium mb-3">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-800">Two-Factor Authentication</p>
                        <p className="text-gray-600 text-sm">Require 2FA for all admin accounts</p>
                      </div>
                      <button className="bg-gray-700 relative inline-flex h-6 w-11 items-center rounded-full">
                        <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-800">Session Timeout</p>
                        <p className="text-gray-600 text-sm">Auto-logout after inactivity</p>
                      </div>
                      <select className="bg-white text-gray-800 px-3 py-1 rounded border border-gray-300">
                        <option>15 minutes</option>
                        <option>30 minutes</option>
                        <option>1 hour</option>
                        <option>Never</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="bg-[#00bcd4] hover:bg-[#00acc1] text-gray-800 px-6 py-2 rounded-lg transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Employee</h3>
            <form onSubmit={handleAddEmployee}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00bcd4] hover:bg-[#00acc1] text-gray-800 px-4 py-2 rounded-lg transition-colors"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editingType === 'employee' && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Employee</h3>
            <form onSubmit={handleUpdateEmployee}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingItem.name}
                    required
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingItem.email}
                    required
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="New password (optional)"
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-[#00bcd4] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    setEditingType('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00bcd4] hover:bg-[#00acc1] text-gray-800 px-4 py-2 rounded-lg transition-colors"
                >
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cashback Modal */}
      {showCashbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add Cashback</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cashbackAmount}
                  onChange={(e) => setCashbackAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={cashbackDescription}
                  onChange={(e) => setCashbackDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Purchase cashback"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCashback}
                  disabled={cashbackLoading}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {cashbackLoading ? 'Adding...' : 'Add Cashback'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Use Cashback</h3>
            <p className="text-sm text-gray-600 mb-4">
              Available Balance: ${customerSearchData?.cashback?.balance.toFixed(2)}
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
                  max={customerSearchData?.cashback?.balance}
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
      {showCouponForm && customerSearchData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CouponForm
              onSubmit={handleCreateCouponForCustomer}
              onCancel={() => setShowCouponForm(false)}
              customerEmail={customerSearchData.customer?.email || customerSearchData.email}
              customerName={customerSearchData.customer?.name || ''}
            />
          </div>
        </div>
      )}
    </div>
  );
}