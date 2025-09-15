import { NextRequest, NextResponse } from 'next/server';
import { superAdminService } from '@/lib/services/superadmin.service';

// POST /api/superadmin/setup - Initial setup for super admin
export async function POST(request: NextRequest) {
  try {
    // Check if super admin already exists
    const exists = await superAdminService.checkSuperAdminExists();

    if (exists) {
      return NextResponse.json(
        { error: 'Super admin already exists' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const result = await superAdminService.createSuperAdmin({
      email,
      password,
      name
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create super admin' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
      admin: result.admin
    });
  } catch (error: any) {
    console.error('Super admin setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/superadmin/setup - Check if super admin exists
export async function GET() {
  try {
    const exists = await superAdminService.checkSuperAdminExists();

    return NextResponse.json({
      exists,
      needsSetup: !exists
    });
  } catch (error: any) {
    console.error('Super admin check error:', error);
    return NextResponse.json(
      { error: 'Check failed', details: error.message },
      { status: 500 }
    );
  }
}