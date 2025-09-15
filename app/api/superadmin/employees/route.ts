import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminToken } from '@/lib/services/superadmin.service';
import bcrypt from 'bcryptjs';

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
    const { Employee } = await import('@/lib/database/server-only');

    // Get all employees
    const employees = await Employee.findAll({
      attributes: ['id', 'email', 'name', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({
      success: true,
      employees: employees.map(emp => emp.toJSON())
    });

  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
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

    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // Import models dynamically
    const { Employee } = await import('@/lib/database/server-only');

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ where: { email } });
    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create employee
    const employee = await Employee.create({
      email,
      name,
      password: hashedPassword,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        isActive: employee.isActive,
        createdAt: employee.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}