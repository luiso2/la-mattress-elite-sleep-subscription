import axios, { AxiosInstance } from 'axios';

interface ShopifyConfig {
  storeUrl: string;
  accessToken: string;
  apiVersion: string;
}

interface PriceRule {
  id: number;
  title: string;
  value_type: 'percentage' | 'fixed_amount';
  value: string;
  customer_selection: 'all' | 'prerequisite';
  target_type: 'line_item' | 'shipping_line';
  target_selection: 'all' | 'entitled';
  allocation_method: 'across' | 'each';
  once_per_customer: boolean;
  usage_limit?: number;
  starts_at: string;
  ends_at?: string;
  prerequisite_subtotal_range?: {
    greater_than_or_equal_to: string;
  };
}

interface DiscountCode {
  id: number;
  price_rule_id: number;
  code: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export class ShopifyService {
  private client: AxiosInstance;
  private config: ShopifyConfig;

  constructor() {
    this.config = {
      storeUrl: process.env.SHOPIFY_STORE_URL || 'la-mattress.myshopify.com',
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
    };

    const baseURL = `https://${this.config.storeUrl}/admin/api/${this.config.apiVersion}`;

    this.client = axios.create({
      baseURL,
      headers: {
        'X-Shopify-Access-Token': this.config.accessToken,
        'Content-Type': 'application/json'
      }
    });
  }

  // Test connection to Shopify
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/shop.json');
      console.log('✅ Shopify connection successful:', response.data.shop.name);
      return true;
    } catch (error) {
      console.error('❌ Shopify connection failed:', error);
      return false;
    }
  }

  // Create a price rule (discount rule)
  async createPriceRule(data: {
    title: string;
    valueType: 'percentage' | 'fixed_amount';
    value: number;
    oncePerCustomer?: boolean;
    usageLimit?: number;
    startsAt: Date;
    endsAt?: Date;
    minimumPurchase?: number;
  }): Promise<PriceRule | null> {
    try {
      const priceRuleData = {
        price_rule: {
          title: data.title,
          value_type: data.valueType,
          value: `-${data.value}`,
          customer_selection: 'all',
          target_type: 'line_item',
          target_selection: 'all',
          allocation_method: 'across',
          once_per_customer: data.oncePerCustomer ?? true,
          usage_limit: data.usageLimit,
          starts_at: data.startsAt.toISOString(),
          ends_at: data.endsAt?.toISOString(),
          prerequisite_subtotal_range: data.minimumPurchase ? {
            greater_than_or_equal_to: data.minimumPurchase.toString()
          } : undefined
        }
      };

      const response = await this.client.post('/price_rules.json', priceRuleData);
      return response.data.price_rule;
    } catch (error: any) {
      console.error('Error creating price rule:', error.response?.data || error.message);
      return null;
    }
  }

  // Create a discount code for a price rule
  async createDiscountCode(priceRuleId: number, code: string): Promise<DiscountCode | null> {
    try {
      const discountCodeData = {
        discount_code: {
          code: code
        }
      };

      const response = await this.client.post(
        `/price_rules/${priceRuleId}/discount_codes.json`,
        discountCodeData
      );
      return response.data.discount_code;
    } catch (error: any) {
      console.error('Error creating discount code:', error.response?.data || error.message);
      return null;
    }
  }

  // Get all price rules
  async getPriceRules(): Promise<PriceRule[]> {
    try {
      const response = await this.client.get('/price_rules.json');
      return response.data.price_rules || [];
    } catch (error: any) {
      console.error('Error fetching price rules:', error.response?.data || error.message);
      return [];
    }
  }

  // Get discount codes for a price rule
  async getDiscountCodes(priceRuleId: number): Promise<DiscountCode[]> {
    try {
      const response = await this.client.get(`/price_rules/${priceRuleId}/discount_codes.json`);
      return response.data.discount_codes || [];
    } catch (error: any) {
      console.error('Error fetching discount codes:', error.response?.data || error.message);
      return [];
    }
  }

  // Delete a price rule (and its discount codes)
  async deletePriceRule(priceRuleId: number): Promise<boolean> {
    try {
      await this.client.delete(`/price_rules/${priceRuleId}.json`);
      console.log(`✅ Price rule ${priceRuleId} deleted successfully`);
      return true;
    } catch (error: any) {
      console.error('Error deleting price rule:', error.response?.data || error.message);
      return false;
    }
  }

  // Delete a specific discount code
  async deleteDiscountCode(priceRuleId: number, discountCodeId: number): Promise<boolean> {
    try {
      await this.client.delete(`/price_rules/${priceRuleId}/discount_codes/${discountCodeId}.json`);
      console.log(`✅ Discount code ${discountCodeId} deleted successfully`);
      return true;
    } catch (error: any) {
      console.error('Error deleting discount code:', error.response?.data || error.message);
      return false;
    }
  }

  // Get a single price rule
  async getPriceRule(priceRuleId: number): Promise<PriceRule | null> {
    try {
      const response = await this.client.get(`/price_rules/${priceRuleId}.json`);
      return response.data.price_rule;
    } catch (error: any) {
      console.error('Error fetching price rule:', error.response?.data || error.message);
      return null;
    }
  }

  // Update a price rule
  async updatePriceRule(priceRuleId: number, updates: Partial<PriceRule>): Promise<PriceRule | null> {
    try {
      const response = await this.client.put(`/price_rules/${priceRuleId}.json`, {
        price_rule: updates
      });
      return response.data.price_rule;
    } catch (error: any) {
      console.error('Error updating price rule:', error.response?.data || error.message);
      return null;
    }
  }

  // Create a complete coupon (price rule + discount code)
  async createCoupon(data: {
    code: string;
    title: string;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;
    startsAt: Date;
    endsAt?: Date;
    usageLimit?: number;
    oncePerCustomer?: boolean;
    minimumPurchase?: number;
  }): Promise<{
    priceRule: PriceRule | null;
    discountCode: DiscountCode | null;
  }> {
    // Create price rule first
    const priceRule = await this.createPriceRule({
      title: data.title,
      valueType: data.discountType,
      value: data.discountValue,
      oncePerCustomer: data.oncePerCustomer,
      usageLimit: data.usageLimit,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      minimumPurchase: data.minimumPurchase
    });

    if (!priceRule) {
      return { priceRule: null, discountCode: null };
    }

    // Create discount code for the price rule
    const discountCode = await this.createDiscountCode(priceRule.id, data.code);

    return { priceRule, discountCode };
  }

  // Validate if a coupon code exists
  async validateCouponCode(code: string): Promise<{
    valid: boolean;
    priceRule?: PriceRule;
    discountCode?: DiscountCode;
  }> {
    try {
      // Get all price rules
      const priceRules = await this.getPriceRules();

      // Search for the discount code in each price rule
      for (const priceRule of priceRules) {
        const discountCodes = await this.getDiscountCodes(priceRule.id);
        const discountCode = discountCodes.find(dc => dc.code === code);

        if (discountCode) {
          return {
            valid: true,
            priceRule,
            discountCode
          };
        }
      }

      return { valid: false };
    } catch (error) {
      console.error('Error validating coupon code:', error);
      return { valid: false };
    }
  }
}

// Export singleton instance
export const shopifyService = new ShopifyService();

export default shopifyService;