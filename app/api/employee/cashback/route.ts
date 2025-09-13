import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CASHBACK_PERCENTAGE = 0.10; // 10% cashback

interface CashbackTransaction {
  id: string;
  date: string;
  amount: number;
  cashback: number;
  description: string;
  employee: string;
  employeeEmail: string;
  type: 'earned' | 'used';
}

// Compact format for storage in Stripe metadata
interface CompactTransaction {
  d: string; // date (short format)
  a: number; // amount
  c: number; // cashback
  desc: string; // description (truncated)
  e: string; // employee (first name only)
  t: 'e' | 'u'; // type (e=earned, u=used)
}

export async function POST(request: NextRequest) {
  try {
    // Verify employee authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded.isEmployee) {
        return NextResponse.json({ error: 'Not authorized as employee' }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, customerId, amount, description, cashbackUsed } = body;

    if (!action || !customerId) {
      return NextResponse.json({ 
        error: 'Missing required fields: action and customerId' 
      }, { status: 400 });
    }

    // Retrieve customer from Stripe
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    
    if (customer.deleted) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get current metadata
    const currentMetadata = customer.metadata || {};
    let cashbackBalance = parseFloat(currentMetadata.cashback_balance || '0');
    let compactHistory: CompactTransaction[] = [];
    
    try {
      const historyData = currentMetadata.cashback_history 
        ? JSON.parse(currentMetadata.cashback_history) 
        : [];
      
      // Convert any old format entries to compact format
      compactHistory = historyData.map((tx: any) => {
        // If it's already in compact format (has 'd' property), keep it
        if (tx.d) {
          return tx;
        }
        // Convert from old format to compact
        return {
          d: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
          a: tx.amount || 0,
          c: tx.cashback || 0,
          desc: (tx.description || '').substring(0, 20), // Even shorter descriptions
          e: (tx.employee || 'Unknown').split(' ')[0].substring(0, 10), // Limit employee name
          t: tx.type === 'earned' ? 'e' : 'u'
        } as CompactTransaction;
      });
      
      // Clean up and limit to 3 most recent transactions only
      compactHistory = compactHistory.slice(0, 3);
      
    } catch (e) {
      compactHistory = [];
    }

    let updatedBalance = cashbackBalance;
    let transaction: CashbackTransaction | null = null;

    if (action === 'add_purchase') {
      // Add new purchase and calculate cashback
      if (!amount || amount <= 0) {
        return NextResponse.json({ 
          error: 'Invalid amount' 
        }, { status: 400 });
      }

      if (!description) {
        return NextResponse.json({ 
          error: 'Purchase description is required' 
        }, { status: 400 });
      }

      const cashbackEarned = parseFloat((amount * CASHBACK_PERCENTAGE).toFixed(2));
      updatedBalance = parseFloat((cashbackBalance + cashbackEarned).toFixed(2));

      transaction = {
        id: `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        amount: amount,
        cashback: cashbackEarned,
        description: description,
        employee: decoded.name || 'Unknown Employee',
        employeeEmail: decoded.email || '',
        type: 'earned'
      };

      // Create compact version for storage
      const compactTx: CompactTransaction = {
        d: new Date().toISOString().split('T')[0], // Just date YYYY-MM-DD
        a: amount,
        c: cashbackEarned,
        desc: description.substring(0, 20), // Shorter description
        e: (decoded.name || 'Unknown').split(' ')[0].substring(0, 10), // Limit name length
        t: 'e'
      };

      compactHistory.unshift(compactTx);

    } else if (action === 'use_cashback') {
      // Use cashback credit
      if (!cashbackUsed || cashbackUsed <= 0) {
        return NextResponse.json({ 
          error: 'Invalid cashback amount to use' 
        }, { status: 400 });
      }

      if (cashbackUsed > cashbackBalance) {
        return NextResponse.json({ 
          error: 'Insufficient cashback balance' 
        }, { status: 400 });
      }

      // Validate that the amount doesn't exceed 50% of the balance
      const maxAllowed = parseFloat((cashbackBalance * 0.50).toFixed(2));
      if (cashbackUsed > maxAllowed) {
        return NextResponse.json({ 
          error: `Cannot use more than 50% of available balance. Maximum allowed: $${maxAllowed}` 
        }, { status: 400 });
      }

      updatedBalance = parseFloat((cashbackBalance - cashbackUsed).toFixed(2));

      transaction = {
        id: `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        amount: cashbackUsed,
        cashback: -cashbackUsed,
        description: description || 'Cashback credit used',
        employee: decoded.name || 'Unknown Employee',
        employeeEmail: decoded.email || '',
        type: 'used'
      };

      // Create compact version for storage
      const compactTx: CompactTransaction = {
        d: new Date().toISOString().split('T')[0],
        a: cashbackUsed,
        c: -cashbackUsed,
        desc: (description || 'Credit used').substring(0, 20),
        e: (decoded.name || 'Unknown').split(' ')[0].substring(0, 10),
        t: 'u'
      };

      compactHistory.unshift(compactTx);

    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "add_purchase" or "use_cashback"' 
      }, { status: 400 });
    }

    // Limit history to last 3 transactions to save space
    if (compactHistory.length > 3) {
      compactHistory = compactHistory.slice(0, 3);
    }

    // Update customer metadata in Stripe
    const updatedCustomer = await stripe.customers.update(customerId, {
      metadata: {
        ...currentMetadata,
        cashback_balance: updatedBalance.toString(),
        cashback_history: JSON.stringify(compactHistory),
        last_cashback_update: new Date().toISOString().split('T')[0],
        last_cashback_employee: (decoded.name || 'Unknown').split(' ')[0]
      }
    });

    return NextResponse.json({
      success: true,
      message: action === 'add_purchase' 
        ? `Successfully added purchase and earned $${transaction?.cashback} cashback`
        : `Successfully used $${cashbackUsed} cashback`,
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        previousBalance: cashbackBalance,
        newBalance: updatedBalance,
        transaction: transaction,
        totalTransactions: compactHistory.length
      }
    });

  } catch (error: any) {
    console.error('Cashback error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process cashback', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve cashback history
export async function GET(request: NextRequest) {
  try {
    // Verify employee authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded.isEmployee) {
        return NextResponse.json({ error: 'Not authorized as employee' }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ 
        error: 'Customer ID is required' 
      }, { status: 400 });
    }

    // Retrieve customer from Stripe
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    
    if (customer.deleted) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const metadata = customer.metadata || {};
    const cashbackBalance = parseFloat(metadata.cashback_balance || '0');
    let cashbackHistory: CashbackTransaction[] = [];
    
    try {
      const compactHistory: CompactTransaction[] = metadata.cashback_history 
        ? JSON.parse(metadata.cashback_history) 
        : [];
      
      // Convert compact format back to full format for display
      cashbackHistory = compactHistory.map((tx, index) => ({
        id: `cb_${index}`,
        date: tx.d + 'T00:00:00.000Z',
        amount: tx.a,
        cashback: tx.c,
        description: tx.desc,
        employee: tx.e,
        employeeEmail: '',
        type: tx.t === 'e' ? 'earned' : 'used'
      }));
    } catch (e) {
      cashbackHistory = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        cashbackBalance: cashbackBalance,
        cashbackHistory: cashbackHistory,
        lastUpdate: metadata.last_cashback_update || null,
        lastEmployee: metadata.last_cashback_employee || null
      }
    });

  } catch (error: any) {
    console.error('Get cashback error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve cashback data', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}