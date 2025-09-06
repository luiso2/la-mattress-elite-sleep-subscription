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
    
    if (!user) {
      return ApiResponse.unauthorized('User not found');
    }
    
    const body = await request.json();
    const { priceId, planType } = body;

    // Validate price ID
    if (!priceId) {
      return ApiResponse.badRequest('Price ID is required');
    }

    // Map plan type to price ID if needed
    let finalPriceId = priceId;
    if (planType) {
      const priceMap: Record<string, string> = {
        basic: config.stripe.prices.basic,
        premium: config.stripe.prices.premium,
        enterprise: config.stripe.prices.enterprise,
      };
      finalPriceId = priceMap[planType.toLowerCase()] || priceId;
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      finalPriceId,
      user.stripeCustomerId,
      user.email,
      `${config.app.url}/success?session_id={CHECKOUT_SESSION_ID}`,
      `${config.app.url}/`
    );

    return ApiResponse.success({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    return ApiResponse.serverError('Failed to create checkout session', error);
  }
}