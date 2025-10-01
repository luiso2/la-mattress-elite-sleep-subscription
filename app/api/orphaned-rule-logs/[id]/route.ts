import { NextRequest, NextResponse } from 'next/server';
import { OrphanedRuleLogService } from '@/lib/services/orphaned-rule-log.service';
import authService from '@/lib/services/auth.service';

// PATCH /api/orphaned-rule-logs/[id] - Mark log as resolved
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
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

    const logId = parseInt(params.id);
    if (isNaN(logId)) {
      return NextResponse.json(
        { error: 'Invalid log ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'resolve') {
      const result = await OrphanedRuleLogService.markAsResolved(logId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error updating orphaned rule log:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update orphaned rule log',
        details: error.message 
      },
      { status: 500 }
    );
  }
}