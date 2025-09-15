import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminToken } from '@/lib/services/superadmin.service';

export async function GET(request: NextRequest) {
  try {
    // Verify super admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const admin = await verifySuperAdminToken(token);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Import models dynamically
    const { Coupon, Customer } = await import('@/lib/database/models');

    // Get all coupons with customer info
    const coupons = await Coupon.findAll({
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'email'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    // Format coupons for frontend
    const formattedCoupons = coupons.map(coupon => {
      const couponData = coupon.toJSON();

      return {
        id: couponData.id,
        code: couponData.code,
        discountType: couponData.discountType,
        discountValue: parseFloat(couponData.discountValue || 0),
        description: couponData.description,
        validUntil: couponData.validUntil,
        status: couponData.status,
        minimumPurchase: couponData.minimumPurchase ? parseFloat(couponData.minimumPurchase) : undefined,
        currentUses: couponData.currentUses || 0,
        maxUses: couponData.maxUses,
        customer: couponData.customer
      };
    });

    return NextResponse.json({
      success: true,
      coupons: formattedCoupons
    });

  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}