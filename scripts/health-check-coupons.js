const axios = require('axios');
require('dotenv').config();

class CouponHealthChecker {
  constructor() {
    this.shopifyConfig = {
      storeUrl: process.env.SHOPIFY_STORE_URL || 'la-mattress.myshopify.com',
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
    };

    this.client = axios.create({
      baseURL: `https://${this.shopifyConfig.storeUrl}/admin/api/${this.shopifyConfig.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': this.shopifyConfig.accessToken,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
  }

  async runHealthCheck() {
    console.log('🏥 COUPON HEALTH CHECK STARTED');
    console.log('================================');
    console.log('');

    const results = {
      timestamp: new Date().toISOString(),
      totalPriceRules: 0,
      orphanedRules: [],
      duplicateCodes: [],
      expiredCoupons: [],
      invalidCoupons: [],
      healthScore: 100,
      issues: []
    };

    try {
      // 1. Check for orphaned price rules
      console.log('1️⃣ Checking for orphaned price rules...');
      const orphanedCheck = await this.checkOrphanedRules();
      results.totalPriceRules = orphanedCheck.totalRules;
      results.orphanedRules = orphanedCheck.orphaned;
      
      if (orphanedCheck.orphaned.length > 0) {
        results.healthScore -= 20;
        results.issues.push(`Found ${orphanedCheck.orphaned.length} orphaned price rules`);
      }

      // 2. Check for duplicate discount codes
      console.log('2️⃣ Checking for duplicate discount codes...');
      const duplicateCheck = await this.checkDuplicateCodes();
      results.duplicateCodes = duplicateCheck.duplicates;
      
      if (duplicateCheck.duplicates.length > 0) {
        results.healthScore -= 15;
        results.issues.push(`Found ${duplicateCheck.duplicates.length} duplicate discount codes`);
      }

      // 3. Check for expired coupons that should be cleaned up
      console.log('3️⃣ Checking for expired coupons...');
      const expiredCheck = await this.checkExpiredCoupons();
      results.expiredCoupons = expiredCheck.expired;
      
      if (expiredCheck.expired.length > 10) {
        results.healthScore -= 5;
        results.issues.push(`Found ${expiredCheck.expired.length} expired coupons (cleanup recommended)`);
      }

      // 4. Check for invalid coupon configurations
      console.log('4️⃣ Checking for invalid coupon configurations...');
      const invalidCheck = await this.checkInvalidCoupons();
      results.invalidCoupons = invalidCheck.invalid;
      
      if (invalidCheck.invalid.length > 0) {
        results.healthScore -= 10;
        results.issues.push(`Found ${invalidCheck.invalid.length} invalid coupon configurations`);
      }

      // 5. Generate health report
      this.generateHealthReport(results);

      // 6. Auto-repair if requested
      if (process.argv.includes('--auto-repair')) {
        await this.autoRepair(results);
      }

      return results;

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      results.healthScore = 0;
      results.issues.push(`Health check failed: ${error.message}`);
      return results;
    }
  }

  async checkOrphanedRules() {
    const priceRules = await this.getPriceRules();
    const orphaned = [];

    console.log(`   Found ${priceRules.length} price rules to check`);

    for (const rule of priceRules) {
      const discountCodes = await this.getDiscountCodes(rule.id);
      if (discountCodes.length === 0) {
        orphaned.push({
          id: rule.id,
          title: rule.title,
          created_at: rule.created_at,
          value: rule.value,
          value_type: rule.value_type
        });
      }
    }

    console.log(`   ✅ Found ${orphaned.length} orphaned price rules`);
    return { totalRules: priceRules.length, orphaned };
  }

  async checkDuplicateCodes() {
    const allCodes = new Map();
    const duplicates = [];
    const priceRules = await this.getPriceRules();

    for (const rule of priceRules) {
      const discountCodes = await this.getDiscountCodes(rule.id);
      
      for (const code of discountCodes) {
        if (allCodes.has(code.code)) {
          duplicates.push({
            code: code.code,
            instances: [allCodes.get(code.code), {
              price_rule_id: rule.id,
              discount_code_id: code.id,
              created_at: code.created_at
            }]
          });
        } else {
          allCodes.set(code.code, {
            price_rule_id: rule.id,
            discount_code_id: code.id,
            created_at: code.created_at
          });
        }
      }
    }

    console.log(`   ✅ Found ${duplicates.length} duplicate codes`);
    return { duplicates };
  }

  async checkExpiredCoupons() {
    const priceRules = await this.getPriceRules();
    const expired = [];
    const now = new Date();

    for (const rule of priceRules) {
      if (rule.ends_at && new Date(rule.ends_at) < now) {
        const discountCodes = await this.getDiscountCodes(rule.id);
        expired.push({
          id: rule.id,
          title: rule.title,
          ends_at: rule.ends_at,
          discount_codes_count: discountCodes.length
        });
      }
    }

    console.log(`   ✅ Found ${expired.length} expired coupons`);
    return { expired };
  }

  async checkInvalidCoupons() {
    const priceRules = await this.getPriceRules();
    const invalid = [];

    for (const rule of priceRules) {
      const issues = [];

      // Check for invalid value
      if (!rule.value || rule.value === '0' || rule.value === '0.0') {
        issues.push('Zero discount value');
      }

      // Check for invalid dates
      if (rule.starts_at && rule.ends_at && new Date(rule.starts_at) >= new Date(rule.ends_at)) {
        issues.push('Start date is after end date');
      }

      // Check for missing title
      if (!rule.title || rule.title.trim() === '') {
        issues.push('Missing or empty title');
      }

      if (issues.length > 0) {
        invalid.push({
          id: rule.id,
          title: rule.title,
          issues
        });
      }
    }

    console.log(`   ✅ Found ${invalid.length} invalid coupons`);
    return { invalid };
  }

  generateHealthReport(results) {
    console.log('');
    console.log('📊 HEALTH REPORT');
    console.log('================');
    console.log(`Health Score: ${results.healthScore}/100`);
    console.log(`Total Price Rules: ${results.totalPriceRules}`);
    console.log(`Orphaned Rules: ${results.orphanedRules.length}`);
    console.log(`Duplicate Codes: ${results.duplicateCodes.length}`);
    console.log(`Expired Coupons: ${results.expiredCoupons.length}`);
    console.log(`Invalid Coupons: ${results.invalidCoupons.length}`);
    console.log('');

    if (results.issues.length > 0) {
      console.log('🚨 ISSUES FOUND:');
      results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      console.log('');
    }

    if (results.healthScore >= 90) {
      console.log('✅ EXCELLENT: Coupon system is healthy!');
    } else if (results.healthScore >= 70) {
      console.log('⚠️ GOOD: Minor issues detected, monitoring recommended');
    } else if (results.healthScore >= 50) {
      console.log('🔶 FAIR: Several issues detected, action recommended');
    } else {
      console.log('🚨 POOR: Critical issues detected, immediate action required');
    }

    console.log('');
    console.log('💡 RECOMMENDATIONS:');
    
    if (results.orphanedRules.length > 0) {
      console.log(`   - Run repair script to fix ${results.orphanedRules.length} orphaned rules`);
    }
    
    if (results.duplicateCodes.length > 0) {
      console.log(`   - Review and clean up ${results.duplicateCodes.length} duplicate codes`);
    }
    
    if (results.expiredCoupons.length > 10) {
      console.log(`   - Clean up ${results.expiredCoupons.length} expired coupons to improve performance`);
    }
    
    if (results.invalidCoupons.length > 0) {
      console.log(`   - Fix ${results.invalidCoupons.length} invalid coupon configurations`);
    }

    console.log('   - Schedule regular health checks (daily recommended)');
    console.log('   - Implement monitoring alerts for health score < 80');
  }

  async autoRepair(results) {
    console.log('');
    console.log('🔧 AUTO-REPAIR MODE');
    console.log('===================');

    if (results.orphanedRules.length > 0) {
      console.log(`Repairing ${results.orphanedRules.length} orphaned rules...`);
      
      for (const rule of results.orphanedRules) {
        try {
          const code = this.generateCodeFromTitle(rule.title);
          const discountCodeData = {
            discount_code: { code, usage_count: 0 }
          };

          await this.client.post(`/price_rules/${rule.id}/discount_codes.json`, discountCodeData);
          console.log(`   ✅ Repaired rule ${rule.id} with code: ${code}`);
        } catch (error) {
          console.log(`   ❌ Failed to repair rule ${rule.id}: ${error.message}`);
        }
      }
    }

    console.log('Auto-repair completed!');
  }

  generateCodeFromTitle(title) {
    return title
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10) + Math.random().toString(36).substring(2, 5).toUpperCase();
  }

  async getPriceRules() {
    try {
      const response = await this.client.get('/price_rules.json?limit=250');
      return response.data.price_rules || [];
    } catch (error) {
      console.error('Error fetching price rules:', error.message);
      return [];
    }
  }

  async getDiscountCodes(priceRuleId) {
    try {
      const response = await this.client.get(`/price_rules/${priceRuleId}/discount_codes.json?limit=250`);
      return response.data.discount_codes || [];
    } catch (error) {
      console.error(`Error fetching discount codes for rule ${priceRuleId}:`, error.message);
      return [];
    }
  }
}

// Run the health check
async function main() {
  const checker = new CouponHealthChecker();
  
  console.log('Usage:');
  console.log('  node health-check-coupons.js                 # Run health check only');
  console.log('  node health-check-coupons.js --auto-repair   # Run health check and auto-repair');
  console.log('');

  const results = await checker.runHealthCheck();
  
  // Exit with appropriate code
  process.exit(results.healthScore >= 80 ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CouponHealthChecker;