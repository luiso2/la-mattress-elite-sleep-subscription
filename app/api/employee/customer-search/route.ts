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
    // Verify employee token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      if (decoded.role !== 'employee') {
        return NextResponse.json(
          { error: 'Invalid employee token' },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Search for customer in Stripe
    const customers = await stripeClient.customers.search({
      query: `email:"${email}"`,
    });

    if (!customers.data.length) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customers.data[0];

    // Get all paid invoices to calculate total credits
    const invoices = await stripeClient.invoices.list({
      customer: customer.id,
      status: 'paid',
      limit: 100,
    });

    // Filter subscription invoices
    const subscriptionInvoices = invoices.data.filter(invoice => invoice.subscription !== null);
    
    // Calculate credits
    const creditsPerPayment = 15;
    const totalPayments = subscriptionInvoices.length;
    const totalCredits = totalPayments * creditsPerPayment;
    
    // Get metadata for used and reserved credits
    const customerMetadata = customer.metadata || {};
    const creditsUsed = parseInt(customerMetadata.credits_used || '0');
    const creditsReserved = parseInt(customerMetadata.credits_reserved || '0');
    const availableCredits = totalCredits - creditsUsed - creditsReserved;

    // Get last transaction if exists
    let lastTransaction = null;
    if (customerMetadata.last_transaction) {
      try {
        lastTransaction = JSON.parse(customerMetadata.last_transaction);
      } catch (e) {
        console.error('Failed to parse last transaction:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name || 'Customer',
          email: customer.email,
        },
        credits: {
          total: totalCredits,
          used: creditsUsed,
          reserved: creditsReserved,
          available: availableCredits,
        },
        lastTransaction,
      },
    });

  } catch (error: any) {
    console.error('Customer search error:', error);
    return NextResponse.json(
      { error: 'Failed to search customer' },
      { status: 500 }
    );
  }
}