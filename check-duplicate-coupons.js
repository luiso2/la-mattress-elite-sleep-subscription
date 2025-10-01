// Script para detectar y limpiar cupones duplicados en Shopify
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'la-mattress.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01';

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ SHOPIFY_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

const shopifyClient = axios.create({
  baseURL: `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}`,
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  }
});

async function checkDuplicateCoupons() {
  console.log('🔍 Checking for duplicate coupons in Shopify...\n');
  
  try {
    // Get all price rules
    const priceRulesResponse = await shopifyClient.get('/price_rules.json?limit=250');
    const priceRules = priceRulesResponse.data.price_rules || [];
    
    console.log(`Found ${priceRules.length} price rules\n`);
    
    // Map to track coupon codes
    const couponMap = new Map();
    const duplicates = [];
    
    // Check discount codes for each price rule
    for (const priceRule of priceRules) {
      console.log(`Checking price rule: ${priceRule.title} (ID: ${priceRule.id})`);
      
      try {
        const discountCodesResponse = await shopifyClient.get(
          `/price_rules/${priceRule.id}/discount_codes.json?limit=250`
        );
        const discountCodes = discountCodesResponse.data.discount_codes || [];
        
        for (const discountCode of discountCodes) {
          const code = discountCode.code;
          
          if (couponMap.has(code)) {
            // Found duplicate
            const existing = couponMap.get(code);
            console.log(`\n⚠️  DUPLICATE FOUND: ${code}`);
            console.log(`   First: Price Rule ${existing.priceRuleId} (${existing.priceRuleTitle})`);
            console.log(`   Second: Price Rule ${priceRule.id} (${priceRule.title})`);
            
            duplicates.push({
              code,
              instances: [
                existing,
                {
                  priceRuleId: priceRule.id,
                  priceRuleTitle: priceRule.title,
                  discountCodeId: discountCode.id,
                  createdAt: discountCode.created_at
                }
              ]
            });
          } else {
            couponMap.set(code, {
              priceRuleId: priceRule.id,
              priceRuleTitle: priceRule.title,
              discountCodeId: discountCode.id,
              createdAt: discountCode.created_at
            });
          }
        }
        
        console.log(`   Found ${discountCodes.length} discount code(s)`);
      } catch (error) {
        console.error(`   Error fetching discount codes: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total unique coupon codes: ${couponMap.size}`);
    console.log(`Duplicate coupon codes found: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\n🔴 DUPLICATES DETAILS:');
      duplicates.forEach(dup => {
        console.log(`\nCoupon Code: ${dup.code}`);
        dup.instances.forEach((instance, index) => {
          console.log(`  ${index + 1}. Price Rule ${instance.priceRuleId}: "${instance.priceRuleTitle}"`);
          console.log(`     Created: ${instance.createdAt}`);
        });
      });
      
      console.log('\n💡 RECOMMENDED ACTION:');
      console.log('Run this script with --clean flag to remove duplicates (keeps the oldest)');
      console.log('Example: node check-duplicate-coupons.js --clean');
    } else {
      console.log('\n✅ No duplicate coupons found!');
    }
    
    // If --clean flag is passed, remove duplicates
    if (process.argv.includes('--clean') && duplicates.length > 0) {
      console.log('\n🧹 CLEANING DUPLICATES...\n');
      
      for (const dup of duplicates) {
        // Sort by creation date to keep the oldest
        dup.instances.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        const toKeep = dup.instances[0];
        const toDelete = dup.instances.slice(1);
        
        console.log(`\nCoupon: ${dup.code}`);
        console.log(`  Keeping: Price Rule ${toKeep.priceRuleId}`);
        
        for (const instance of toDelete) {
          console.log(`  Deleting: Price Rule ${instance.priceRuleId}...`);
          
          try {
            // Delete the entire price rule (which also deletes the discount code)
            await shopifyClient.delete(`/price_rules/${instance.priceRuleId}.json`);
            console.log(`  ✅ Deleted successfully`);
          } catch (error) {
            console.error(`  ❌ Error deleting: ${error.message}`);
          }
        }
      }
      
      console.log('\n✅ Cleanup completed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the check
checkDuplicateCoupons();