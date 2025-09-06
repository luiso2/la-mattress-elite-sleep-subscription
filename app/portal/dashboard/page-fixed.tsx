'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavbarAuth from '@/components/NavbarAuth';

interface PortalData {
  customer: {
    name: string;
    email: string;
    created: string;
  };
  subscription: {
    status: string;
    current_period_end: number | null;
    cancel_at_period_end: boolean;
    plan?: string;
  };
  credits: {
    available: number;
    monthly: number;
    used: number;
    total?: number;
    reserved?: number;
  };
  protectorReplacements: {
    available: number;
    used: number;
    total: number;
  };
  message?: string;
  showReactivateButton?: boolean;
}

export default function PortalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState('');
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveAmount, setReserveAmount] = useState('');
  const [reserveLoading, setReserveLoading] = useState(false);
  // Add a state to store the token
  const [portalToken, setPortalToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token on mount and store it in state
    const token = localStorage.getItem('portal_token');
    if (token) {
      setPortalToken(token);
      console.log('Token loaded from localStorage:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
      router.push('/portal');
      return;
    }
    loadPortalData();
  }, [router]);

  const loadPortalData = async () => {
    try {
      // Use the token from state or try to get it again
      const token = portalToken || localStorage.getItem('portal_token');
      console.log('Dashboard - Loading with token:', token ? 'Token exists' : 'Token is null');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/portal');
        return;
      }

      const res = await fetch('/api/portal/data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('portal_token');
          setPortalToken(null);
          router.push('/portal');
          return;
        }
        throw new Error('Failed to load portal data');
      }

      const portalData = await res.json();
      setData(portalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleReserveCredits = async () => {
    const amount = parseInt(reserveAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!data || amount > data.credits.available) {
      alert(`You can only reserve up to $${data?.credits.available || 0}`);
      return;
    }

    setReserveLoading(true);
    try {
      // Try multiple methods to get the token
      let token = portalToken;
      
      // If not in state, try localStorage again
      if (!token) {
        console.log('Token not in state, checking localStorage...');
        token = localStorage.getItem('portal_token');
      }
      
      // Also try with window.localStorage explicitly
      if (!token && typeof window !== 'undefined') {
        console.log('Trying window.localStorage...');
        token = window.localStorage.getItem('portal_token');
      }
      
      // Debug log with more details
      console.log('Reserve Credits - Token check:', {
        fromState: portalToken ? 'exists' : 'null',
        fromLocalStorage: token ? 'exists' : 'null',
        tokenPrefix: token ? token.substring(0, 20) : 'null',
        allKeys: typeof window !== 'undefined' ? Object.keys(window.localStorage) : []
      });
      
      if (!token) {
        alert('Session expired. Please login again.');
        router.push('/portal');
        return;
      }
      
      // Make sure we're using the correct headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      console.log('Sending request with headers:', {
        'Content-Type': headers['Content-Type'],
        'Authorization': headers['Authorization'].substring(0, 30) + '...'
      });
      
      const response = await fetch('/api/credits/reserve', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ amount }),
      });

      const result = await response.json();
      console.log('Reserve response:', response.status, result);

      if (response.ok && result.success) {
        alert(`Successfully reserved $${amount} for in-store use!`);
        setShowReserveModal(false);
        setReserveAmount('');
        // Reload data to show updated credits
        await loadPortalData();
      } else {
        console.error('Reserve failed:', result);
        alert(result.error || 'Failed to reserve credits');
      }
    } catch (error) {
      console.error('Reserve error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setReserveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarAuth customerName="" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00bcd4] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your portal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarAuth customerName="" />
        <div className="container-mobile py-12">
          <div className="card max-w-md mx-auto text-center">
            <p className="text-red-600 mb-4">{error || 'Unable to load portal data'}</p>
            <button
              onClick={() => router.push('/portal')}
              className="la-button-secondary"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSubscriptionActive = data.subscription.status === 'active' || 
                              data.subscription.status === 'trialing' || 
                              data.subscription.status === 'past_due';

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAuth customerName={data.customer.name} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e40af] to-[#00bcd4] text-white">
        <div className="container-mobile py-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#1e40af] text-2xl font-bold shadow-lg">
              {getInitials(data.customer.name)}
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-center mb-2 !text-white">
            Welcome, {data.customer.name}!
          </h1>
          <p className="text-center text-white/90">
            {isSubscriptionActive ? (
              <>✨ Active ELITE SLEEP+ Member since {new Date(data.customer.created).toLocaleDateString()}</>
            ) : (
              <>Customer since {new Date(data.customer.created).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </div>
      
      <div className="container-mobile py-8">
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-xs">
            <p className="font-bold mb-2">Debug Info:</p>
            <p>Token in state: {portalToken ? 'Yes' : 'No'}</p>
            <p>Token in localStorage: {typeof window !== 'undefined' && window.localStorage.getItem('portal_token') ? 'Yes' : 'No'}</p>
            <p>Credits available: ${data.credits.available}</p>
          </div>
        )}

        {/* Status Message */}
        {!isSubscriptionActive && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center">
            <p className="text-red-800 font-bold text-lg mb-4">
              {data.message || 'Your ELITE SLEEP+ membership is currently inactive'}
            </p>
            <p className="text-gray-700 mb-6">
              Reactivate your membership to regain access to all benefits including monthly store credit, 
              free delivery, and lifetime warranty protection.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="la-button text-lg px-8 py-3"
            >
              Reactivate Membership
            </button>
          </div>
        )}

        {isSubscriptionActive && (
          <div className="bg-[#ffd700] rounded-lg p-6 mb-8 shadow-md">
            <p className="text-[#1e40af] font-bold text-lg flex items-center">
              <span className="text-2xl mr-2">🎉</span>
              Welcome to ELITE SLEEP+! Your membership is active and all benefits are available.
            </p>
          </div>
        )}
        
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Available Credit */}
          <div className={`card ${!isSubscriptionActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-2xl mr-4">
                💰
              </div>
              <h3 className="text-xl font-bold text-[#1e40af]">Available Credit</h3>
            </div>
            
            <div className="text-center py-6 bg-green-50 rounded-lg mb-4">
              <div className="text-5xl font-bold text-green-600">${data.credits.available}</div>
              <div className="text-gray-600 mt-2">Current Balance</div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Monthly credit:</span>
                <span className="font-semibold">${data.credits.monthly}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total earned:</span>
                <span className="font-semibold">${data.credits.total || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Credits used:</span>
                <span className="font-semibold text-red-600">-${data.credits.used || 0}</span>
              </div>
              {data.credits.reserved && data.credits.reserved > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Reserved for use:</span>
                  <span className="font-semibold text-orange-600">${data.credits.reserved}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Available balance:</span>
                <span className="font-bold text-green-600">${data.credits.available}</span>
              </div>
            </div>
            
            {/* Reserve Credits Button */}
            {data.credits.available > 0 && (
              <button
                onClick={() => setShowReserveModal(true)}
                className="w-full mt-4 py-3 bg-[#00bcd4] text-white rounded-lg hover:bg-[#00bcd4]/90 transition-colors font-semibold"
              >
                Reserve Credits for In-Store Use
              </button>
            )}
            
            {isSubscriptionActive && (
              <div className="bg-[#e3f2fd] rounded-lg p-4 mt-4">
                <p className="text-sm text-[#1e40af]">
                  <strong>Next month:</strong> You'll receive an additional ${data.credits.monthly}
                </p>
              </div>
            )}
          </div>
          
          {/* Mattress Protection */}
          <div className={`card ${!isSubscriptionActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white text-2xl mr-4">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-[#1e40af]">Mattress Protection</h3>
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-700">Protector replacement #{num}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    !isSubscriptionActive 
                      ? 'bg-gray-100 text-gray-500'
                      : num <= data.protectorReplacements.used 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                  }`}>
                    {!isSubscriptionActive 
                      ? 'Inactive' 
                      : num <= data.protectorReplacements.used 
                        ? 'Used' 
                        : 'Available'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">Used:</span>
                <span className="font-semibold">{data.protectorReplacements.used} of {data.protectorReplacements.total}</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                  style={{ width: `${(data.protectorReplacements.used / (data.protectorReplacements.total || 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                ${(data.protectorReplacements.total - data.protectorReplacements.used) * 100} value remaining
              </p>
            </div>
          </div>
          
          {/* Delivery Services */}
          <div className={`card ${!isSubscriptionActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl mr-4">
                🚚
              </div>
              <h3 className="text-xl font-bold text-[#1e40af]">Delivery Services</h3>
            </div>
            
            <ul className="space-y-3">
              <li className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700">Free delivery</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isSubscriptionActive 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSubscriptionActive ? 'Unlimited' : 'Inactive'}
                </span>
              </li>
              <li className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700">Professional setup</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isSubscriptionActive 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSubscriptionActive ? 'Included' : 'Inactive'}
                </span>
              </li>
              <li className="flex justify-between items-center py-3">
                <span className="text-gray-700">Old mattress removal</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isSubscriptionActive 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSubscriptionActive ? 'Included' : 'Inactive'}
                </span>
              </li>
            </ul>
            
            <div className="bg-[#e3f2fd] rounded-lg p-4 mt-4">
              <p className="text-sm text-[#1e40af] font-semibold">
                Total value: $75 per delivery
              </p>
            </div>
          </div>
          
          {/* Lifetime Warranty */}
          <div className={`card ${!isSubscriptionActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-2xl mr-4">
                ♾️
              </div>
              <h3 className="text-xl font-bold text-[#1e40af]">Lifetime Warranty</h3>
            </div>
            
            <ul className="space-y-3">
              <li className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700">Defects protection</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isSubscriptionActive 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSubscriptionActive ? 'Active' : 'Inactive'}
                </span>
              </li>
              <li className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700">Sagging protection</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isSubscriptionActive 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSubscriptionActive ? 'Active' : 'Inactive'}
                </span>
              </li>
              <li className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700">Stain protection</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isSubscriptionActive 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSubscriptionActive ? 'Active' : 'Inactive'}
                </span>
              </li>
              <li className="flex justify-between items-center py-3">
                <span className="text-gray-700">Professional cleaning</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isSubscriptionActive 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSubscriptionActive ? 'Included' : 'Inactive'}
                </span>
              </li>
            </ul>
            
            <div className={`rounded-lg p-4 mt-4 ${
              isSubscriptionActive ? 'bg-purple-50' : 'bg-gray-50'
            }`}>
              <p className={`text-sm font-semibold ${
                isSubscriptionActive ? 'text-purple-800' : 'text-gray-600'
              }`}>
                {isSubscriptionActive 
                  ? 'Your mattress is protected forever'
                  : 'Reactivate to protect your mattress'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Membership Info */}
        {isSubscriptionActive && data.subscription.current_period_end && (
          <div className="card bg-gradient-to-r from-[#e3f2fd] to-white">
            <h4 className="text-xl font-bold text-[#1e40af] mb-4">📅 Membership Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-gray-800 mb-2">
                  Next renewal: {formatDate(data.subscription.current_period_end)}
                </p>
                <p className="text-gray-600">Annual cost: $120</p>
                <p className="text-green-600 font-semibold">You receive: $180 in store credit (150% value)</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-[#1e40af] mb-1">Monthly breakdown:</p>
                <p className="text-gray-600">$15 credit every month for 12 months</p>
                <p className="text-sm text-gray-500 mt-2">Cancel anytime before renewal</p>
              </div>
            </div>
          </div>
        )}

        {/* Reactivate CTA for inactive subscriptions */}
        {!isSubscriptionActive && (
          <div className="text-center mt-8 p-8 bg-gradient-to-r from-[#1e40af] to-[#00bcd4] rounded-lg text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Reactivate Your Benefits?</h3>
            <p className="mb-6 text-white/90">
              Get instant access to $180 in annual store credit, free delivery, and lifetime warranty protection.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="bg-[#ffd700] text-[#1e40af] hover:bg-yellow-400 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              View Membership Options
            </button>
          </div>
        )}

      </div>

      {/* Reserve Credits Modal */}
      {showReserveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-[#1e40af] mb-4">Reserve Credits for In-Store Use</h3>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Reserve credits to use for your next in-store purchase. Reserved credits will be held for 24 hours.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Available to reserve:</strong> ${data?.credits.available || 0}
                </p>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Reserve ($)
              </label>
              <input
                type="number"
                min="1"
                max={data?.credits.available || 0}
                value={reserveAmount}
                onChange={(e) => setReserveAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4] focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReserveModal(false);
                  setReserveAmount('');
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={reserveLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReserveCredits}
                className="flex-1 py-2 bg-[#00bcd4] text-white rounded-lg hover:bg-[#00bcd4]/90 transition-colors disabled:opacity-50"
                disabled={reserveLoading}
              >
                {reserveLoading ? 'Processing...' : 'Reserve Credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}