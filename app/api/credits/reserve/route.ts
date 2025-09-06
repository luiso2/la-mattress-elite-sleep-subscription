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

export async function POST(request: NextRequest) {
  try {
    // Verify customer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const stripeClient = getStripe();
    if (!stripeClient) {
      return NextResponse.json(
        { error: 'Payment system is not properly configured' },
        { status: 503 }
      );
    }

    const customerId = decoded.customerId;

    // Get all paid invoices to calculate available credits
    const invoices = await stripeClient.invoices.list({
      customer: customerId,
      status: 'paid',
      limit: 100,
    });

    // Calculate total credits earned
    const subscriptionInvoices = invoices.data.filter(invoice => invoice.subscription !== null);
    const totalCredits = subscriptionInvoices.length * 15;

    // Get current metadata
    const customer = await stripeClient.customers.retrieve(customerId);
    const currentMetadata = (customer as any).metadata || {};
    
    const creditsUsed = parseInt(currentMetadata.credits_used || '0');
    const creditsReserved = parseInt(currentMetadata.credits_reserved || '0');
    const availableCredits = totalCredits - creditsUsed - creditsReserved;

    // Check if customer has enough available credits
    if (amount > availableCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. Available: $${availableCredits}` },
        { status: 400 }
      );
    }

    // Update customer metadata with reserved credits
    await stripeClient.customers.update(customerId, {
      metadata: {
        ...currentMetadata,
        credits_reserved: (creditsReserved + amount).toString(),
        reservation_date: new Date().toISOString(),
        reservation_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reserved $${amount} in credits`,
      reserved: amount,
      newAvailable: availableCredits - amount,
    });

  } catch (error: any) {
    console.error('Credit reservation error:', error);
    return NextResponse.json(
      { error: 'Failed to reserve credits' },
      { status: 500 }
    );
  }
}