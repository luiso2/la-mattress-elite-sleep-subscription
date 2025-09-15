import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminToken } from '@/lib/services/superadmin.service';
import { employeeSyncService } from '@/lib/services/employee-sync.service';

export async function PATCH(
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

    const { isActive } = await request.json();
    const employeeId = params.id;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean value' },
        { status: 400 }
      );
    }

    // Toggle employee status
    const result = await employeeSyncService.toggleEmployeeStatus(employeeId, isActive);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update employee status' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Employee status updated to ${isActive ? 'active' : 'inactive'}`
    });

  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { name, email, password } = await request.json();
    const employeeId = params.id;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Update employee
    const result = await employeeSyncService.updateEmployee(employeeId, { name, email, password });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update employee' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      employee: result.employee
    });

  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

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

    const employeeId = params.id;

    // Delete employee
    const result = await employeeSyncService.deleteEmployee(employeeId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete employee' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
