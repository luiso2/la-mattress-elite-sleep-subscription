import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminToken } from '@/lib/services/superadmin.service';
import { Op } from 'sequelize';

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
    const { Customer, Coupon } = await import('@/lib/database/models');

    // Get all customers with coupon count
    const customers = await Customer.findAll({
      attributes: [
        'id',
        'email',
        'name',
        'phoneNumber',
        'createdAt'
      ],
      include: [{
        model: Coupon,
        as: 'coupons',
        attributes: [],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    // Get coupon counts for each customer
    const customersWithCounts = await Promise.all(
      customers.map(async (customer) => {
        const couponCount = await Coupon.count({
          where: { customerId: customer.id }
        });

        return {
          ...customer.toJSON(),
          couponsGenerated: couponCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      customers: customersWithCounts
    });

  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Import models and Stripe
    const { Customer, Coupon } = await import('@/lib/database/models');
    const Stripe = (await import('stripe')).default;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });

    // Search for customer by email
    const customer = await Customer.findOne({
      where: { email },
      include: [{
        model: Coupon,
        as: 'coupons',
        attributes: ['id', 'code', 'discountType', 'discountValue', 'status', 'validUntil', 'currentUses', 'maxUses', 'createdAt']
      }]
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get cashback data from Stripe
    let cashbackBalance = 0;
    let cashbackHistory: any[] = [];

    try {
      const stripeCustomers = await stripe.customers.list({ email, limit: 1 });

      if (stripeCustomers.data.length > 0) {
        const stripeCustomer = stripeCustomers.data[0];
        const metadata = stripeCustomer.metadata || {};

        cashbackBalance = parseFloat(metadata.cashback_balance || '0');

        if (metadata.cashback_history) {
          const compactHistory = JSON.parse(metadata.cashback_history);

          // Convert compact format back to full format for display
          cashbackHistory = compactHistory.map((tx: any, index: number) => ({
            id: `cb_${index}`,
            date: tx.d + 'T00:00:00.000Z',
            amount: tx.a,
            cashback: tx.c,
            description: tx.desc,
            employee: tx.e,
            employeeEmail: '',
            type: tx.t === 'e' ? 'earned' : 'used'
          }));
        }
      }
    } catch (stripeError) {
      console.warn('Could not fetch Stripe data for customer:', stripeError);
    }

    return NextResponse.json({
      success: true,
      customer: {
        ...customer.toJSON(),
        couponsGenerated: customer.coupons?.length || 0,
        cashbackBalance,
        cashbackHistory
      }
    });

  } catch (error: any) {
    console.error('Error searching customer:', error);
    return NextResponse.json(
      { error: 'Failed to search customer' },
      { status: 500 }
    );
  }
}