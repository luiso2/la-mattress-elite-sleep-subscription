import { NextRequest } from 'next/server';
import stripeService from '@/lib/services/stripe.service';
import authService from '@/lib/services/auth.service';
import emailService from '@/lib/services/email.service';
import { ApiResponse } from '@/lib/utils/api-response';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return ApiResponse.badRequest('No stripe signature found');
    }

    // Get raw body
    const body = await request.text();
    
    // Construct and verify webhook event
    const event = await stripeService.constructWebhookEvent(body, signature);
    
    if (!event) {
      return ApiResponse.badRequest('Invalid webhook signature');
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return ApiResponse.success({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return ApiResponse.serverError('Webhook processing failed', error);
  }
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  if (session.mode === 'subscription' && session.subscription) {
    const customerId = session.customer as string;
    const customer = await stripeService.getCustomer(customerId);
    
    if (customer && customer.email) {
      // Update user with subscription info
      await authService.updateUserByEmail(customer.email, {
        stripeCustomerId: customerId,
        subscriptionId: session.subscription as string,
        subscriptionStatus: 'active',
      });

      // Send confirmation email
      await emailService.sendSubscriptionConfirmation(customer.email, 'Premium');
    }
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customer = await stripeService.getCustomer(subscription.customer as string);
  
  if (customer && customer.email) {
    await authService.updateUserByEmail(customer.email, {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    });

    // Determine plan name from price
    const priceId = subscription.items.data[0].price.id;
    let planName = 'Premium';
    // You can map price IDs to plan names here

    await emailService.sendSubscriptionConfirmation(customer.email, planName);
  }
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customer = await stripeService.getCustomer(subscription.customer as string);
  
  if (customer && customer.email) {
    await authService.updateUserByEmail(customer.email, {
      subscriptionStatus: subscription.status,
    });
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customer = await stripeService.getCustomer(subscription.customer as string);
  
  if (customer && customer.email) {
    await authService.updateUserByEmail(customer.email, {
      subscriptionId: undefined,
      subscriptionStatus: 'canceled',
    });

    await emailService.sendCancellationConfirmation(customer.email);
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as any;
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  
  // Update subscription status if needed
  if (invoice.subscription) {
    const subscription = await stripeService.getSubscription(invoice.subscription as string);
    const customer = await stripeService.getCustomer(subscription.customer as string);
    
    if (customer && customer.email) {
      await authService.updateUserByEmail(customer.email, {
        subscriptionStatus: 'active',
      });
    }
  }
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as any;
  const customer = await stripeService.getCustomer(invoice.customer as string);
  
  if (customer && customer.email) {
    await emailService.sendPaymentFailedEmail(customer.email);
    
    // Update subscription status
    await authService.updateUserByEmail(customer.email, {
      subscriptionStatus: 'past_due',
    });
  }
}

// Disable body parsing for this route (Stripe needs raw body)
export const runtime = 'nodejs';