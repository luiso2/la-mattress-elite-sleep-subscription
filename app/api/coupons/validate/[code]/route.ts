import { NextRequest, NextResponse } from 'next/server';
import { couponService } from '@/lib/services/coupon.service';

// GET /api/coupons/validate/[code] - Validate a coupon code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const validation = await couponService.validateCoupon(code);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: validation.error || 'Invalid coupon'
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: validation.coupon
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/coupons/validate/[code] - Validate and use a coupon
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // First validate the coupon
    const validation = await couponService.validateCoupon(code);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error || 'Invalid coupon'
      }, { status: 400 });
    }

    // Use the coupon
    const result = await couponService.useCoupon(
      code,
      body.customerId,
      body.orderId,
      body.orderAmount
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to use coupon'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon applied successfully'
    });
  } catch (error: any) {
    console.error('Error using coupon:', error);
    return NextResponse.json(
      { error: 'Failed to use coupon', details: error.message },
      { status: 500 }
    );
  }
}