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

    // Initialize variables for customer data
    let stripeCustomerData = null;
    let stripeDataError = null;

    // Search for customer in Stripe (independent logic)
    try {
      console.log(`Searching for customer in Stripe: ${email}`);
      const customers = await stripeClient.customers.search({
        query: `email:"${email}"`,
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        console.log(`Found Stripe customer: ${customer.id}`);

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

        // Get protector replacements data
        let protectorUsedCount = 0;
        const protectorDetails = [];
        
        for (let i = 1; i <= 3; i++) {
          const isUsed = customerMetadata[`protector_${i}_used`] === 'true';
          if (isUsed) protectorUsedCount++;
          
          protectorDetails.push({
            number: i,
            used: isUsed,
            date: customerMetadata[`protector_${i}_date`] || null,
          });
        }

        // Get cashback data from Stripe metadata
        let cashbackBalance = 0;
        let cashbackHistory: any[] = [];

        try {
          cashbackBalance = parseFloat(customerMetadata.cashback_balance || '0');

          if (customerMetadata.cashback_history) {
            const compactHistory = JSON.parse(customerMetadata.cashback_history);

            // Convert compact format back to full format for display
            cashbackHistory = compactHistory.map((tx: any, index: number) => ({
              id: `cb_${index}`,
              date: tx.d + 'T00:00:00.000Z',
              amount: tx.a,
              cashback: tx.c,
              description: tx.desc,
              employee: tx.e,
              employeeEmail: '',
              type: tx.t === 'e' ? 'earned' : 'used'
            }));
          }
        } catch (cashbackError) {
          console.warn('Could not parse cashback data:', cashbackError);
        }

        // Build Stripe customer data object
        stripeCustomerData = {
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
          protectorReplacements: {
            total: 3,
            used: protectorUsedCount,
            available: 3 - protectorUsedCount,
            protectors: protectorDetails,
          },
          cashback: {
            balance: cashbackBalance,
            history: cashbackHistory
          },
          lastTransaction,
        };
      } else {
        console.log(`No Stripe customer found for: ${email}`);
        stripeDataError = 'Customer not found in Stripe';
      }
    } catch (stripeError) {
      console.error('Error searching Stripe customer:', stripeError);
      stripeDataError = 'Failed to search Stripe customer data';
    }

    // Get customer coupons from coupon backend
    let customerCoupons = null;
    try {
      console.log(`Fetching coupons for customer: ${email}`);
      const couponResponse = await fetch(
        `https://backend-shopify-coupon-production.up.railway.app/api/coupons/search/email/${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      if (couponResponse.ok) {
        const couponData = await couponResponse.json();
        customerCoupons = {
          success: true,
          count: couponData.count || 0,
          coupons: couponData.coupons || [],
        };
        console.log(`Found ${couponData.count} coupons for ${email}`);
      } else if (couponResponse.status === 404) {
        // No coupons found - this is normal
        customerCoupons = {
          success: true,
          count: 0,
          coupons: [],
        };
        console.log(`No coupons found for ${email}`);
      } else {
        throw new Error(`Coupon API responded with status ${couponResponse.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch customer coupons:', error);
      customerCoupons = {
        success: false,
        count: 0,
        coupons: [],
        error: 'Failed to fetch coupon data',
      };
    }

    // Determine response based on available data
    const hasStripeData = stripeCustomerData !== null;
    const hasCouponData = customerCoupons && customerCoupons.success && customerCoupons.count > 0;

    // If neither Stripe nor coupon data exists, return 404
    if (!hasStripeData && !hasCouponData) {
      return NextResponse.json(
        { 
          error: 'No customer data found',
          details: {
            stripe: stripeDataError || 'Customer not found in Stripe',
            coupons: customerCoupons?.error || 'No coupons found'
          }
        },
        { status: 404 }
      );
    }

    // Build response object
    const responseData: any = {
      email: email,
      searchedAt: new Date().toISOString(),
      coupons: customerCoupons,
    };

    // Add Stripe data if available
    if (hasStripeData) {
      responseData.customer = stripeCustomerData.customer;
      responseData.credits = stripeCustomerData.credits;
      responseData.protectorReplacements = stripeCustomerData.protectorReplacements;
      responseData.cashback = stripeCustomerData.cashback;
      responseData.lastTransaction = stripeCustomerData.lastTransaction;
    } else {
      // Indicate that Stripe data is not available
      responseData.stripeDataError = stripeDataError;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error: any) {
    console.error('Customer search error:', error);
    return NextResponse.json(
      { error: 'Failed to search customer' },
      { status: 500 }
    );
  }
}