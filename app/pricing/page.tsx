'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

const plans = [
  {
    id: 'basic',
    name: 'Basic Sleep+',
    price: 9.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || 'price_basic',
    features: [
      'Sleep tracking & analytics',
      'Weekly comfort reports',
      'Basic support',
      'Member discounts',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Sleep+',
    price: 19.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || 'price_premium',
    features: [
      'Everything in Basic',
      'Advanced sleep analytics',
      'Daily comfort reports',
      'Personalized recommendations',
      'Priority support',
      'Extra member benefits',
    ],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Elite Sleep+',
    price: 49.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
    features: [
      'Everything in Premium',
      'Premium analytics suite',
      'Real-time monitoring',
      'Family account sharing',
      'Dedicated support',
      'VIP member status',
      'Lifetime warranty',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, priceId: string) => {
    setLoading(planId);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/register');
        return;
      }

      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId,
          planType: planId,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="bg-gradient-to-b from-[#e3f2fd] to-white py-12 lg:py-20">
        <div className="container-mobile">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1e40af]">
              Choose Your Sleep Journey
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select the perfect plan for better sleep and exclusive member benefits
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl p-6 lg:p-8 transition-all duration-300 ${
                  plan.recommended
                    ? 'shadow-2xl scale-105 border-2 border-[#00bcd4]'
                    : 'shadow-lg hover:shadow-xl border border-gray-100'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#00bcd4] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center space-y-4 mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-[#1e40af]">
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl lg:text-5xl font-bold text-[#1e40af]">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500 text-lg">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id, plan.priceId)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                    plan.recommended
                      ? 'la-button-primary'
                      : 'la-button-secondary'
                  } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.id ? 'Processing...' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-16 text-center space-y-6">
            <div className="bg-white rounded-xl p-8 max-w-4xl mx-auto shadow-lg border border-gray-100">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-[#1e40af]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[#1e40af] font-bold text-lg">14-Day Free Trial</p>
                </div>
                <p className="text-gray-600">Cancel anytime for a full refund</p>
              </div>
            </div>
            
            <p className="text-gray-600 text-lg">
              Questions? Call us at{' '}
              <a href="tel:1-800-MATTRESS" className="text-[#1e40af] font-bold hover:text-[#00bcd4] transition-colors">
                1-800-MATTRESS
              </a>{' '}
              or email{' '}
              <a href="mailto:support@lamattress.com" className="text-[#1e40af] font-bold hover:text-[#00bcd4] transition-colors">
                support@lamattress.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}