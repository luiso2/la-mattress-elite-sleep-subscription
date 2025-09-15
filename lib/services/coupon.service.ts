import { Op } from 'sequelize';
import { shopifyService } from './shopify.service';

interface CreateCouponData {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  description?: string;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  minimumPurchase?: number;
  appliesTo?: string;
}

interface CouponValidation {
  isValid: boolean;
  error?: string;
  coupon?: any;
}

export class CouponService {
  // Create a new coupon with Shopify integration
  async createCoupon(data: CreateCouponData): Promise<{
    success: boolean;
    coupon?: any;
    error?: string;
  }> {
    try {
      const { createCouponWithCustomer } = await import('../database/server-only');
      // First create in Shopify
      const shopifyResult = await shopifyService.createCoupon({
        code: data.code,
        title: data.description || `Discount ${data.code}`,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startsAt: data.validFrom,
        endsAt: data.validUntil,
        usageLimit: data.maxUses,
        oncePerCustomer: true,
        minimumPurchase: data.minimumPurchase
      });

      if (!shopifyResult.priceRule || !shopifyResult.discountCode) {
        return {
          success: false,
          error: 'Failed to create coupon in Shopify'
        };
      }

      // Create in database
      const { customer, coupon } = await createCouponWithCustomer(
        {
          email: data.customerEmail,
          name: data.customerName,
          phone: data.customerPhone
        },
        {
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          description: data.description,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          maxUses: data.maxUses,
          minimumPurchase: data.minimumPurchase,
          appliesTo: data.appliesTo,
          shopifyPriceRuleId: shopifyResult.priceRule.id.toString(),
          shopifyDiscountCodeId: shopifyResult.discountCode.id.toString()
        }
      );

      // Send webhook notification if configured
      await this.sendWebhookNotification(coupon, customer);

      return {
        success: true,
        coupon
      };
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      return {
        success: false,
        error: error.message || 'Failed to create coupon'
      };
    }
  }

  // Validate a coupon code
  async validateCoupon(code: string): Promise<CouponValidation> {
    try {
      const { updateExpiredCoupons, findCouponByCode } = await import('../database/server-only');

      // Update expired coupons first
      await updateExpiredCoupons();

      // Find coupon in database
      const coupon = await findCouponByCode(code);

      if (!coupon) {
        return {
          isValid: false,
          error: 'Coupon code not found'
        };
      }

      // Check status
      if (coupon.status === 'cancelled') {
        return {
          isValid: false,
          error: 'This coupon has been cancelled'
        };
      }

      if (coupon.status === 'expired') {
        return {
          isValid: false,
          error: 'This coupon has expired'
        };
      }

      if (coupon.status === 'used') {
        return {
          isValid: false,
          error: 'This coupon has already been fully used'
        };
      }

      // Check dates
      const now = new Date();
      if (now < coupon.validFrom) {
        return {
          isValid: false,
          error: 'This coupon is not yet valid'
        };
      }

      if (now > coupon.validUntil) {
        // Update status
        await coupon.update({ status: 'expired' });
        return {
          isValid: false,
          error: 'This coupon has expired'
        };
      }

      // Check usage limits
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        // Update status
        await coupon.update({ status: 'used' });
        return {
          isValid: false,
          error: 'This coupon has reached its usage limit'
        };
      }

      // Validate with Shopify
      const shopifyValidation = await shopifyService.validateCouponCode(code);
      if (!shopifyValidation.valid) {
        return {
          isValid: false,
          error: 'Coupon is not valid in Shopify'
        };
      }

      return {
        isValid: true,
        coupon
      };
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      return {
        isValid: false,
        error: 'Error validating coupon'
      };
    }
  }

  // Use a coupon
  async useCoupon(
    code: string,
    customerId: number,
    orderId?: string,
    orderAmount?: number
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const validation = await this.validateCoupon(code);

      if (!validation.isValid || !validation.coupon) {
        return {
          success: false,
          error: validation.error || 'Invalid coupon'
        };
      }

      const coupon = validation.coupon;

      // Calculate discount amount
      let discountApplied = 0;
      if (orderAmount) {
        if (coupon.discountType === 'percentage') {
          discountApplied = (orderAmount * coupon.discountValue) / 100;
        } else {
          discountApplied = Math.min(coupon.discountValue, orderAmount);
        }
      }

      // Create usage record
      const { CouponUse } = await import('../database/server-only');
      await CouponUse.create({
        couponId: coupon.id,
        customerId,
        orderId,
        orderAmount,
        discountApplied,
        usedAt: new Date()
      });

      // Update current uses
      const newUses = coupon.currentUses + 1;
      const newStatus = coupon.maxUses && newUses >= coupon.maxUses ? 'used' : 'active';

      await coupon.update({
        currentUses: newUses,
        status: newStatus
      });

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error using coupon:', error);
      return {
        success: false,
        error: error.message || 'Failed to use coupon'
      };
    }
  }

  // Mark coupon as used (for employee actions)
  async markCouponAsUsed(couponId: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { Coupon } = await import('../database/server-only');
      const coupon = await Coupon.findByPk(couponId);

      if (!coupon) {
        return {
          success: false,
          error: 'Coupon not found'
        };
      }

      await coupon.update({ status: 'used' });

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error marking coupon as used:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark coupon as used'
      };
    }
  }

  // Delete a coupon
  async deleteCoupon(couponId: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { Coupon } = await import('../database/server-only');
      const coupon = await Coupon.findByPk(couponId);

      if (!coupon) {
        return {
          success: false,
          error: 'Coupon not found'
        };
      }

      // Delete from Shopify if IDs exist
      if (coupon.shopifyPriceRuleId) {
        await shopifyService.deletePriceRule(parseInt(coupon.shopifyPriceRuleId));
      }

      // Delete from database
      await coupon.destroy();

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete coupon'
      };
    }
  }

  // Get coupons by customer email
  async getCouponsByEmail(email: string): Promise<any[]> {
    try {
      const { updateExpiredCoupons, findCouponsByEmail } = await import('../database/server-only');
      await updateExpiredCoupons();
      return await findCouponsByEmail(email);
    } catch (error) {
      console.error('Error getting coupons by email:', error);
      return [];
    }
  }

  // Get coupon by code
  async getCouponByCode(code: string): Promise<any | null> {
    try {
      const { findCouponByCode } = await import('../database/server-only');
      return await findCouponByCode(code);
    } catch (error) {
      console.error('Error getting coupon by code:', error);
      return null;
    }
  }

  // Get all active coupons for a customer
  async getActiveCoupons(customerId: number): Promise<any[]> {
    try {
      const { updateExpiredCoupons, Coupon } = await import('../database/server-only');
      await updateExpiredCoupons();

      return await Coupon.findAll({
        where: {
          customerId,
          status: 'active'
        },
        order: [['validUntil', 'ASC']]
      });
    } catch (error) {
      console.error('Error getting active coupons:', error);
      return [];
    }
  }

  // Get coupon usage history
  async getCouponHistory(customerId: number): Promise<any[]> {
    try {
      const { CouponUse, Coupon } = await import('../database/server-only');
      return await CouponUse.findAll({
        where: { customerId },
        include: [{
          model: Coupon,
          as: 'coupon'
        }],
        order: [['usedAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error getting coupon history:', error);
      return [];
    }
  }

  // Update coupon status
  async updateCouponStatus(
    couponId: number,
    status: 'active' | 'expired' | 'used' | 'cancelled'
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { Coupon } = await import('../database/server-only');
      const coupon = await Coupon.findByPk(couponId);

      if (!coupon) {
        return {
          success: false,
          error: 'Coupon not found'
        };
      }

      await coupon.update({ status });

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error updating coupon status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update coupon status'
      };
    }
  }

  // Send webhook notification (for Google Apps Script integration)
  private async sendWebhookNotification(coupon: any, customer: any): Promise<void> {
    try {
      const webhookUrl = process.env.GOOGLE_WEBHOOK_URL;

      if (!webhookUrl || coupon.webhookSent) {
        return;
      }

      // Send webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'coupon_created',
          customer: {
            email: customer.email,
            name: customer.name,
            phone: customer.phone
          },
          coupon: {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            validUntil: coupon.validUntil,
            description: coupon.description
          }
        })
      });

      if (response.ok) {
        await coupon.update({
          webhookSent: true,
          webhookSentAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error sending webhook notification:', error);
    }
  }

  // Get coupon statistics
  async getCouponStats(): Promise<{
    totalCoupons: number;
    activeCoupons: number;
    usedCoupons: number;
    expiredCoupons: number;
    totalDiscountGiven: number;
  }> {
    try {
      const { updateExpiredCoupons, Coupon, CouponUse } = await import('../database/server-only');
      await updateExpiredCoupons();

      const [
        totalCoupons,
        activeCoupons,
        usedCoupons,
        expiredCoupons,
        couponUses
      ] = await Promise.all([
        Coupon.count(),
        Coupon.count({ where: { status: 'active' } }),
        Coupon.count({ where: { status: 'used' } }),
        Coupon.count({ where: { status: 'expired' } }),
        CouponUse.findAll()
      ]);

      const totalDiscountGiven = couponUses.reduce(
        (sum, use) => sum + (use.discountApplied || 0),
        0
      );

      return {
        totalCoupons,
        activeCoupons,
        usedCoupons,
        expiredCoupons,
        totalDiscountGiven
      };
    } catch (error) {
      console.error('Error getting coupon stats:', error);
      return {
        totalCoupons: 0,
        activeCoupons: 0,
        usedCoupons: 0,
        expiredCoupons: 0,
        totalDiscountGiven: 0
      };
    }
  }
}

// Export singleton instance
export const couponService = new CouponService();

export default couponService;