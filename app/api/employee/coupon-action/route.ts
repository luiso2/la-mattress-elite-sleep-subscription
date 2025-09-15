import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { couponService } from '@/lib/services/coupon.service';

export async function POST(request: NextRequest) {
  try {
    // Verify employee token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      if (decoded.role !== 'employee') {
        return NextResponse.json(
          { error: 'Invalid employee token' },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { action, couponId, couponCode } = await request.json();

    if (!action || (!couponId && !couponCode)) {
      return NextResponse.json(
        { error: 'Action and either couponId or couponCode are required' },
        { status: 400 }
      );
    }

    if (!['mark_used', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "mark_used" or "delete"' },
        { status: 400 }
      );
    }

    let result;

    if (action === 'mark_used') {
      if (!couponId) {
        // If we have a code, find the coupon first
        if (couponCode) {
          const coupon = await couponService.getCouponByCode(couponCode);
          if (!coupon) {
            return NextResponse.json(
              { error: 'Coupon not found' },
              { status: 404 }
            );
          }
          result = await couponService.markCouponAsUsed(coupon.id);
        } else {
          return NextResponse.json(
            { error: 'Coupon ID or code is required to mark as used' },
            { status: 400 }
          );
        }
      } else {
        result = await couponService.markCouponAsUsed(parseInt(couponId));
      }
    } else if (action === 'delete') {
      if (couponId) {
        result = await couponService.deleteCoupon(parseInt(couponId));
      } else if (couponCode) {
        const coupon = await couponService.getCouponByCode(couponCode);
        if (!coupon) {
          return NextResponse.json(
            { error: 'Coupon not found' },
            { status: 404 }
          );
        }
        result = await couponService.deleteCoupon(coupon.id);
      } else {
        return NextResponse.json(
          { error: 'Coupon ID or code is required' },
          { status: 400 }
        );
      }
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || `Failed to ${action} coupon` },
        { status: 400 }
      );
    }

    console.log(`Coupon action ${action} completed successfully`);

    return NextResponse.json({
      success: true,
      action,
      message: action === 'mark_used'
        ? 'Coupon marked as used successfully'
        : 'Coupon deleted successfully'
    });

  } catch (error: any) {
    console.error('Coupon action error:', error);
    return NextResponse.json(
      { error: 'Failed to process coupon action' },
      { status: 500 }
    );
  }
}