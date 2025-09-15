import { NextRequest, NextResponse } from 'next/server';
import { superAdminService } from '@/lib/services/superadmin.service';

// Middleware to verify super admin token
async function verifySuperAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = superAdminService.extractTokenFromHeader(authHeader || '');

  if (!token) {
    return null;
  }

  return superAdminService.verifyToken(token);
}

// GET /api/superadmin/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const admin = await verifySuperAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await superAdminService.getDashboardStats();

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}