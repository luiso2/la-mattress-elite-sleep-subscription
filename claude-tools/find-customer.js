#!/usr/bin/env node

/**
 * Find Stripe Customer by Email
 * Usage: node find-customer.js <email>
 * Example: node find-customer.js john@example.com
 */

require('dotenv').config({ path: '../.env.local' });
const Stripe = require('stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
});

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

async function findCustomerByEmail(email) {
  try {
    console.log(`\n${colors.cyan}🔍 Searching for customer: ${email}${colors.reset}\n`);

    // Search for customers by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 10,
    });

    if (customers.data.length === 0) {
      console.log(`${colors.yellow}⚠️  No customer found with email: ${email}${colors.reset}`);
      return null;
    }

    // Process each customer found
    for (const customer of customers.data) {
      console.log(`${colors.green}✅ Customer Found:${colors.reset}`);
      console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.blue}ID:${colors.reset} ${customer.id}`);
      console.log(`${colors.blue}Name:${colors.reset} ${customer.name || 'Not set'}`);
      console.log(`${colors.blue}Email:${colors.reset} ${customer.email}`);
      console.log(`${colors.blue}Created:${colors.reset} ${new Date(customer.created * 1000).toLocaleString()}`);
      console.log(`${colors.blue}Description:${colors.reset} ${customer.description || 'None'}`);
      console.log(`${colors.blue}Phone:${colors.reset} ${customer.phone || 'Not set'}`);
      
      // Display metadata
      if (customer.metadata && Object.keys(customer.metadata).length > 0) {
        console.log(`\n${colors.cyan}📋 Metadata:${colors.reset}`);
        for (const [key, value] of Object.entries(customer.metadata)) {
          console.log(`  ${colors.blue}${key}:${colors.reset} ${value}`);
        }
      }

      // Get subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 5,
      });

      if (subscriptions.data.length > 0) {
        console.log(`\n${colors.cyan}📊 Subscriptions:${colors.reset}`);
        for (const sub of subscriptions.data) {
          const product = sub.items.data[0]?.price?.product;
          const productName = typeof product === 'object' ? product.name : product;
          
          console.log(`  ${colors.bright}Subscription ${sub.id}:${colors.reset}`);
          console.log(`    Status: ${getStatusColor(sub.status)}${sub.status}${colors.reset}`);
          console.log(`    Product: ${productName || 'Unknown'}`);
          console.log(`    Amount: $${(sub.items.data[0]?.price?.unit_amount || 0) / 100} ${sub.items.data[0]?.price?.currency?.toUpperCase()}`);
          console.log(`    Created: ${new Date(sub.created * 1000).toLocaleDateString()}`);
          
          if (sub.current_period_end) {
            console.log(`    Next billing: ${new Date(sub.current_period_end * 1000).toLocaleDateString()}`);
          }
          
          if (sub.canceled_at) {
            console.log(`    ${colors.red}Canceled: ${new Date(sub.canceled_at * 1000).toLocaleDateString()}${colors.reset}`);
          }
        }
      } else {
        console.log(`\n${colors.yellow}📊 No subscriptions found${colors.reset}`);
      }

      // Get payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
        limit: 3,
      });

      if (paymentMethods.data.length > 0) {
        console.log(`\n${colors.cyan}💳 Payment Methods:${colors.reset}`);
        for (const pm of paymentMethods.data) {
          console.log(`  ${pm.card.brand.toUpperCase()} ****${pm.card.last4} (Exp: ${pm.card.exp_month}/${pm.card.exp_year})`);
        }
      }

      // Get recent invoices
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 5,
      });

      if (invoices.data.length > 0) {
        console.log(`\n${colors.cyan}📄 Recent Invoices:${colors.reset}`);
        for (const invoice of invoices.data) {
          const statusColor = invoice.status === 'paid' ? colors.green : 
                            invoice.status === 'open' ? colors.yellow : colors.red;
          console.log(`  ${invoice.number || invoice.id} - ${statusColor}${invoice.status}${colors.reset} - $${(invoice.amount_paid || invoice.amount_due) / 100} - ${new Date(invoice.created * 1000).toLocaleDateString()}`);
        }
      }

      // Calculate customer value
      const charges = await stripe.charges.list({
        customer: customer.id,
        limit: 100,
      });

      const totalSpent = charges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + charge.amount, 0) / 100;

      console.log(`\n${colors.green}💰 Total Lifetime Value: $${totalSpent.toFixed(2)}${colors.reset}`);
      console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    }

    return customers.data[0];
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return null;
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'active':
    case 'trialing':
      return colors.green;
    case 'past_due':
    case 'unpaid':
      return colors.yellow;
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
      return colors.red;
    default:
      return colors.reset;
  }
}

// Main execution
async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log(`${colors.yellow}Usage: node find-customer.js <email>${colors.reset}`);
    console.log(`Example: node find-customer.js john@example.com`);
    process.exit(1);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error(`${colors.red}❌ Error: STRIPE_SECRET_KEY not found in environment variables${colors.reset}`);
    console.log('Make sure you have a .env.local file in the parent directory');
    process.exit(1);
  }

  await findCustomerByEmail(email);
}

// Run the script
main().catch(console.error);