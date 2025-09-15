'use client';

interface CouponStatsProps {
  stats: {
    totalCoupons: number;
    activeCoupons: number;
    usedCoupons: number;
    expiredCoupons: number;
    totalDiscountGiven: number;
  };
  loading?: boolean;
}

export default function CouponStats({ stats, loading = false }: CouponStatsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const statItems = [
    {
      label: 'Total Coupons',
      value: stats.totalCoupons,
      color: 'bg-blue-100 text-blue-800',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      label: 'Active',
      value: stats.activeCoupons,
      color: 'bg-green-100 text-green-800',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Used',
      value: stats.usedCoupons,
      color: 'bg-purple-100 text-purple-800',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    {
      label: 'Expired',
      value: stats.expiredCoupons,
      color: 'bg-gray-100 text-gray-800',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Total Discount',
      value: formatCurrency(stats.totalDiscountGiven),
      color: 'bg-yellow-100 text-yellow-800',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Coupon Statistics</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${item.color} mb-2`}>
              {item.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Usage Rate */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Usage Rate</span>
          <span className="text-sm font-semibold text-gray-900">
            {stats.totalCoupons > 0
              ? `${Math.round((stats.usedCoupons / stats.totalCoupons) * 100)}%`
              : '0%'
            }
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: stats.totalCoupons > 0
                ? `${(stats.usedCoupons / stats.totalCoupons) * 100}%`
                : '0%'
            }}
          />
        </div>
      </div>

      {/* Active Rate */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Active Rate</span>
          <span className="text-sm font-semibold text-gray-900">
            {stats.totalCoupons > 0
              ? `${Math.round((stats.activeCoupons / stats.totalCoupons) * 100)}%`
              : '0%'
            }
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: stats.totalCoupons > 0
                ? `${(stats.activeCoupons / stats.totalCoupons) * 100}%`
                : '0%'
            }}
          />
        </div>
      </div>
    </div>
  );
}