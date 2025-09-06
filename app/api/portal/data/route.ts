import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

let stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      console.warn('Stripe is not properly configured - using demo mode');
      return null;
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripe;
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify the token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { customerId, email, name, isDemo, hasActiveSubscription } = decoded;

    // Handle demo mode
    if (isDemo || !getStripe()) {
      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      
      return NextResponse.json({
        customer: {
          name: name || 'Demo Member',
          email: email,
          created: new Date().toISOString(),
        },
        subscription: {
          status: 'active',
          current_period_end: Math.floor(nextMonth.getTime() / 1000),
          cancel_at_period_end: false,
        },
        credits: {
          available: 15,
          monthly: 15,
          used: 0,
        },
        protectorReplacements: {
          available: 3,
          used: 0,
          total: 3,
        },
        demo: true,
      });
    }

    // Real Stripe mode
    const stripeClient = getStripe()!;
    
    try {
      // Fetch customer data from Stripe
      const customer = await stripeClient.customers.retrieve(customerId);

      // Fetch active subscriptions
      const subscriptions = await stripeClient.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1,
      });

      const activeSubscriptions = subscriptions.data.filter(sub => 
        ['active', 'trialing', 'past_due'].includes(sub.status)
      );

      // If no active subscription, return limited data
      if (!activeSubscriptions.length) {
        return NextResponse.json({
          customer: {
            name: name || (customer as any).name || 'Member',
            email: (customer as any).email || email,
            created: (customer as any).created ? new Date((customer as any).created * 1000).toISOString() : new Date().toISOString(),
          },
          subscription: {
            status: 'inactive',
            current_period_end: null,
            cancel_at_period_end: false,
          },
          credits: {
            available: 0,
            monthly: 0,
            used: 0,
          },
          protectorReplacements: {
            available: 0,
            used: 0,
            total: 0,
          },
          message: 'No active subscription. Visit the pricing page to subscribe.',
          showReactivateButton: true,
        });
      }

      const subscription = activeSubscriptions[0];

      // Calculate credits (for demonstration, we'll use metadata or default values)
      // In a real app, you'd track this in a database
      const currentMonth = new Date().getMonth();
      const subscriptionStartMonth = new Date(subscription.created * 1000).getMonth();
      const monthsActive = Math.max(1, currentMonth - subscriptionStartMonth + 1);
      
      // Determine credits based on subscription plan
      let monthlyCredits = 15; // Default
      const priceId = subscription.items.data[0]?.price.id;
      
      // You can map price IDs to credit amounts here
      // For example:
      // if (priceId === 'price_basic') monthlyCredits = 10;
      // if (priceId === 'price_premium') monthlyCredits = 15;
      // if (priceId === 'price_enterprise') monthlyCredits = 25;
      
      const credits = {
        available: monthlyCredits,
        monthly: monthlyCredits,
        used: 0,
        total: monthsActive * monthlyCredits,
      };

      const protectorReplacements = {
        available: 3,
        used: 0,
        total: 3,
      };

      // Check if customer metadata exists, otherwise use defaults
      const customerMetadata = (customer as any).metadata || {};
      
      return NextResponse.json({
        customer: {
          name: name || (customer as any).name || 'Member',
          email: (customer as any).email || email,
          created: (customer as any).created ? new Date((customer as any).created * 1000).toISOString() : new Date().toISOString(),
        },
        subscription: {
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          plan: subscription.items.data[0]?.price.nickname || 'Premium',
        },
        credits: {
          available: parseInt(customerMetadata.credits_available || credits.available.toString()),
          monthly: parseInt(customerMetadata.credits_monthly || credits.monthly.toString()),
          used: parseInt(customerMetadata.credits_used || credits.used.toString()),
        },
        protectorReplacements: {
          available: parseInt(customerMetadata.protector_available || protectorReplacements.available.toString()),
          used: parseInt(customerMetadata.protector_used || protectorReplacements.used.toString()),
          total: parseInt(customerMetadata.protector_total || protectorReplacements.total.toString()),
        },
      });
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      
      if (stripeError.type === 'StripeAuthenticationError') {
        return NextResponse.json(
          { error: 'Stripe authentication failed. Please check your API keys.' },
          { status: 503 }
        );
      }
      
      throw stripeError;
    }

  } catch (error) {
    console.error('Portal data error:', error);
    return NextResponse.json(
      { error: 'An error occurred fetching portal data' },
      { status: 500 }
    );
  }
}