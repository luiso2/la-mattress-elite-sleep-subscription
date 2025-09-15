'use client';

import { useState } from 'react';

interface CouponCardProps {
  coupon: {
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
  };
  showActions?: boolean;
  onMarkUsed?: (couponId: number) => void;
  onDelete?: (couponId: number) => void;
}

export default function CouponCard({ coupon, showActions = false, onMarkUsed, onDelete }: CouponCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDiscount = () => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    } else {
      return `$${coupon.discountValue} OFF`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = () => {
    switch (coupon.status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'used':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (coupon.status) {
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      case 'used':
        return 'Used';
      case 'cancelled':
        return 'Cancelled';
      default:
        return coupon.status;
    }
  };

  return (
    <div className={`relative bg-white rounded-lg border-2 ${coupon.status === 'active' ? 'border-blue-200' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow`}>
      {/* Discount Badge */}
      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
        {formatDiscount()}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{coupon.description || 'Discount Coupon'}</h3>
            <p className="text-sm text-gray-500 mt-1">Valid until {formatDate(coupon.validUntil)}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Coupon Code */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <code className="text-lg font-mono font-bold text-gray-900">{coupon.code}</code>
            <button
              onClick={copyToClipboard}
              className="ml-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2 text-sm text-gray-600">
          {coupon.minimumPurchase && (
            <p>• Minimum purchase: ${coupon.minimumPurchase}</p>
          )}
          {coupon.maxUses && (
            <p>• Uses: {coupon.currentUses} / {coupon.maxUses}</p>
          )}
        </div>

        {/* Actions for Employees */}
        {showActions && coupon.status === 'active' && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <button
              onClick={() => onMarkUsed?.(coupon.id)}
              className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              Mark as Used
            </button>
            <button
              onClick={() => onDelete?.(coupon.id)}
              className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}