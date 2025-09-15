import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminToken } from '@/lib/services/superadmin.service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // First, delete associated coupons
    await Coupon.destroy({
      where: { customerId: params.id }
    });

    // Then delete the customer
    const result = await Customer.destroy({
      where: { id: params.id }
    });

    if (result === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Customer and associated coupons deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}