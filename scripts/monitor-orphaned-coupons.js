#!/usr/bin/env node

/**
 * Monitor and Repair Orphaned Coupons Script
 * 
 * This script monitors for price rules without discount codes (orphaned rules)
 * and automatically repairs them by creating the missing discount codes.
 * 
 * Usage:
 *   node scripts/monitor-orphaned-coupons.js [--repair] [--verbose]
 * 
 * Options:
 *   --repair   Automatically repair orphaned rules by creating discount codes
 *   --verbose  Show detailed output
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const config = {
  storeUrl: process.env.SHOPIFY_STORE_URL || 'la-mattress.myshopify.com',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
};

const baseURL = `https://${config.storeUrl}/admin/api/${config.apiVersion}`;

const client = axios.create({
  baseURL,
  headers: {
    'X-Shopify-Access-Token': config.accessToken,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Parse command line arguments
const args = process.argv.slice(2);
const shouldRepair = args.includes('--repair');
const verbose = args.includes('--verbose');

async function log(message, force = false) {
  if (verbose || force) {
    console.log(message);
  }
}

async function findOrphanedRules() {
  try {
    log('🔍 Scanning for orphaned price rules...', true);
    
    const priceRulesResponse = await client.get('/price_rules.json?limit=250');
    const priceRules = priceRulesResponse.data.price_rules;
    
    const orphanedRules = [];
    let totalChecked = 0;
    
    for (const rule of priceRules) {
      totalChecked++;
      
      try {
        const codesResponse = await client.get(`/price_rules/${rule.id}/discount_codes.json`);
        const codes = codesResponse.data.discount_codes;
        
        if (codes.length === 0) {
          orphanedRules.push(rule);
          log(`❌ Orphaned: ${rule.title} (ID: ${rule.id})`);
        } else {
          log(`✅ OK: ${rule.title} - ${codes.length} code(s)`);
        }
      } catch (error) {
        console.error(`⚠️ Error checking rule ${rule.title}:`, error.message);
      }
      
      // Rate limiting - small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    log(`\n📊 SCAN RESULTS:`, true);
    log(`Total price rules checked: ${totalChecked}`, true);
    log(`Orphaned rules found: ${orphanedRules.length}`, true);
    
    return orphanedRules;
  } catch (error) {
    console.error('❌ Error scanning for orphaned rules:', error.message);
    return [];
  }
}

async function repairOrphanedRule(rule) {
  try {
    log(`🔧 Repairing rule: ${rule.title}`);
    
    // Generate a discount code based on the rule title
    const codeBase = rule.title
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 10);
    
    const timestamp = Date.now().toString().slice(-6);
    const code = `${codeBase}${timestamp}`;
    
    const discountCodeData = {
      discount_code: {
        code: code,
        usage_count: 0
      }
    };
    
    const response = await client.post(
      `/price_rules/${rule.id}/discount_codes.json`,
      discountCodeData
    );
    
    log(`✅ Created discount code: ${code} for rule ${rule.title}`, true);
    return response.data.discount_code;
  } catch (error) {
    console.error(`❌ Failed to repair rule ${rule.title}:`, error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('🎫 Orphaned Coupons Monitor');
  console.log('============================\n');
  
  if (!config.accessToken) {
    console.error('❌ Error: SHOPIFY_ACCESS_TOKEN not found in environment variables');
    process.exit(1);
  }
  
  const orphanedRules = await findOrphanedRules();
  
  if (orphanedRules.length === 0) {
    console.log('🎉 No orphaned rules found! All price rules have discount codes.');
    return;
  }
  
  if (!shouldRepair) {
    console.log('\n💡 To repair these orphaned rules, run:');
    console.log('   node scripts/monitor-orphaned-coupons.js --repair');
    return;
  }
  
  console.log('\n🔧 REPAIRING ORPHANED RULES...');
  let repaired = 0;
  let failed = 0;
  
  for (const rule of orphanedRules) {
    const result = await repairOrphanedRule(rule);
    if (result) {
      repaired++;
    } else {
      failed++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📈 REPAIR RESULTS:');
  console.log(`Successfully repaired: ${repaired}`);
  console.log(`Failed to repair: ${failed}`);
  
  if (repaired > 0) {
    console.log('\n✅ Repair completed! The "No codes available" error should be resolved.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Monitoring stopped by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});