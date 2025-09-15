import { NextRequest, NextResponse } from 'next/server';
import { couponService } from '@/lib/services/coupon.service';
import authService from '@/lib/services/auth.service';

// GET /api/coupons - Get all coupons (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authService.extractTokenFromHeader(authHeader || '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    // Get user data
    const user = await authService.findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let coupons;

    if (email) {
      // Get coupons by email
      coupons = await couponService.getCouponsByEmail(email);
    } else if (customerId) {
      // Get coupons by customer ID
      if (status === 'active') {
        coupons = await couponService.getActiveCoupons(parseInt(customerId));
      } else {
        const { Coupon } = await import('@/lib/database/models');
        coupons = await Coupon.findAll({
          where: { customerId: parseInt(customerId) },
          order: [['createdAt', 'DESC']]
        });
      }
    } else if (user.customerId) {
      // Get coupons for authenticated user
      if (status === 'active') {
        coupons = await couponService.getActiveCoupons(user.customerId);
      } else {
        coupons = await couponService.getCouponsByEmail(user.email);
      }
    } else {
      coupons = [];
    }

    return NextResponse.json({
      success: true,
      coupons
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/coupons - Create a new coupon
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authService.extractTokenFromHeader(authHeader || '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['customerEmail', 'customerName', 'code', 'discountType', 'discountValue', 'validFrom', 'validUntil'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate discount type
    if (!['percentage', 'fixed_amount'].includes(body.discountType)) {
      return NextResponse.json(
        { error: 'Invalid discount type. Must be "percentage" or "fixed_amount"' },
        { status: 400 }
      );
    }

    // Validate discount value
    if (body.discountType === 'percentage' && (body.discountValue < 0 || body.discountValue > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Create coupon
    const result = await couponService.createCoupon({
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      code: body.code,
      discountType: body.discountType,
      discountValue: body.discountValue,
      description: body.description,
      validFrom: new Date(body.validFrom),
      validUntil: new Date(body.validUntil),
      maxUses: body.maxUses,
      minimumPurchase: body.minimumPurchase,
      appliesTo: body.appliesTo
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create coupon' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: result.coupon
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon', details: error.message },
      { status: 500 }
    );
  }
}