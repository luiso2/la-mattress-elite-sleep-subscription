#!/usr/bin/env node

/**
 * Check Stripe Configuration
 * Usage: node check-config.js
 * Verifies your Stripe configuration and tests connectivity
 */

require('dotenv').config({ path: '../.env.local' });
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const checks = {
  passed: [],
  warnings: [],
  failed: []
};

function addCheck(status, message) {
  if (status === 'pass') {
    checks.passed.push(`${colors.green}✓${colors.reset} ${message}`);
  } else if (status === 'warn') {
    checks.warnings.push(`${colors.yellow}⚠${colors.reset} ${message}`);
  } else {
    checks.failed.push(`${colors.red}✗${colors.reset} ${message}`);
  }
}

async function checkEnvironmentVariables() {
  console.log(`\n${colors.cyan}🔍 Checking Environment Variables...${colors.reset}\n`);

  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'JWT_SECRET'
  ];

  const optionalVars = [
    'STRIPE_PRICE_ID_BASIC',
    'STRIPE_PRICE_ID_PREMIUM',
    'STRIPE_PRICE_ID_ENTERPRISE',
    'DATABASE_URL',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASSWORD'
  ];

  // Check required variables
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      const value = process.env[varName];
      const preview = value.substring(0, 10) + '...';
      addCheck('pass', `${varName} is set (${preview})`);
      
      // Check if using test keys in production
      if (varName.includes('STRIPE') && value.includes('_test_')) {
        addCheck('warn', `${varName} is using TEST mode key`);
      }
      if (varName.includes('STRIPE') && value.includes('_live_')) {
        addCheck('pass', `${varName} is using LIVE mode key`);
      }
    } else {
      addCheck('fail', `${varName} is missing`);
    }
  });

  // Check optional variables
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      addCheck('pass', `${varName} is set`);
    } else {
      addCheck('warn', `${varName} is not set (optional)`);
    }
  });
}

async function checkStripeConnection() {
  console.log(`\n${colors.cyan}🔌 Testing Stripe Connection...${colors.reset}\n`);

  if (!process.env.STRIPE_SECRET_KEY) {
    addCheck('fail', 'Cannot test Stripe connection - missing API key');
    return null;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-10-28.acacia',
    });

    // Test API connection
    const account = await stripe.accounts.retrieve();
    addCheck('pass', `Connected to Stripe account: ${account.email || account.id}`);
    addCheck('pass', `Account country: ${account.country}`);
    addCheck('pass', `Account type: ${account.type}`);
    
    if (account.charges_enabled) {
      addCheck('pass', 'Charges are enabled');
    } else {
      addCheck('fail', 'Charges are NOT enabled on this account');
    }

    // Check for test mode
    const isTestMode = process.env.STRIPE_SECRET_KEY.includes('sk_test_');
    if (isTestMode) {
      addCheck('warn', 'Using TEST mode - no real charges will be processed');
    } else {
      addCheck('pass', 'Using LIVE mode - real charges will be processed');
    }

    return { stripe, account, isTestMode };
  } catch (error) {
    addCheck('fail', `Stripe connection failed: ${error.message}`);
    return null;
  }
}

async function checkProducts(stripe, isTestMode) {
  console.log(`\n${colors.cyan}📦 Checking Products and Prices...${colors.reset}\n`);

  try {
    // List products
    const products = await stripe.products.list({ limit: 10, active: true });
    
    if (products.data.length === 0) {
      addCheck('warn', 'No active products found');
    } else {
      addCheck('pass', `Found ${products.data.length} active products`);
      
      // Check for Elite Sleep+ product
      const eliteSleep = products.data.find(p => 
        p.name.toLowerCase().includes('elite') || 
        p.name.toLowerCase().includes('sleep')
      );
      
      if (eliteSleep) {
        addCheck('pass', `Found Elite Sleep+ product: ${eliteSleep.name}`);
      }
    }

    // List prices
    const prices = await stripe.prices.list({ limit: 10, active: true });
    
    if (prices.data.length === 0) {
      addCheck('warn', 'No active prices found');
    } else {
      addCheck('pass', `Found ${prices.data.length} active prices`);
      
      // Check for configured price IDs
      const configuredPrices = [
        process.env.STRIPE_PRICE_ID_BASIC,
        process.env.STRIPE_PRICE_ID_PREMIUM,
        process.env.STRIPE_PRICE_ID_ENTERPRISE
      ].filter(Boolean);

      for (const priceId of configuredPrices) {
        const price = prices.data.find(p => p.id === priceId);
        if (price) {
          const amount = (price.unit_amount / 100).toFixed(2);
          addCheck('pass', `Price ${priceId} exists: $${amount} ${price.currency.toUpperCase()}`);
        } else {
          addCheck('warn', `Configured price ${priceId} not found in Stripe`);
        }
      }
    }
  } catch (error) {
    addCheck('fail', `Failed to check products: ${error.message}`);
  }
}

async function checkWebhooks(stripe) {
  console.log(`\n${colors.cyan}🪝 Checking Webhooks...${colors.reset}\n`);

  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    
    if (webhooks.data.length === 0) {
      addCheck('warn', 'No webhook endpoints configured');
    } else {
      addCheck('pass', `Found ${webhooks.data.length} webhook endpoints`);
      
      webhooks.data.forEach(webhook => {
        const status = webhook.status === 'enabled' ? 'pass' : 'warn';
        addCheck(status, `Webhook: ${webhook.url} (${webhook.status})`);
        
        // Check if webhook secret matches
        if (process.env.STRIPE_WEBHOOK_SECRET === 'whsec_your_webhook_secret_here') {
          addCheck('warn', 'Using default webhook secret - update this!');
        }
      });
    }
  } catch (error) {
    addCheck('warn', `Cannot check webhooks: ${error.message}`);
  }
}

async function checkCustomers(stripe) {
  console.log(`\n${colors.cyan}👥 Checking Customers...${colors.reset}\n`);

  try {
    const customers = await stripe.customers.list({ limit: 1 });
    const totalCustomers = await stripe.customers.list({ limit: 100 });
    
    addCheck('pass', `Total customers: ${totalCustomers.data.length}${totalCustomers.has_more ? '+' : ''}`);

    // Check for subscriptions
    const subscriptions = await stripe.subscriptions.list({ limit: 100, status: 'active' });
    addCheck('pass', `Active subscriptions: ${subscriptions.data.length}${subscriptions.has_more ? '+' : ''}`);

    // Calculate MRR
    let mrr = 0;
    subscriptions.data.forEach(sub => {
      const amount = sub.items.data.reduce((sum, item) => {
        return sum + (item.price.unit_amount * item.quantity);
      }, 0);
      mrr += amount;
    });

    if (mrr > 0) {
      addCheck('pass', `Monthly Recurring Revenue: $${(mrr / 100).toFixed(2)}`);
    }

  } catch (error) {
    addCheck('warn', `Cannot check customers: ${error.message}`);
  }
}

async function checkProjectStructure() {
  console.log(`\n${colors.cyan}📁 Checking Project Structure...${colors.reset}\n`);

  const requiredPaths = [
    '../app/api/webhook/route.ts',
    '../app/api/portal/login/route.ts',
    '../app/api/portal/data/route.ts',
    '../app/portal/page.tsx',
    '../app/portal/dashboard/page.tsx'
  ];

  requiredPaths.forEach(relativePath => {
    const fullPath = path.join(__dirname, relativePath);
    if (fs.existsSync(fullPath)) {
      addCheck('pass', `Found: ${relativePath}`);
    } else {
      addCheck('warn', `Missing: ${relativePath}`);
    }
  });
}

function displaySummary() {
  console.log(`\n${colors.bright}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📊 CONFIGURATION SUMMARY${colors.reset}`);
  console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}\n`);

  if (checks.passed.length > 0) {
    console.log(`${colors.green}✅ Passed (${checks.passed.length}):${colors.reset}`);
    checks.passed.forEach(check => console.log(`  ${check}`));
  }

  if (checks.warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings (${checks.warnings.length}):${colors.reset}`);
    checks.warnings.forEach(check => console.log(`  ${check}`));
  }

  if (checks.failed.length > 0) {
    console.log(`\n${colors.red}❌ Failed (${checks.failed.length}):${colors.reset}`);
    checks.failed.forEach(check => console.log(`  ${check}`));
  }

  // Overall status
  console.log(`\n${colors.bright}═══════════════════════════════════════${colors.reset}`);
  
  if (checks.failed.length === 0) {
    console.log(`${colors.green}🎉 Configuration is valid!${colors.reset}`);
    if (checks.warnings.length > 0) {
      console.log(`${colors.yellow}   (with ${checks.warnings.length} warnings)${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}❌ Configuration has ${checks.failed.length} error(s) that need to be fixed${colors.reset}`);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}🔧 STRIPE CONFIGURATION CHECKER${colors.reset}`);
  console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}`);

  // Run all checks
  await checkEnvironmentVariables();
  
  const connection = await checkStripeConnection();
  if (connection) {
    await checkProducts(connection.stripe, connection.isTestMode);
    await checkWebhooks(connection.stripe);
    await checkCustomers(connection.stripe);
  }
  
  await checkProjectStructure();

  // Display summary
  displaySummary();
}

// Run the script
main().catch(console.error);