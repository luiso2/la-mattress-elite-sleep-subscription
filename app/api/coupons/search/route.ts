import { NextRequest, NextResponse } from 'next/server';
import { couponService } from '@/lib/services/coupon.service';
import authService from '@/lib/services/auth.service';
import { Op } from 'sequelize';

// GET /api/coupons/search - Search coupons with various filters
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
    const code = searchParams.get('code');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { Coupon, Customer } = await import('@/lib/database/models');

    // Build where clause
    const whereClause: any = {};
    const includeClause: any[] = [];

    if (code) {
      whereClause.code = {
        [Op.iLike]: `%${code}%`
      };
    }

    if (status) {
      whereClause.status = status;
    }

    // If searching by email, need to join with Customer
    if (email) {
      includeClause.push({
        model: Customer,
        as: 'customer',
        where: {
          email: {
            [Op.iLike]: `%${email}%`
          }
        },
        required: true
      });
    } else {
      includeClause.push({
        model: Customer,
        as: 'customer',
        required: false
      });
    }

    // Update expired coupons first
    await couponService.updateExpiredCoupons();

    // Search coupons
    const { rows: coupons, count: total } = await Coupon.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({
      success: true,
      coupons,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error searching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to search coupons', details: error.message },
      { status: 500 }
    );
  }
}