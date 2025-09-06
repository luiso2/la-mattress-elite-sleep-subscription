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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container-mobile py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-[#1e40af] mb-4">
            Choose Your Sleep Journey
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for better sleep and exclusive member benefits
          </p>
        </div>

        {/* Pricing Cards - Mobile First Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg p-6 md:p-8 relative transform transition-transform hover:scale-105 ${
                plan.recommended ? 'ring-2 ring-[#00bcd4] md:scale-105' : ''
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#00bcd4] text-white px-6 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-[#1e40af] mb-2">
                  {plan.name}
                </h2>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl md:text-5xl font-bold text-[#1e40af]">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 md:mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm md:text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id, plan.priceId)}
                disabled={loading === plan.id}
                className={`w-full py-3 px-6 rounded-lg font-bold text-base md:text-lg transition-all ${
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
        <div className="mt-8 md:mt-12 text-center bg-[#e3f2fd] rounded-lg p-6 md:p-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <svg className="w-6 h-6 text-[#1e40af] mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-[#1e40af] font-semibold text-lg">14-Day Free Trial</p>
            </div>
            <p className="text-gray-600">
              Try any plan risk-free. Cancel anytime within 14 days for a full refund.
            </p>
            <p className="text-gray-600">
              Questions? Call us at{' '}
              <a href="tel:1-800-MATTRESS" className="text-[#1e40af] font-semibold">
                1-800-MATTRESS
              </a>{' '}
              or email{' '}
              <a href="mailto:support@lamattress.com" className="text-[#1e40af] font-semibold">
                support@lamattress.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}