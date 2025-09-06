import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { ApiResponse } from '@/lib/utils/api-response';
import stripeService from '@/lib/services/stripe.service';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const { user } = authResult;

    // Get subscription details if user has a Stripe customer ID
    let subscriptionData = null;
    if (user && user.stripeCustomerId) {
      const subscriptions = await stripeService.getCustomerSubscriptions(user.stripeCustomerId);
      if (subscriptions.length > 0) {
        const activeSubscription = subscriptions[0] as any;
        subscriptionData = {
          id: activeSubscription.id,
          status: activeSubscription.status,
          currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
          priceId: activeSubscription.items.data[0].price.id,
        };
      }
    }

    return ApiResponse.success({
      user: {
        ...user,
        subscription: subscriptionData,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return ApiResponse.serverError('Failed to get user data', error);
  }
}