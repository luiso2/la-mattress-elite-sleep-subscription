import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminToken } from '@/lib/services/superadmin.service';
import { employeeSyncService } from '@/lib/services/employee-sync.service';

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

    console.log('Starting employee sync from .env to database...');

    // Sync employees from .env to database
    const result = await employeeSyncService.syncEmployeesToDatabase();

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to sync employees',
          details: result
        },
        { status: 500 }
      );
    }

    console.log(`Employee sync completed: ${result.created} created, ${result.updated} updated, ${result.total} total`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.total} employees from .env file`,
      details: {
        created: result.created,
        updated: result.updated,
        total: result.total
      }
    });

  } catch (error: any) {
    console.error('Error syncing employees:', error);
    return NextResponse.json(
      { error: 'Failed to sync employees' },
      { status: 500 }
    );
  }
}

// GET endpoint to check what employees are defined in .env
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

    // Get employees from .env file
    const envEmployees = employeeSyncService.getEmployeesFromEnv();

    return NextResponse.json({
      success: true,
      envEmployees: envEmployees.map(emp => ({
        email: emp.email,
        name: emp.name
        // Don't expose password
      })),
      count: envEmployees.length
    });

  } catch (error: any) {
    console.error('Error fetching env employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch env employees' },
      { status: 500 }
    );
  }
}