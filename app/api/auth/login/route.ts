import { NextRequest } from 'next/server';
import authService from '@/lib/services/auth.service';
import { ApiResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return ApiResponse.badRequest('Email and password are required');
    }

    // Find user by email
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return ApiResponse.unauthorized('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await authService.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return ApiResponse.unauthorized('Invalid credentials');
    }

    // Generate JWT token
    const token = authService.generateToken({
      userId: user.id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return ApiResponse.success(
      {
        user: userWithoutPassword,
        token,
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    return ApiResponse.serverError('Login failed', error);
  }
}