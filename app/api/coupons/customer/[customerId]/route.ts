import { NextRequest, NextResponse } from 'next/server';
import { couponService } from '@/lib/services/coupon.service';
import authService from '@/lib/services/auth.service';

// GET /api/coupons/customer/[customerId] - Get coupons for a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
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

    const customerId = parseInt(params.customerId);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeHistory = searchParams.get('includeHistory') === 'true';

    let coupons;
    let history;

    if (status === 'active') {
      coupons = await couponService.getActiveCoupons(customerId);
    } else {
      const { Coupon, Customer } = await import('@/lib/database/models');

      // Get customer with coupons
      const customer = await Customer.findByPk(customerId, {
        include: [{
          model: Coupon,
          as: 'coupons',
          order: [['createdAt', 'DESC']]
        }]
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      coupons = customer.coupons || [];
    }

    // Get usage history if requested
    if (includeHistory) {
      history = await couponService.getCouponHistory(customerId);
    }

    return NextResponse.json({
      success: true,
      coupons,
      history
    });
  } catch (error: any) {
    console.error('Error fetching customer coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer coupons', details: error.message },
      { status: 500 }
    );
  }
}