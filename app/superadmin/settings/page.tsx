'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuperAdminSettings() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('webhooks');

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('superadminToken');
      if (!token) {
        router.push('/superadmin');
        return;
      }
      setIsAuthenticated(true);
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('superadminToken');
    router.push('/superadmin');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white border-b border-cyan-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/superadmin/dashboard" className="text-cyan-600 hover:text-cyan-700">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('webhooks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'webhooks'
                    ? 'border-cyan-600 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Webhooks Configuration
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'integrations'
                    ? 'border-cyan-600 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Integrations
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            {/* Existing Webhook */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Coupon Creation Webhook
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Endpoint URL:</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <code className="text-sm text-gray-800">
                      https://your-domain.com/api/webhooks/stripe
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Purpose:</h3>
                  <p className="text-sm text-gray-600">
                    This webhook automatically generates a $15 discount coupon in Shopify when a customer completes their first payment for the Elite Sleep+ subscription.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Events to Listen:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li><code className="bg-gray-100 px-1 rounded">invoice.payment_succeeded</code></li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Configuration in Stripe:</h3>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                    <li>Go to Stripe Dashboard → Developers → Webhooks</li>
                    <li>Click "Add endpoint"</li>
                    <li>Enter the endpoint URL</li>
                    <li>Select the event: <code className="bg-gray-100 px-1 rounded">invoice.payment_succeeded</code></li>
                    <li>Copy the webhook signing secret</li>
                    <li>Add the secret to your <code className="bg-gray-100 px-1 rounded">.env.local</code> as <code className="bg-gray-100 px-1 rounded">STRIPE_WEBHOOK_SECRET</code></li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Make sure the webhook endpoint is publicly accessible and properly secured with the signing secret.
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Webhooks */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recommended Additional Webhooks
              </h2>
              <div className="space-y-6">
                {/* Subscription Cancelled */}
                <div className="border-l-4 border-cyan-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    1. Subscription Cancellation Handler
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Handle when customers cancel their subscription to update their status and prevent access to benefits.
                  </p>
                  <div className="text-sm">
                    <strong>Events:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code className="bg-gray-100 px-1 rounded">customer.subscription.deleted</code></li>
                      <li><code className="bg-gray-100 px-1 rounded">customer.subscription.updated</code> (when status changes to canceled)</li>
                    </ul>
                  </div>
                </div>

                {/* Payment Failed */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    2. Payment Failure Handler
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Notify customers when their payment fails and potentially pause benefits until resolved.
                  </p>
                  <div className="text-sm">
                    <strong>Events:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code className="bg-gray-100 px-1 rounded">invoice.payment_failed</code></li>
                      <li><code className="bg-gray-100 px-1 rounded">charge.failed</code></li>
                    </ul>
                  </div>
                </div>

                {/* Customer Updated */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    3. Customer Information Sync
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Keep customer information synchronized when they update their details in Stripe.
                  </p>
                  <div className="text-sm">
                    <strong>Events:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code className="bg-gray-100 px-1 rounded">customer.updated</code></li>
                      <li><code className="bg-gray-100 px-1 rounded">customer.source.updated</code></li>
                    </ul>
                  </div>
                </div>

                {/* Subscription Renewed */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    4. Subscription Renewal Tracker
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Track successful renewals to award loyalty benefits and update credit balances.
                  </p>
                  <div className="text-sm">
                    <strong>Events:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code className="bg-gray-100 px-1 rounded">invoice.payment_succeeded</code> (for recurring payments)</li>
                      <li><code className="bg-gray-100 px-1 rounded">customer.subscription.updated</code> (when renewed)</li>
                    </ul>
                  </div>
                </div>

                {/* Dispute/Chargeback */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    5. Dispute & Chargeback Handler
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Automatically suspend benefits when a dispute or chargeback is initiated.
                  </p>
                  <div className="text-sm">
                    <strong>Events:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code className="bg-gray-100 px-1 rounded">charge.dispute.created</code></li>
                      <li><code className="bg-gray-100 px-1 rounded">charge.dispute.updated</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Implementation Tips:</h4>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li>Use a webhook queue system for reliability</li>
                  <li>Implement idempotency to handle duplicate events</li>
                  <li>Log all webhook events for debugging</li>
                  <li>Set up alerts for webhook failures</li>
                  <li>Test webhooks using Stripe CLI: <code className="bg-blue-100 px-1 rounded">stripe listen --forward-to localhost:3000/api/webhooks/stripe</code></li>
                </ul>
              </div>
            </div>

            {/* Webhook Security */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Webhook Security Best Practices
              </h2>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Always verify webhook signatures using the signing secret</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Use HTTPS endpoints only</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Implement request timeouts (respond within 20 seconds)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Handle events asynchronously using queues for heavy processing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Return 200 status immediately after receiving the webhook</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Implement retry logic for failed operations</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Active Integrations
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Stripe</h3>
                  <p className="text-sm text-gray-600">Payment processing and subscription management</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Shopify</h3>
                  <p className="text-sm text-gray-600">Coupon generation and e-commerce integration</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">PostgreSQL</h3>
                  <p className="text-sm text-gray-600">Database for customer and employee management</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}