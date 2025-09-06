import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import stripeService from '@/lib/services/stripe.service';
import authService from '@/lib/services/auth.service';
import emailService from '@/lib/services/email.service';
import { ApiResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const { user } = authResult;

    // Check if user has an active subscription
    if (!user || !user.stripeCustomerId) {
      return ApiResponse.badRequest('No subscription found');
    }

    // Get active subscriptions
    const subscriptions = await stripeService.getCustomerSubscriptions(user.stripeCustomerId);
    if (subscriptions.length === 0) {
      return ApiResponse.badRequest('No active subscription found');
    }

    // Cancel the subscription
    const canceledSubscription = await stripeService.cancelSubscription(subscriptions[0].id);

    // Update user data
    await authService.updateUser(user.id, {
      subscriptionStatus: 'canceled',
      subscriptionId: undefined,
    });

    // Send cancellation email
    await emailService.sendCancellationConfirmation(user.email);

    return ApiResponse.success({
      message: 'Subscription cancelled successfully',
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceledAt: canceledSubscription.canceled_at ? new Date(canceledSubscription.canceled_at * 1000).toISOString() : null,
        currentPeriodEnd: new Date((canceledSubscription as any).current_period_end * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return ApiResponse.serverError('Failed to cancel subscription', error);
  }
}