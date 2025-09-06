'use client';

import { useState, useEffect } from 'react';

interface ProtectorStatus {
  number: number;
  used: boolean;
  date: string | null;
  status: 'available' | 'processing' | 'shipped' | 'delivered';
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface ShippingFormData {
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  specialInstructions: string;
}

interface MattressProtectionProps {
  isActive: boolean;
  token: string | null;
  onRefresh: () => void;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

export default function MattressProtection({ isActive, token, onRefresh }: MattressProtectionProps) {
  const [protectors, setProtectors] = useState<ProtectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedProtector, setSelectedProtector] = useState<number | null>(null);
  const [claimStep, setClaimStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [reason, setReason] = useState('');
  const [mattressSize, setMattressSize] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [shippingForm, setShippingForm] = useState<ShippingFormData>({
    fullName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    specialInstructions: ''
  });

  useEffect(() => {
    loadProtectorStatus();
  }, []);

  const loadProtectorStatus = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/protector/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProtectors(data.protectors || []);
      }
    } catch (error) {
      console.error('Failed to load protector status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimStart = (protectorNumber: number) => {
    setSelectedProtector(protectorNumber);
    setClaimStep(1);
    setShowClaimModal(true);
    // Reset form
    setReason('');
    setMattressSize('');
    setPurchaseDate('');
    setShippingForm({
      fullName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      specialInstructions: ''
    });
  };

  const handleSubmitClaim = async () => {
    if (!selectedProtector || !token) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/protector/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          protectorNumber: selectedProtector,
          reason,
          mattressSize,
          mattressPurchaseDate: purchaseDate,
          shippingAddress: shippingForm
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`Success! Your order number is: ${result.orderNumber}. You will receive a confirmation email shortly.`);
        setShowClaimModal(false);
        loadProtectorStatus();
        onRefresh();
      } else {
        alert(result.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Submit claim error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (protector: ProtectorStatus) => {
    if (!isActive) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-500">
          Inactive
        </span>
      );
    }

    switch (protector.status) {
      case 'available':
        return (
          <button
            onClick={() => handleClaimStart(protector.number)}
            className="px-4 py-1 bg-green-500 text-white rounded-full text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            Claim Now
          </button>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
            Processing
          </span>
        );
      case 'shipped':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
            Shipped
          </span>
        );
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
            Delivered
          </span>
        );
      default:
        return null;
    }
  };

  const renderClaimForm = () => {
    switch (claimStep) {
      case 1:
        return (
          <div>
            <h4 className="text-lg font-semibold mb-4">Step 1: Reason for Replacement</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you need a replacement? *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="damage">Damage (tear, rip, or hole)</option>
                  <option value="stain">Staining that won't come out</option>
                  <option value="wear">Normal wear and tear</option>
                  <option value="defect">Manufacturing defect</option>
                  <option value="size">Need different size</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mattress Size *
                </label>
                <select
                  value={mattressSize}
                  onChange={(e) => setMattressSize(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                  required
                >
                  <option value="">Select size</option>
                  <option value="twin">Twin</option>
                  <option value="twin-xl">Twin XL</option>
                  <option value="full">Full</option>
                  <option value="queen">Queen</option>
                  <option value="king">King</option>
                  <option value="cal-king">California King</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mattress Purchase Date (Optional)
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowClaimModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setClaimStep(2)}
                disabled={!reason || !mattressSize}
                className="flex-1 py-2 bg-[#00bcd4] text-white rounded-lg hover:bg-[#00bcd4]/90 disabled:opacity-50"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h4 className="text-lg font-semibold mb-4">Step 2: Shipping Information</h4>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={shippingForm.fullName}
                  onChange={(e) => setShippingForm({...shippingForm, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={shippingForm.email}
                  onChange={(e) => setShippingForm({...shippingForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={shippingForm.phone}
                  onChange={(e) => setShippingForm({...shippingForm, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={shippingForm.address1}
                  onChange={(e) => setShippingForm({...shippingForm, address1: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apartment, Suite, etc. (Optional)
                </label>
                <input
                  type="text"
                  value={shippingForm.address2}
                  onChange={(e) => setShippingForm({...shippingForm, address2: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({...shippingForm, city: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                    placeholder="New York"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    value={shippingForm.state}
                    onChange={(e) => setShippingForm({...shippingForm, state: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                    required
                  >
                    <option value="">Select State</option>
                    {US_STATES.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={shippingForm.zipCode}
                  onChange={(e) => setShippingForm({...shippingForm, zipCode: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                  placeholder="10001"
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Delivery Instructions (Optional)
                </label>
                <textarea
                  value={shippingForm.specialInstructions}
                  onChange={(e) => setShippingForm({...shippingForm, specialInstructions: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00bcd4]"
                  rows={3}
                  placeholder="Leave at front door, ring doorbell, etc."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setClaimStep(1)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Back
              </button>
              <button
                onClick={() => setClaimStep(3)}
                disabled={!shippingForm.fullName || !shippingForm.address1 || !shippingForm.city || 
                         !shippingForm.state || !shippingForm.zipCode || !shippingForm.phone || !shippingForm.email}
                className="flex-1 py-2 bg-[#00bcd4] text-white rounded-lg hover:bg-[#00bcd4]/90 disabled:opacity-50"
              >
                Review Order
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h4 className="text-lg font-semibold mb-4">Step 3: Review and Confirm</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <h5 className="font-semibold text-sm text-gray-700 mb-2">Product Details</h5>
                <p className="text-sm">Protector Replacement #{selectedProtector}</p>
                <p className="text-sm">Size: {mattressSize}</p>
                <p className="text-sm">Reason: {reason}</p>
              </div>

              <div>
                <h5 className="font-semibold text-sm text-gray-700 mb-2">Shipping Address</h5>
                <p className="text-sm">{shippingForm.fullName}</p>
                <p className="text-sm">{shippingForm.address1}</p>
                {shippingForm.address2 && <p className="text-sm">{shippingForm.address2}</p>}
                <p className="text-sm">{shippingForm.city}, {shippingForm.state} {shippingForm.zipCode}</p>
                <p className="text-sm">Phone: {shippingForm.phone}</p>
                <p className="text-sm">Email: {shippingForm.email}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Once submitted, this will use 1 of your 3 free mattress protector replacements.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setClaimStep(2)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Back
              </button>
              <button
                onClick={handleSubmitClaim}
                disabled={submitting}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`card ${!isActive ? 'opacity-60' : ''}`}>
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white text-2xl mr-4">
            🛡️
          </div>
          <h3 className="text-xl font-bold text-[#1e40af]">Mattress Protection</h3>
        </div>
        
        <div className="space-y-3">
          {protectors.map((protector) => (
            <div key={protector.number} className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex-1">
                <span className="text-gray-700 font-medium">
                  Protector Replacement #{protector.number}
                </span>
                {protector.date && (
                  <p className="text-sm text-gray-500 mt-1">
                    {protector.status === 'delivered' ? 'Delivered' : 'Claimed'} on {new Date(protector.date).toLocaleDateString()}
                  </p>
                )}
                {protector.trackingNumber && (
                  <p className="text-sm text-blue-600 mt-1">
                    Tracking: {protector.trackingNumber}
                  </p>
                )}
              </div>
              {getStatusBadge(protector)}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Used:</span>
            <span className="font-semibold">
              {protectors.filter(p => p.used).length} of 3
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
              style={{ width: `${(protectors.filter(p => p.used).length / 3) * 100}%` }}
            />
          </div>
          
          {!isActive && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Reactivate your membership to claim protector replacements
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedProtector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#1e40af]">
                Claim Mattress Protector Replacement
              </h3>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  claimStep >= 1 ? 'bg-[#00bcd4] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <div className={`w-20 h-1 ${claimStep >= 2 ? 'bg-[#00bcd4]' : 'bg-gray-200'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  claimStep >= 2 ? 'bg-[#00bcd4] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <div className={`w-20 h-1 ${claimStep >= 3 ? 'bg-[#00bcd4]' : 'bg-gray-200'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  claimStep >= 3 ? 'bg-[#00bcd4] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
              </div>
            </div>

            {renderClaimForm()}
          </div>
        </div>
      )}
    </>
  );
}