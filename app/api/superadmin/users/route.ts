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

    // Import models dynamically to avoid client-side issues
    const { User } = await import('@/lib/database/models');

    // Get all users with correct User model attributes
    const users = await User.findAll({
      attributes: ['id', 'email', 'customerId', 'stripeCustomerId', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({
      success: true,
      users: users.map(user => user.toJSON())
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}