'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.portalUrl) {
        window.location.href = data.data.portalUrl;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00bcd4] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container-mobile py-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-[#1e40af] mb-8">Welcome, {user?.name || 'Member'}!</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="card">
            <h2 className="text-xl font-bold text-[#1e40af] mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Name</span>
                <span className="font-medium text-gray-800">{user?.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-800">{user?.email}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Member ID</span>
                <span className="font-mono text-sm text-gray-800">{user?.stripeCustomerId || 'Not set'}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium text-gray-800">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="card">
            <h2 className="text-xl font-bold text-[#1e40af] mb-4">Subscription Status</h2>
            {user?.subscription ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.subscription.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.subscription.status.charAt(0).toUpperCase() + user.subscription.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium text-gray-800">
                    {user.subscription.planType?.charAt(0).toUpperCase() + user.subscription.planType?.slice(1) || 'Basic'} Sleep+
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Renews On</span>
                  <span className="font-medium text-gray-800">
                    {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
                {user.subscription.cancelAtPeriodEnd && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      Your subscription will cancel at the end of the current period
                    </p>
                  </div>
                )}
                <button
                  onClick={handleManageBilling}
                  className="w-full la-button-secondary py-3 mt-4"
                >
                  Manage Billing
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-6">No active subscription</p>
                <button
                  onClick={() => router.push('/pricing')}
                  className="la-button-primary"
                >
                  Choose a Plan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Member Benefits */}
        <div className="mt-8 card">
          <h2 className="text-xl font-bold text-[#1e40af] mb-6">Your Member Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-[#e3f2fd] rounded-lg">
              <div className="text-3xl font-bold text-[#1e40af]">$180</div>
              <div className="text-gray-600 mt-1">Annual Credit</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">Free</div>
              <div className="text-gray-600 mt-1">Delivery & Setup</div>
            </div>
            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">Lifetime</div>
              <div className="text-gray-600 mt-1">Warranty</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">3</div>
              <div className="text-gray-600 mt-1">Free Protectors</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 card">
          <h2 className="text-xl font-bold text-[#1e40af] mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/portal')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-[#00bcd4] hover:bg-[#e3f2fd] transition-all group"
            >
              <div className="text-lg font-semibold text-gray-800 group-hover:text-[#1e40af]">
                Member Portal
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Access exclusive benefits
              </div>
            </button>
            <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-[#00bcd4] hover:bg-[#e3f2fd] transition-all group">
              <div className="text-lg font-semibold text-gray-800 group-hover:text-[#1e40af]">
                Shop Now
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Use your store credit
              </div>
            </button>
            <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-[#00bcd4] hover:bg-[#e3f2fd] transition-all group">
              <div className="text-lg font-semibold text-gray-800 group-hover:text-[#1e40af]">
                Support
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Get help 24/7
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}