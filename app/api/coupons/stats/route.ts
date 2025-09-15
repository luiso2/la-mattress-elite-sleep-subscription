import { NextRequest, NextResponse } from 'next/server';
import { couponService } from '@/lib/services/coupon.service';
import authService from '@/lib/services/auth.service';
import jwt from 'jsonwebtoken';

// GET /api/coupons/stats - Get coupon statistics (for employees)
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

    // Verify if it's an employee token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      // Check if it's an employee
      if (decoded.role !== 'employee') {
        // If not employee, verify regular user token
        const payload = authService.verifyToken(token);
        if (!payload) {
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          );
        }
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const stats = await couponService.getCouponStats();

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching coupon stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupon statistics', details: error.message },
      { status: 500 }
    );
  }
}