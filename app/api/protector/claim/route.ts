import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
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

    const { protectorNumber } = await req.json();
    
    if (!protectorNumber || protectorNumber < 1 || protectorNumber > 3) {
      return NextResponse.json({ 
        error: 'Invalid protector number' 
      }, { status: 400 });
    }

    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(decoded.customerId);
    if (!customer || customer.deleted) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get current metadata
    const metadata = customer.metadata || {};
    
    // Check if already claimed
    if (metadata[`protector_${protectorNumber}_used`] === 'true') {
      return NextResponse.json({ 
        error: `Protector replacement #${protectorNumber} has already been claimed` 
      }, { status: 400 });
    }

    // Update customer metadata to mark as claimed
    const claimDate = new Date().toISOString();
    await stripe.customers.update(decoded.customerId, {
      metadata: {
        ...metadata,
        [`protector_${protectorNumber}_used`]: 'true',
        [`protector_${protectorNumber}_date`]: claimDate,
        [`protector_${protectorNumber}_status`]: 'processing',
      }
    });

    // Send confirmation email (simplified for now)
    console.log(`Protector replacement #${protectorNumber} claimed by customer ${decoded.customerId}`);

    return NextResponse.json({
      success: true,
      message: `Protector replacement #${protectorNumber} has been successfully claimed. Our team will process your request within 24-48 hours.`,
      protectorNumber,
      claimDate,
      status: 'processing'
    });
  } catch (error) {
    console.error('Protector claim error:', error);
    return NextResponse.json({ 
      error: 'Failed to process protector claim' 
    }, { status: 500 });
  }
}