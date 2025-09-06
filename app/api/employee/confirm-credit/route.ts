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
    
    let employeeData: any;
    try {
      employeeData = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      if (employeeData.role !== 'employee') {
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

    const { customerId, amount } = await request.json();

    if (!customerId || !amount) {
      return NextResponse.json(
        { error: 'Customer ID and amount are required' },
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

    // Get current customer metadata
    const customer = await stripeClient.customers.retrieve(customerId);
    const currentMetadata = (customer as any).metadata || {};
    
    const currentUsed = parseInt(currentMetadata.credits_used || '0');
    const currentReserved = parseInt(currentMetadata.credits_reserved || '0');

    // Validate that amount matches reserved credits
    if (amount !== currentReserved) {
      return NextResponse.json(
        { error: 'Amount does not match reserved credits' },
        { status: 400 }
      );
    }

    // Create transaction record
    const transaction = {
      amount: amount,
      date: new Date().toISOString(),
      employee: employeeData.name,
      employeeId: employeeData.employeeId,
      type: 'in_store_purchase',
    };

    // Update customer metadata
    await stripeClient.customers.update(customerId, {
      metadata: {
        ...currentMetadata,
        credits_used: (currentUsed + amount).toString(),
        credits_reserved: '0', // Clear reserved credits
        last_transaction: JSON.stringify(transaction),
        last_transaction_date: new Date().toISOString(),
        last_processed_by: employeeData.name,
      },
    });

    // Log the transaction (in production, you might want to store this in a database)
    console.log('Credit transaction confirmed:', {
      customerId,
      amount,
      employee: employeeData.name,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully confirmed $${amount} credit usage`,
      transaction,
    });

  } catch (error: any) {
    console.error('Credit confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm credit usage' },
      { status: 500 }
    );
  }
}