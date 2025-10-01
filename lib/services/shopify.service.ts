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
  // Map para prevenir creación de cupones duplicados
  private creatingCoupons = new Map<string, boolean>();
  private couponCreationPromises = new Map<string, Promise<any>>();

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
      },
      timeout: 15000 // 15 segundos de timeout
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
      console.log(`📝 Creating price rule: ${data.title}`);
      
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
      console.log(`✅ Price rule created with ID: ${response.data.price_rule.id}`);
      return response.data.price_rule;
    } catch (error: any) {
      console.error('Error creating price rule:', error.response?.data || error.message);
      
      // Si el error es por duplicado, intentar obtener el existente
      if (error.response?.status === 422 && error.response?.data?.errors) {
        console.log('⚠️ Price rule may already exist, checking...');
        const existingRules = await this.getPriceRules();
        const existing = existingRules.find(r => r.title === data.title);
        if (existing) {
          console.log(`✅ Found existing price rule with ID: ${existing.id}`);
          return existing;
        }
      }
      
      return null;
    }
  }

  // Create discount code for a price rule with improved error handling and retry logic
  async createDiscountCode(priceRuleId: number, code: string): Promise<DiscountCode | null> {
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎫 Creating discount code: ${code} (attempt ${attempt}/${maxRetries})`);
        
        const discountCodeData = {
          discount_code: {
            code,
            usage_count: 0
          }
        };

        const response = await this.client.post(
          `/price_rules/${priceRuleId}/discount_codes.json`,
          discountCodeData
        );
        
        const createdCode = response.data.discount_code;
        console.log(`✅ Discount code created successfully: ${code} (ID: ${createdCode.id})`);
        
        // Post-creation validation
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for API consistency
        const validation = await this.validateDiscountCodeCreation(priceRuleId, code);
        
        if (validation.success) {
          console.log(`✅ Discount code validation passed: ${code}`);
          return createdCode;
        } else {
          console.warn(`⚠️ Discount code created but validation failed: ${code}`);
          return createdCode; // Return anyway, validation might be overly strict
        }
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Error creating discount code (attempt ${attempt}/${maxRetries}):`, error.response?.data || error.message);
        
        // Si el error es por duplicado, intentar obtener el existente
        if (error.response?.status === 422) {
          console.log('⚠️ Discount code may already exist, checking...');
          const existingCodes = await this.getDiscountCodes(priceRuleId);
          const existing = existingCodes.find(dc => dc.code === code);
          if (existing) {
            console.log(`✅ Found existing discount code: ${code} (ID: ${existing.id})`);
            return existing;
          }
        }
        
        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`❌ Failed to create discount code after ${maxRetries} attempts:`, lastError?.response?.data || lastError?.message);
    
    // Log this failure for monitoring
    await this.logOrphanedRule(priceRuleId, code, lastError);
    
    return null;
  }

  // Validate that a discount code was properly created
  private async validateDiscountCodeCreation(priceRuleId: number, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      const codes = await this.getDiscountCodes(priceRuleId);
      const found = codes.find(dc => dc.code === code);
      
      if (found) {
        return { success: true };
      } else {
        return { success: false, message: `Discount code ${code} not found in price rule ${priceRuleId}` };
      }
    } catch (error: any) {
      return { success: false, message: `Validation error: ${error.message}` };
    }
  }

  // Log orphaned rule for monitoring and alerting
  private async logOrphanedRule(priceRuleId: number, code: string, error: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      priceRuleId,
      code,
      error: error?.response?.data || error?.message || 'Unknown error',
      type: 'ORPHANED_RULE_CREATED'
    };
    
    console.error('🚨 ORPHANED RULE ALERT:', JSON.stringify(logEntry, null, 2));
    
    // Guardar en base de datos
    try {
      const { OrphanedRuleLog } = await import('../database/server-only');
      
      await OrphanedRuleLog.create({
        priceRuleId: priceRuleId.toString(),
        couponCode: code,
        errorMessage: error?.message || 'Unknown error',
        errorDetails: error?.response?.data || error,
        shopifyResponse: error?.response?.data,
        attemptCount: 1,
        resolved: false
      });
      
      console.log(`📝 Orphaned rule log saved to database: ${code}`);
    } catch (dbError: any) {
      console.error('❌ Failed to save orphaned rule log to database:', dbError.message);
    }
    
    // In a production environment, you might want to:
    // - Send this to a monitoring service
    // - Write to a dedicated log file
    // - Trigger an alert/notification
  }

  // Get all price rules
  async getPriceRules(): Promise<PriceRule[]> {
    try {
      const response = await this.client.get('/price_rules.json?limit=250');
      return response.data.price_rules || [];
    } catch (error: any) {
      console.error('Error fetching price rules:', error.response?.data || error.message);
      return [];
    }
  }

  // Get discount codes for a price rule
  async getDiscountCodes(priceRuleId: number): Promise<DiscountCode[]> {
    try {
      const response = await this.client.get(`/price_rules/${priceRuleId}/discount_codes.json?limit=250`);
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

  // Create a complete coupon (price rule + discount code) with duplicate prevention
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
    const couponKey = data.code.toUpperCase();
    
    // Si ya se está creando este cupón, esperar el resultado
    if (this.couponCreationPromises.has(couponKey)) {
      console.log(`⏳ Coupon ${couponKey} is already being created, waiting...`);
      try {
        return await this.couponCreationPromises.get(couponKey);
      } catch (error) {
        console.error('Previous creation failed, trying again...');
      }
    }
    
    // Marcar que estamos creando este cupón
    console.log(`🔒 Starting creation of coupon ${couponKey}`);
    
    const creationPromise = this.doCreateCoupon(data);
    this.couponCreationPromises.set(couponKey, creationPromise);
    
    try {
      const result = await creationPromise;
      return result;
    } finally {
      // Limpiar después de 10 segundos
      setTimeout(() => {
        this.couponCreationPromises.delete(couponKey);
        console.log(`🧹 Cleared creation lock for ${couponKey}`);
      }, 10000);
    }
  }
  
  private async doCreateCoupon(data: {
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
    console.log(`🎫 Creating coupon ${data.code} in Shopify...`);
    
    // Primero verificar si ya existe usando búsqueda directa
    const existingValidation = await this.validateCouponCodeDirect(data.code);
    if (existingValidation.valid) {
      console.log(`✅ Coupon ${data.code} already exists in Shopify`);
      return {
        priceRule: existingValidation.priceRule || null,
        discountCode: existingValidation.discountCode || null
      };
    }
    
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

  // Validate if a coupon code exists (mejorado para búsqueda más eficiente)
  async validateCouponCode(code: string): Promise<{
    valid: boolean;
    priceRule?: PriceRule;
    discountCode?: DiscountCode;
  }> {
    try {
      console.log(`🔍 Validating coupon code: ${code}`);
      const startTime = Date.now();
      
      // Get all price rules
      const priceRules = await this.getPriceRules();
      console.log(`Found ${priceRules.length} price rules to check`);

      // Search for the discount code in each price rule
      // Usar búsqueda en paralelo para mejorar performance
      const searchPromises = priceRules.map(async (priceRule) => {
        const discountCodes = await this.getDiscountCodes(priceRule.id);
        const discountCode = discountCodes.find(dc => dc.code === code);
        
        if (discountCode) {
          return {
            valid: true,
            priceRule,
            discountCode
          };
        }
        return null;
      });
      
      const results = await Promise.all(searchPromises);
      const found = results.find(r => r !== null);
      
      const duration = Date.now() - startTime;
      console.log(`Validation completed in ${duration}ms`);
      
      if (found) {
        return found;
      }

      return { valid: false };
    } catch (error) {
      console.error('Error validating coupon code:', error);
      return { valid: false };
    }
  }
  
  // Método más directo para validar cupones (más rápido)
  async validateCouponCodeDirect(code: string): Promise<{
    valid: boolean;
    priceRule?: PriceRule;
    discountCode?: DiscountCode;
  }> {
    try {
      console.log(`🔍 Direct validation for coupon: ${code}`);
      
      // Intentar usar el API de búsqueda de Shopify si está disponible
      // Esto es más eficiente que iterar sobre todas las price rules
      const response = await this.client.get('/discount_codes/lookup.json', {
        params: { code: code }
      }).catch(() => null);
      
      if (response && response.data.discount_code) {
        const discountCode = response.data.discount_code;
        const priceRule = await this.getPriceRule(discountCode.price_rule_id);
        return {
          valid: true,
          priceRule: priceRule || undefined,
          discountCode
        };
      }
      
      // Si no funciona la búsqueda directa, usar el método tradicional
      return this.validateCouponCode(code);
    } catch (error) {
      console.error('Error in direct validation:', error);
      // Fallback al método tradicional
      return this.validateCouponCode(code);
    }
  }
}

// Export singleton instance
export const shopifyService = new ShopifyService();

export default shopifyService;