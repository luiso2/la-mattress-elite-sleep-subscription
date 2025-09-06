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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{user?.name || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{user?.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Customer ID:</span>
                <span className="ml-2 font-mono text-sm">{user?.stripeCustomerId || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
            {user?.subscription ? (
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    user.subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.subscription.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Current Period Ends:</span>
                  <span className="ml-2 font-medium">
                    {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
                {user.subscription.cancelAtPeriodEnd && (
                  <div className="text-yellow-600">
                    Subscription will cancel at period end
                  </div>
                )}
                <button
                  onClick={handleManageBilling}
                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Manage Billing
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">No active subscription</p>
                <button
                  onClick={() => router.push('/pricing')}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Choose a Plan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sleep Stats Placeholder */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Sleep Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-3xl font-bold text-purple-600">7.5h</div>
              <div className="text-gray-600">Avg Sleep</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-3xl font-bold text-blue-600">85%</div>
              <div className="text-gray-600">Sleep Quality</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-3xl font-bold text-green-600">23</div>
              <div className="text-gray-600">Nights Tracked</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-3xl font-bold text-yellow-600">10:30pm</div>
              <div className="text-gray-600">Avg Bedtime</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-600 transition-colors">
              <div className="text-lg font-medium">Track Sleep</div>
              <div className="text-sm text-gray-600">Start tonight's session</div>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-600 transition-colors">
              <div className="text-lg font-medium">View Reports</div>
              <div className="text-sm text-gray-600">See detailed analytics</div>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-600 transition-colors">
              <div className="text-lg font-medium">Sleep Tips</div>
              <div className="text-sm text-gray-600">Personalized recommendations</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}