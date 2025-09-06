import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface ProtectorStatus {
  number: number;
  used: boolean;
  date: string | null;
  status: 'available' | 'processing' | 'shipped' | 'delivered';
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('JWT verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(decoded.customerId);
    if (!customer || customer.deleted) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check subscription status
    const subscriptions = await stripe.subscriptions.list({
      customer: decoded.customerId,
      status: 'all',
      limit: 1,
    });

    const subscription = subscriptions.data[0];
    const isActive = subscription && ['active', 'trialing', 'past_due'].includes(subscription.status);

    // Get protector status from metadata
    const metadata = customer.metadata || {};
    const protectors: ProtectorStatus[] = [];

    for (let i = 1; i <= 3; i++) {
      const used = metadata[`protector_${i}_used`] === 'true';
      const date = metadata[`protector_${i}_date`] || null;
      const status = metadata[`protector_${i}_status`] || (used ? 'delivered' : 'available');
      const trackingNumber = metadata[`protector_${i}_tracking`];
      const estimatedDelivery = metadata[`protector_${i}_delivery`];

      protectors.push({
        number: i,
        used,
        date,
        status: status as ProtectorStatus['status'],
        trackingNumber,
        estimatedDelivery
      });
    }

    // Calculate summary
    const summary = {
      total: 3,
      used: protectors.filter(p => p.used).length,
      available: protectors.filter(p => !p.used).length,
      subscriptionActive: isActive
    };

    return NextResponse.json({
      protectors,
      summary,
      customerEmail: 'email' in customer ? customer.email : '',
      message: isActive 
        ? 'Your mattress protection benefits are active' 
        : 'Reactivate your subscription to access protector replacements'
    });
  } catch (error) {
    console.error('Get protector status error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve protector status' 
    }, { status: 500 });
  }
}