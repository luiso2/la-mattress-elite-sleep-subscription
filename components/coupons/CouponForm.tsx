'use client';

import { useState } from 'react';

interface CouponFormProps {
  onSubmit: (data: CouponFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CouponFormData>;
  customerEmail?: string;
  customerName?: string;
}

export interface CouponFormData {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  description?: string;
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  minimumPurchase?: number;
  appliesTo?: string;
}

export default function CouponForm({
  onSubmit,
  onCancel,
  initialData,
  customerEmail,
  customerName
}: CouponFormProps) {
  const [formData, setFormData] = useState<CouponFormData>({
    customerEmail: customerEmail || initialData?.customerEmail || '',
    customerName: customerName || initialData?.customerName || '',
    customerPhone: initialData?.customerPhone || '',
    code: initialData?.code || '',
    discountType: initialData?.discountType || 'percentage',
    discountValue: initialData?.discountValue || 10,
    description: initialData?.description || '',
    validFrom: initialData?.validFrom || new Date().toISOString().split('T')[0],
    validUntil: initialData?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUses: initialData?.maxUses || 1,
    minimumPurchase: initialData?.minimumPurchase || 0,
    appliesTo: initialData?.appliesTo || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCode = () => {
    const prefix = 'SAVE';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, code: `${prefix}${random}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate form
      if (!formData.customerEmail || !formData.customerName || !formData.code) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.discountType === 'percentage' && (formData.discountValue < 0 || formData.discountValue > 100)) {
        throw new Error('Percentage discount must be between 0 and 100');
      }

      if (formData.discountValue <= 0) {
        throw new Error('Discount value must be greater than 0');
      }

      const validFrom = new Date(formData.validFrom);
      const validUntil = new Date(formData.validUntil);

      if (validFrom >= validUntil) {
        throw new Error('Valid until date must be after valid from date');
      }

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900">Create New Coupon</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Email *
          </label>
          <input
            type="email"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            required
            disabled={!!customerEmail}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name *
          </label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            required
            disabled={!!customerName}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Coupon Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Coupon Code *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            placeholder="e.g., SAVE20"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={generateCode}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Generate
          </button>
        </div>
      </div>

      {/* Discount Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Type *
          </label>
          <select
            name="discountType"
            value={formData.discountType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed_amount">Fixed Amount ($)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Value *
          </label>
          <input
            type="number"
            name="discountValue"
            value={formData.discountValue}
            onChange={handleChange}
            required
            min="0"
            max={formData.discountType === 'percentage' ? 100 : undefined}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={2}
          placeholder="e.g., Special discount for loyal customers"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Validity Period */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valid From *
          </label>
          <input
            type="date"
            name="validFrom"
            value={formData.validFrom}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valid Until *
          </label>
          <input
            type="date"
            name="validUntil"
            value={formData.validUntil}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Usage Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Uses
          </label>
          <input
            type="number"
            name="maxUses"
            value={formData.maxUses}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Purchase ($)
          </label>
          <input
            type="number"
            name="minimumPurchase"
            value={formData.minimumPurchase}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Coupon'}
        </button>
      </div>
    </form>
  );
}