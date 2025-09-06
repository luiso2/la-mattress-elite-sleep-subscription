import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

let stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      console.warn('Stripe is not properly configured');
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
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { customerId, email, name, hasActiveSubscription } = decoded;

    // Check if Stripe is properly configured
    const stripeClient = getStripe();
    if (!stripeClient) {
      return NextResponse.json(
        { error: 'Payment system is not properly configured' },
        { status: 503 }
      );
    }
    
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
            reserved: 0,
            total: 0,
          },
          protectorReplacements: {
            available: 0,
            used: 0,
            total: 0,
            protectors: [],
          },
          message: 'No active subscription. Visit the pricing page to subscribe.',
          showReactivateButton: true,
        });
      }

      const subscription = activeSubscriptions[0];

      // Get all paid invoices for this customer to calculate total credits
      const invoices = await stripeClient.invoices.list({
        customer: customerId,
        status: 'paid',
        limit: 100, // Get up to 100 invoices
      });

      // Filter invoices that are related to subscriptions (not one-time payments)
      const subscriptionInvoices = invoices.data.filter(invoice => invoice.subscription !== null);
      
      // Calculate total credits: $15 per paid invoice
      const creditsPerPayment = 15;
      const totalPayments = subscriptionInvoices.length;
      const totalCredits = totalPayments * creditsPerPayment;
      
      // For credits used and reserved, check customer metadata (or default to 0)
      const customerMetadata = (customer as any).metadata || {};
      const creditsUsed = parseInt(customerMetadata.credits_used || '0');
      const creditsReserved = parseInt(customerMetadata.credits_reserved || '0');
      
      const credits = {
        available: totalCredits - creditsUsed - creditsReserved,
        monthly: creditsPerPayment,
        used: creditsUsed,
        reserved: creditsReserved,
        total: totalCredits,
      };

      // Protector replacements logic - read from metadata
      let protectorUsedCount = 0;
      const protectorDetails = [];
      
      for (let i = 1; i <= 3; i++) {
        const isUsed = customerMetadata[`protector_${i}_used`] === 'true';
        if (isUsed) protectorUsedCount++;
        
        protectorDetails.push({
          number: i,
          used: isUsed,
          date: customerMetadata[`protector_${i}_date`] || null,
        });
      }
      
      const protectorReplacements = {
        available: 3 - protectorUsedCount,
        used: protectorUsedCount,
        total: 3,
        protectors: protectorDetails,
      };
      
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
          available: credits.available,
          monthly: credits.monthly,
          used: credits.used,
          reserved: credits.reserved,
          total: credits.total,
        },
        protectorReplacements: {
          available: protectorReplacements.available,
          used: protectorReplacements.used,
          total: protectorReplacements.total,
          protectors: protectorReplacements.protectors,
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