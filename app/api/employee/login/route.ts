import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Get employees from environment variables
function getEmployees() {
  const employees = [];
  for (let i = 1; i <= 9; i++) {
    const email = process.env[`EMPLOYEE_${i}_EMAIL`];
    const password = process.env[`EMPLOYEE_${i}_PASSWORD`];
    const name = process.env[`EMPLOYEE_${i}_NAME`];
    
    if (email && password && name) {
      employees.push({ email, password, name, id: `emp_${i}` });
    }
  }
  return employees;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get employees from environment
    const employees = getEmployees();

    // Find employee
    const employee = employees.find(
      emp => emp.email.toLowerCase() === email.toLowerCase() && emp.password === password
    );

    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token for employee
    const token = jwt.sign(
      { 
        employeeId: employee.id,
        email: employee.email,
        name: employee.name,
        role: 'employee',
        isEmployee: true,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' } // 8 hour shift
    );

    return NextResponse.json({
      success: true,
      token,
      employee: {
        name: employee.name,
        email: employee.email,
      },
    });

  } catch (error: any) {
    console.error('Employee login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}