import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface CashbackTransaction {
  id: string;
  date: string;
  amount: number;
  cashback: number;
  description: string;
  employee: string;
  type: 'earned' | 'used';
}

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userEmail = decoded.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email not found in token' }, { status: 400 });
    }

    // Search for customer in Stripe by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          email: userEmail,
          cashbackBalance: 0,
          cashbackHistory: [],
          message: 'No Stripe customer found'
        }
      });
    }

    const customer = customers.data[0];
    const metadata = customer.metadata || {};
    const cashbackBalance = parseFloat(metadata.cashback_balance || '0');
    let cashbackHistory: CashbackTransaction[] = [];
    
    try {
      // Handle both compact and full format for backward compatibility
      const historyData = metadata.cashback_history 
        ? JSON.parse(metadata.cashback_history) 
        : [];
      
      // Check if it's compact format (has 'd' property) or full format
      if (historyData.length > 0 && historyData[0].d) {
        // Convert compact format to full format
        cashbackHistory = historyData.map((tx: any, index: number) => ({
          id: `cb_${index}`,
          date: tx.d + 'T00:00:00.000Z',
          amount: tx.a,
          cashback: tx.c,
          description: tx.desc,
          employee: tx.e,
          type: tx.t === 'e' ? 'earned' : 'used'
        }));
      } else {
        // Already in full format
        cashbackHistory = historyData;
      }
    } catch (e) {
      cashbackHistory = [];
    }

    // Calculate total earned and used
    const totalEarned = cashbackHistory
      .filter(tx => tx.type === 'earned')
      .reduce((sum, tx) => sum + Math.abs(tx.cashback), 0);
    
    const totalUsed = cashbackHistory
      .filter(tx => tx.type === 'used')
      .reduce((sum, tx) => sum + Math.abs(tx.cashback), 0);

    return NextResponse.json({
      success: true,
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        cashbackBalance: cashbackBalance,
        totalEarned: totalEarned,
        totalUsed: totalUsed,
        cashbackHistory: cashbackHistory.slice(0, 10), // Return last 10 transactions
        lastUpdate: metadata.last_cashback_update || null,
        subscriptionActive: !!customer.subscriptions?.data.length
      }
    });

  } catch (error: any) {
    console.error('Get customer cashback error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve cashback balance', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}