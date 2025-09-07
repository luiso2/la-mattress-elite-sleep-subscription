#!/usr/bin/env node

/**
 * List Stripe Subscriptions
 * Usage: node list-subscriptions.js [status]
 * Example: node list-subscriptions.js active
 * Status options: active, past_due, canceled, all
 */

require('dotenv').config({ path: '../.env.local' });
const Stripe = require('stripe');

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
  magenta: '\x1b[35m',
};

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

function formatCurrency(amount, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

async function listSubscriptions(statusFilter = 'all') {
  try {
    console.log(`\n${colors.cyan}📊 Fetching subscriptions (status: ${statusFilter})...${colors.reset}\n`);

    const params = {
      limit: 100,
      expand: ['data.customer', 'data.default_payment_method']
    };

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    const subscriptions = await stripe.subscriptions.list(params);

    if (subscriptions.data.length === 0) {
      console.log(`${colors.yellow}No subscriptions found with status: ${statusFilter}${colors.reset}`);
      return;
    }

    // Group subscriptions by status
    const byStatus = {};
    let totalMRR = 0;
    let activeCount = 0;

    subscriptions.data.forEach(sub => {
      if (!byStatus[sub.status]) {
        byStatus[sub.status] = [];
      }
      byStatus[sub.status].push(sub);

      if (sub.status === 'active' || sub.status === 'trialing') {
        const amount = sub.items.data.reduce((sum, item) => {
          return sum + (item.price.unit_amount * item.quantity);
        }, 0);
        totalMRR += amount;
        activeCount++;
      }
    });

    // Display summary
    console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}📈 SUBSCRIPTION SUMMARY${colors.reset}`);
    console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.blue}Total Subscriptions:${colors.reset} ${subscriptions.data.length}`);
    console.log(`${colors.green}Active Subscriptions:${colors.reset} ${activeCount}`);
    console.log(`${colors.green}Monthly Recurring Revenue (MRR):${colors.reset} ${formatCurrency(totalMRR)}`);
    console.log(`${colors.cyan}Annual Run Rate (ARR):${colors.reset} ${formatCurrency(totalMRR * 12)}`);
    
    // Status breakdown
    console.log(`\n${colors.cyan}Status Breakdown:${colors.reset}`);
    Object.entries(byStatus).forEach(([status, subs]) => {
      const statusColor = getStatusColor(status);
      console.log(`  ${statusColor}${status}:${colors.reset} ${subs.length}`);
    });

    // Display detailed subscriptions
    console.log(`\n${colors.bright}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}📋 SUBSCRIPTION DETAILS${colors.reset}`);
    console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}\n`);

    let index = 1;
    for (const sub of subscriptions.data) {
      const customer = sub.customer;
      const customerName = typeof customer === 'object' ? 
        (customer.name || customer.email || customer.id) : customer;
      
      const amount = sub.items.data[0]?.price?.unit_amount || 0;
      const currency = sub.items.data[0]?.price?.currency || 'usd';
      const interval = sub.items.data[0]?.price?.recurring?.interval || 'month';
      
      console.log(`${colors.bright}${index}. Subscription ${sub.id}${colors.reset}`);
      console.log(`   ${colors.blue}Customer:${colors.reset} ${customerName}`);
      console.log(`   ${colors.blue}Status:${colors.reset} ${getStatusColor(sub.status)}${sub.status}${colors.reset}`);
      console.log(`   ${colors.blue}Amount:${colors.reset} ${formatCurrency(amount, currency)} per ${interval}`);
      console.log(`   ${colors.blue}Created:${colors.reset} ${new Date(sub.created * 1000).toLocaleDateString()}`);
      
      if (sub.current_period_end) {
        const nextBilling = new Date(sub.current_period_end * 1000);
        const daysUntil = Math.ceil((nextBilling - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`   ${colors.blue}Next Billing:${colors.reset} ${nextBilling.toLocaleDateString()} (${daysUntil} days)`);
      }
      
      if (sub.trial_end && sub.trial_end > Date.now() / 1000) {
        const trialEnd = new Date(sub.trial_end * 1000);
        console.log(`   ${colors.magenta}Trial Ends:${colors.reset} ${trialEnd.toLocaleDateString()}`);
      }
      
      if (sub.canceled_at) {
        console.log(`   ${colors.red}Canceled:${colors.reset} ${new Date(sub.canceled_at * 1000).toLocaleDateString()}`);
      }
      
      if (sub.cancel_at_period_end) {
        console.log(`   ${colors.yellow}⚠️  Will cancel at period end${colors.reset}`);
      }

      // Payment method
      if (sub.default_payment_method) {
        const pm = sub.default_payment_method;
        if (typeof pm === 'object' && pm.card) {
          console.log(`   ${colors.blue}Payment:${colors.reset} ${pm.card.brand.toUpperCase()} ****${pm.card.last4}`);
        }
      }

      // Metadata
      if (sub.metadata && Object.keys(sub.metadata).length > 0) {
        console.log(`   ${colors.cyan}Metadata:${colors.reset}`);
        Object.entries(sub.metadata).forEach(([key, value]) => {
          console.log(`     • ${key}: ${value}`);
        });
      }

      console.log('');
      index++;
    }

    // Churn analysis
    const canceledCount = byStatus.canceled ? byStatus.canceled.length : 0;
    const churnRate = activeCount > 0 ? 
      ((canceledCount / (activeCount + canceledCount)) * 100).toFixed(1) : 0;

    console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}📉 CHURN METRICS${colors.reset}`);
    console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}\n`);
    console.log(`${colors.blue}Canceled Subscriptions:${colors.reset} ${canceledCount}`);
    console.log(`${colors.blue}Churn Rate:${colors.reset} ${churnRate}%`);

    // Export option
    console.log(`\n${colors.cyan}💡 Tip: Add '--export' to save results to CSV${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

// Main execution
async function main() {
  const status = process.argv[2] || 'all';
  const validStatuses = ['active', 'past_due', 'canceled', 'trialing', 'all'];

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error(`${colors.red}❌ Error: STRIPE_SECRET_KEY not found${colors.reset}`);
    process.exit(1);
  }

  if (!validStatuses.includes(status)) {
    console.log(`${colors.yellow}Invalid status. Valid options: ${validStatuses.join(', ')}${colors.reset}`);
    process.exit(1);
  }

  await listSubscriptions(status);
}

// Run the script
main().catch(console.error);