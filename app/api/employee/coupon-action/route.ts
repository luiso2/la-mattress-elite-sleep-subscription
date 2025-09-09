import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

    const { action, couponId, couponCode } = await request.json();

    if (!action || (!couponId && !couponCode)) {
      return NextResponse.json(
        { error: 'Action and either couponId or couponCode are required' },
        { status: 400 }
      );
    }

    if (!['mark_used', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "mark_used" or "delete"' },
        { status: 400 }
      );
    }

    let apiResponse;
    const baseUrl = 'https://backend-shopify-coupon-production.up.railway.app';

    try {
      if (action === 'mark_used') {
        // Mark coupon as used
        const url = couponId 
          ? `${baseUrl}/api/coupons/db/${couponId}/status`
          : null;
        
        if (!url) {
          return NextResponse.json(
            { error: 'Coupon ID is required to mark as used' },
            { status: 400 }
          );
        }

        console.log(`Marking coupon ${couponId} as used`);
        apiResponse = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'used' }),
          timeout: 10000,
        });

      } else if (action === 'delete') {
        // Delete coupon
        const url = couponId 
          ? `${baseUrl}/api/coupons/db/${couponId}`
          : `${baseUrl}/api/coupons/db/code/${encodeURIComponent(couponCode)}`;

        console.log(`Deleting coupon ${couponId || couponCode}`);
        apiResponse = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
      }

      if (!apiResponse) {
        throw new Error('No API response received');
      }

      const responseData = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(`Coupon API error: ${responseData.error || 'Unknown error'}`);
      }

      console.log(`Coupon action ${action} completed successfully`);
      
      return NextResponse.json({
        success: true,
        action,
        message: action === 'mark_used' 
          ? 'Coupon marked as used successfully' 
          : 'Coupon deleted successfully',
        data: responseData,
      });

    } catch (fetchError: any) {
      console.error(`Failed to ${action} coupon:`, fetchError);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - coupon service may be unavailable' },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { 
          error: `Failed to ${action} coupon`, 
          details: fetchError.message 
        },
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error('Coupon action error:', error);
    return NextResponse.json(
      { error: 'Failed to process coupon action' },
      { status: 500 }
    );
  }
}