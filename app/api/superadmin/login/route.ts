import { NextRequest, NextResponse } from 'next/server';
import { superAdminService } from '@/lib/services/superadmin.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await superAdminService.authenticate(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      admin: result.admin
    });
  } catch (error: any) {
    console.error('Super admin login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}