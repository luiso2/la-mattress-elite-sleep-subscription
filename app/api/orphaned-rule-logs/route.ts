import { NextRequest, NextResponse } from 'next/server';
import { OrphanedRuleLogService } from '@/lib/services/orphaned-rule-log.service';
import authService from '@/lib/services/auth.service';

// GET /api/orphaned-rule-logs - Get orphaned rule logs with various filters
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const couponCode = searchParams.get('couponCode');
    const priceRuleId = searchParams.get('priceRuleId');
    const resolved = searchParams.get('resolved');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const action = searchParams.get('action');

    // Handle different actions
    if (action === 'stats') {
      const result = await OrphanedRuleLogService.getLogStats();
      return NextResponse.json(result);
    }

    if (action === 'unresolved') {
      const result = await OrphanedRuleLogService.getUnresolvedLogs();
      return NextResponse.json(result);
    }

    // Search by coupon code
    if (couponCode) {
      const result = await OrphanedRuleLogService.findLogsByCouponCode(couponCode);
      return NextResponse.json(result);
    }

    // Search by price rule ID
    if (priceRuleId) {
      const result = await OrphanedRuleLogService.findLogsByPriceRuleId(priceRuleId);
      return NextResponse.json(result);
    }

    // Get logs with pagination
    const resolvedFilter = resolved !== null ? resolved === 'true' : undefined;
    const result = await OrphanedRuleLogService.getLogsWithPagination(page, limit, resolvedFilter);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error fetching orphaned rule logs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch orphaned rule logs',
        details: error.message 
      },
      { status: 500 }
    );
  }
}