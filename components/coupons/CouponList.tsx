'use client';

import { useState, useEffect } from 'react';
import CouponCard from './CouponCard';

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

interface CouponListProps {
  coupons: Coupon[];
  loading?: boolean;
  showActions?: boolean;
  onMarkUsed?: (couponId: number) => void;
  onDelete?: (couponId: number) => void;
  emptyMessage?: string;
}

export default function CouponList({
  coupons: initialCoupons,
  loading = false,
  showActions = false,
  onMarkUsed,
  onDelete,
  emptyMessage = 'No coupons available'
}: CouponListProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'used'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setCoupons(initialCoupons);
  }, [initialCoupons]);

  const filteredCoupons = coupons.filter(coupon => {
    // Apply status filter
    if (filter !== 'all' && coupon.status !== filter) {
      return false;
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        coupon.code.toLowerCase().includes(search) ||
        coupon.description?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const sortedCoupons = [...filteredCoupons].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.validUntil).getTime() - new Date(a.validUntil).getTime();
    } else {
      return b.discountValue - a.discountValue;
    }
  });

  const handleMarkUsed = async (couponId: number) => {
    if (onMarkUsed) {
      await onMarkUsed(couponId);
      // Update local state
      setCoupons(prev =>
        prev.map(c =>
          c.id === couponId ? { ...c, status: 'used' as const } : c
        )
      );
    }
  };

  const handleDelete = async (couponId: number) => {
    if (onDelete) {
      await onDelete(couponId);
      // Remove from local state
      setCoupons(prev => prev.filter(c => c.id !== couponId));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({coupons.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded ${
                filter === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active ({coupons.filter(c => c.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('used')}
              className={`px-3 py-1 rounded ${
                filter === 'used'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Used ({coupons.filter(c => c.status === 'used').length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-3 py-1 rounded ${
                filter === 'expired'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Expired ({coupons.filter(c => c.status === 'expired').length})
            </button>
          </div>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'value')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="value">Sort by Value</option>
          </select>
        </div>
      </div>

      {/* Coupon Grid */}
      {sortedCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              showActions={showActions}
              onMarkUsed={handleMarkUsed}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="mt-3 text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}