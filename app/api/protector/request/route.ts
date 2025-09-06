import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface ShippingAddress {
  fullName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  specialInstructions?: string;
}

interface ProtectorRequest {
  protectorNumber: number;
  reason: string;
  mattressSize: string;
  mattressPurchaseDate?: string;
  shippingAddress: ShippingAddress;
}

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

    const requestData: ProtectorRequest = await req.json();
    
    // Validate request data
    if (!requestData.protectorNumber || 
        requestData.protectorNumber < 1 || 
        requestData.protectorNumber > 3) {
      return NextResponse.json({ 
        error: 'Invalid protector number' 
      }, { status: 400 });
    }

    if (!requestData.reason || !requestData.mattressSize || !requestData.shippingAddress) {
      return NextResponse.json({ 
        error: 'Missing required information' 
      }, { status: 400 });
    }

    // Validate shipping address
    const { shippingAddress } = requestData;
    if (!shippingAddress.fullName || !shippingAddress.address1 || 
        !shippingAddress.city || !shippingAddress.state || 
        !shippingAddress.zipCode || !shippingAddress.phone || !shippingAddress.email) {
      return NextResponse.json({ 
        error: 'Incomplete shipping address' 
      }, { status: 400 });
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

    if (!isActive) {
      return NextResponse.json({ 
        error: 'Subscription is not active. Please reactivate your membership to claim protector replacements.' 
      }, { status: 403 });
    }

    // Get current metadata
    const metadata = customer.metadata || {};
    
    // Check if already claimed
    if (metadata[`protector_${requestData.protectorNumber}_used`] === 'true') {
      return NextResponse.json({ 
        error: `Protector replacement #${requestData.protectorNumber} has already been claimed` 
      }, { status: 400 });
    }

    // Generate order number
    const orderNumber = `MP-${Date.now()}-${requestData.protectorNumber}`;
    const requestDate = new Date().toISOString();
    
    // Calculate estimated delivery (3-5 business days)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    // Update customer metadata with detailed request information
    await stripe.customers.update(decoded.customerId, {
      metadata: {
        ...metadata,
        [`protector_${requestData.protectorNumber}_used`]: 'true',
        [`protector_${requestData.protectorNumber}_date`]: requestDate,
        [`protector_${requestData.protectorNumber}_status`]: 'processing',
        [`protector_${requestData.protectorNumber}_order`]: orderNumber,
        [`protector_${requestData.protectorNumber}_size`]: requestData.mattressSize,
        [`protector_${requestData.protectorNumber}_reason`]: requestData.reason,
        [`protector_${requestData.protectorNumber}_delivery`]: deliveryDate.toISOString(),
        [`protector_${requestData.protectorNumber}_shipping`]: JSON.stringify({
          name: shippingAddress.fullName,
          address: `${shippingAddress.address1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}`,
          phone: shippingAddress.phone
        })
      }
    });

    // Here you would typically:
    // 1. Send email confirmation to customer
    // 2. Create order in your fulfillment system
    // 3. Notify warehouse team
    // 4. Generate shipping label

    // Log the request for tracking
    console.log('Protector request processed:', {
      orderNumber,
      customerId: decoded.customerId,
      protectorNumber: requestData.protectorNumber,
      size: requestData.mattressSize,
      shippingAddress
    });

    return NextResponse.json({
      success: true,
      orderNumber,
      message: 'Your mattress protector replacement request has been successfully submitted.',
      details: {
        protectorNumber: requestData.protectorNumber,
        orderNumber,
        status: 'processing',
        estimatedDelivery: deliveryDate.toISOString(),
        shippingAddress: {
          fullName: shippingAddress.fullName,
          address1: shippingAddress.address1,
          address2: shippingAddress.address2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode
        },
        mattressSize: requestData.mattressSize,
        requestDate
      },
      nextSteps: [
        'You will receive an email confirmation shortly',
        'Your protector will be shipped within 24-48 hours',
        'Tracking information will be sent to your email',
        'Estimated delivery: 3-5 business days'
      ]
    });
  } catch (error) {
    console.error('Protector request error:', error);
    return NextResponse.json({ 
      error: 'Failed to process protector request' 
    }, { status: 500 });
  }
}