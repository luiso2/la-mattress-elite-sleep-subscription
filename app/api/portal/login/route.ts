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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const stripeClient = getStripe();
    
    // Demo mode when Stripe is not configured
    if (!stripeClient) {
      console.log('Running in demo mode - no real Stripe connection');
      
      // Demo customers for testing
      const demoCustomers: Record<string, any> = {
        'test@example.com': {
          id: 'cus_demo_123',
          email: 'test@example.com',
          name: 'Test User',
          hasSubscription: true,
        },
        'demo@example.com': {
          id: 'cus_demo_456',
          email: 'demo@example.com',
          name: 'Demo User',
          hasSubscription: true,
        },
      };

      const customer = demoCustomers[email.toLowerCase()];
      
      if (!customer) {
        return NextResponse.json(
          { error: 'No membership found for this email. Try test@example.com or demo@example.com for demo.' },
          { status: 404 }
        );
      }

      if (!customer.hasSubscription) {
        return NextResponse.json(
          { error: 'No active membership found' },
          { status: 404 }
        );
      }

      // Generate a JWT token for portal access
      const token = jwt.sign(
        { 
          customerId: customer.id,
          email: customer.email,
          name: customer.name,
          isDemo: true,
        },
        process.env.JWT_SECRET || 'demo-secret',
        { expiresIn: '1h' }
      );

      return NextResponse.json({
        success: true,
        token,
        customer: {
          name: customer.name,
          email: customer.email,
        },
        demo: true,
      });
    }

    // Real Stripe mode
    try {
      console.log('Searching for customer with email:', email);
      
      // Search for customer in Stripe
      const customers = await stripeClient.customers.search({
        query: `email:"${email}"`,
      });

      console.log('Found customers:', customers.data.length);

      if (!customers.data.length) {
        return NextResponse.json(
          { error: 'No membership found for this email' },
          { status: 404 }
        );
      }

      const customer = customers.data[0];
      console.log('Customer found:', customer.id, customer.email);

      // Check if customer has any subscriptions (active, trialing, or past_due)
      const subscriptions = await stripeClient.subscriptions.list({
        customer: customer.id,
        status: 'all', // Get all subscriptions first
      });

      console.log('Total subscriptions found:', subscriptions.data.length);
      
      // Filter for active subscriptions
      const activeSubscriptions = subscriptions.data.filter(sub => 
        ['active', 'trialing', 'past_due'].includes(sub.status)
      );

      console.log('Active subscriptions:', activeSubscriptions.length);

      // For now, allow access even without active subscription if customer exists
      // This allows existing customers to access the portal to resubscribe
      const hasActiveSubscription = activeSubscriptions.length > 0;

      // Generate a JWT token for portal access
      const token = jwt.sign(
        { 
          customerId: customer.id,
          email: customer.email,
          name: customer.name || 'Member',
          hasActiveSubscription,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      return NextResponse.json({
        success: true,
        token,
        customer: {
          name: customer.name || 'Member',
          email: customer.email,
        },
        hasActiveSubscription,
        message: hasActiveSubscription 
          ? 'Welcome back!' 
          : 'Welcome! You can reactivate your subscription in the portal.',
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

  } catch (error: any) {
    console.error('Portal login error:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred during login',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}