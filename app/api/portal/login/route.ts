import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key is not configured');
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

    // Search for customer in Stripe
    const customers = await getStripe().customers.search({
      query: `email:"${email}"`,
    });

    if (!customers.data.length) {
      return NextResponse.json(
        { error: 'No membership found for this email' },
        { status: 404 }
      );
    }

    const customer = customers.data[0];

    // Check if customer has an active subscription
    const subscriptions = await getStripe().subscriptions.list({
      customer: customer.id,
      status: 'active',
    });

    if (!subscriptions.data.length) {
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
        name: customer.name || 'Member',
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
    });

  } catch (error) {
    console.error('Portal login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}