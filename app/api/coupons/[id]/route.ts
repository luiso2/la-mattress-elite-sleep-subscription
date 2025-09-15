import { NextRequest, NextResponse } from 'next/server';
import { couponService } from '@/lib/services/coupon.service';
import authService from '@/lib/services/auth.service';

// GET /api/coupons/[id] - Get a specific coupon
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { Coupon } = await import('@/lib/database/models');
    const coupon = await Coupon.findByPk(params.id, {
      include: [{
        model: (await import('@/lib/database/models')).Customer,
        as: 'customer'
      }]
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon
    });
  } catch (error: any) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupon', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/coupons/[id] - Update coupon status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    if (!['active', 'expired', 'used', 'cancelled'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const result = await couponService.updateCouponStatus(
      parseInt(params.id),
      body.status
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update coupon' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon status updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/coupons/[id] - Delete a coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await couponService.deleteCoupon(parseInt(params.id));

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete coupon' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon', details: error.message },
      { status: 500 }
    );
  }
}