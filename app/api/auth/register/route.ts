import { NextRequest } from 'next/server';
import authService from '@/lib/services/auth.service';
import stripeService from '@/lib/services/stripe.service';
import emailService from '@/lib/services/email.service';
import { ApiResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return ApiResponse.badRequest('Email and password are required');
    }

    // Check if user already exists
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return ApiResponse.badRequest('User already exists');
    }

    // Create Stripe customer
    const stripeCustomer = await stripeService.createCustomer(email, name);

    // Create user
    const user = await authService.createUser(email, password, name);
    
    // Update user with Stripe customer ID
    await authService.updateUser(user.id, {
      stripeCustomerId: stripeCustomer.id,
    });

    // Generate JWT token
    const token = authService.generateToken({
      userId: user.id,
      email: user.email,
      stripeCustomerId: stripeCustomer.id,
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(email, name);

    return ApiResponse.success(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stripeCustomerId: stripeCustomer.id,
        },
        token,
      },
      'Registration successful',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return ApiResponse.serverError('Registration failed', error);
  }
}