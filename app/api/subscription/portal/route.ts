import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import stripeService from '@/lib/services/stripe.service';
import { ApiResponse } from '@/lib/utils/api-response';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const { user } = authResult;

    // Check if user has a Stripe customer ID
    if (!user || !user.stripeCustomerId) {
      return ApiResponse.badRequest('No Stripe customer found for this user');
    }

    // Create billing portal session
    const session = await stripeService.createBillingPortalSession(
      user.stripeCustomerId,
      `${config.app.url}/dashboard`
    );

    return ApiResponse.success({
      portalUrl: session.url,
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    return ApiResponse.serverError('Failed to create portal session', error);
  }
}