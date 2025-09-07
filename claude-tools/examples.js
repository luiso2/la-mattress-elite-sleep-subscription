#!/usr/bin/env node

/**
 * Quick Examples - Demonstrates common tool usage
 * Usage: node examples.js
 */

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

console.log(`
${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}
${colors.bright}${colors.cyan}   📚 CLAUDE STRIPE TOOLS - QUICK EXAMPLES${colors.reset}
${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}

${colors.bright}${colors.green}1. CUSTOMER MANAGEMENT${colors.reset}
${colors.cyan}Find a customer and view their details:${colors.reset}
  ${colors.yellow}node find-customer.js arman@lamattress.com${colors.reset}

${colors.cyan}View customer metadata:${colors.reset}
  ${colors.yellow}node manage-metadata.js arman@lamattress.com get${colors.reset}

${colors.cyan}Set customer as Elite Sleep+ member:${colors.reset}
  ${colors.yellow}node manage-metadata.js arman@lamattress.com template elite-sleep-active${colors.reset}

${colors.cyan}Update available credits:${colors.reset}
  ${colors.yellow}node manage-metadata.js arman@lamattress.com set credits_available 180${colors.reset}

${colors.cyan}Reset protector replacements:${colors.reset}
  ${colors.yellow}node manage-metadata.js arman@lamattress.com template reset-protectors${colors.reset}

${colors.bright}${colors.green}2. SUBSCRIPTION MANAGEMENT${colors.reset}
${colors.cyan}List all active subscriptions:${colors.reset}
  ${colors.yellow}node list-subscriptions.js active${colors.reset}

${colors.cyan}View canceled subscriptions:${colors.reset}
  ${colors.yellow}node list-subscriptions.js canceled${colors.reset}

${colors.cyan}Get subscription analytics (MRR/ARR):${colors.reset}
  ${colors.yellow}node list-subscriptions.js${colors.reset}

${colors.bright}${colors.green}3. WEBHOOK TESTING${colors.reset}
${colors.cyan}List available webhook events:${colors.reset}
  ${colors.yellow}node test-webhook.js --list${colors.reset}

${colors.cyan}Test payment succeeded:${colors.reset}
  ${colors.yellow}node test-webhook.js payment_intent.succeeded${colors.reset}

${colors.cyan}Test subscription created for specific customer:${colors.reset}
  ${colors.yellow}node test-webhook.js customer.subscription.created arman@lamattress.com${colors.reset}

${colors.cyan}Test failed payment:${colors.reset}
  ${colors.yellow}node test-webhook.js invoice.payment_failed arman@lamattress.com${colors.reset}

${colors.bright}${colors.green}4. CONFIGURATION${colors.reset}
${colors.cyan}Check your Stripe configuration:${colors.reset}
  ${colors.yellow}node check-config.js${colors.reset}

${colors.cyan}Run setup wizard:${colors.reset}
  ${colors.yellow}node setup.js${colors.reset}

${colors.cyan}Get interactive help:${colors.reset}
  ${colors.yellow}node help.js${colors.reset}

${colors.bright}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}
${colors.bright}${colors.magenta}COMPLETE WORKFLOW EXAMPLES${colors.reset}
${colors.bright}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}

${colors.bright}${colors.blue}Example 1: Set up new Elite Sleep+ member${colors.reset}
${colors.dim}# Step 1: Find the customer${colors.reset}
node find-customer.js henry@lamattress.com

${colors.dim}# Step 2: Apply Elite Sleep+ template${colors.reset}
node manage-metadata.js henry@lamattress.com template elite-sleep-active

${colors.dim}# Step 3: Test subscription webhook${colors.reset}
node test-webhook.js customer.subscription.created henry@lamattress.com

${colors.dim}# Step 4: Verify setup${colors.reset}
node find-customer.js henry@lamattress.com

${colors.bright}${colors.blue}Example 2: Debug customer with payment issues${colors.reset}
${colors.dim}# Step 1: Check customer details${colors.reset}
node find-customer.js customer@example.com

${colors.dim}# Step 2: Review their metadata${colors.reset}
node manage-metadata.js customer@example.com get

${colors.dim}# Step 3: Test failed payment webhook${colors.reset}
node test-webhook.js invoice.payment_failed customer@example.com

${colors.dim}# Step 4: Check subscription status${colors.reset}
node list-subscriptions.js past_due

${colors.bright}${colors.blue}Example 3: Monthly subscription audit${colors.reset}
${colors.dim}# Step 1: Check configuration${colors.reset}
node check-config.js

${colors.dim}# Step 2: View all subscriptions${colors.reset}
node list-subscriptions.js

${colors.dim}# Step 3: Check canceled subscriptions${colors.reset}
node list-subscriptions.js canceled

${colors.dim}# Step 4: Review specific customers if needed${colors.reset}
node find-customer.js specific@customer.com

${colors.bright}${colors.blue}Example 4: Reset customer benefits${colors.reset}
${colors.dim}# Step 1: Find customer${colors.reset}
node find-customer.js wayne@lamattress.com

${colors.dim}# Step 2: Reset credits to full amount${colors.reset}
node manage-metadata.js wayne@lamattress.com set credits_available 180
node manage-metadata.js wayne@lamattress.com set credits_used 0

${colors.dim}# Step 3: Reset protector replacements${colors.reset}
node manage-metadata.js wayne@lamattress.com template reset-protectors

${colors.dim}# Step 4: Verify changes${colors.reset}
node manage-metadata.js wayne@lamattress.com get

${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}
${colors.bright}${colors.cyan}LA MATTRESS EMPLOYEE EMAILS FOR TESTING${colors.reset}
${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}

${colors.yellow}arman@lamattress.com     ayron@lamattress.com
geoffrey@lamattress.com  henry@lamattress.com
elyse@lamattress.com     carlos@lamattress.com
julio@lamattress.com     rony@lamattress.com
wayne@lamattress.com     tim@lamattress.com
brandon@lamattress.com   ronnie@lamattress.com${colors.reset}

${colors.dim}Copy and paste these emails when testing the tools${colors.reset}

${colors.bright}${colors.green}═══════════════════════════════════════════════════════${colors.reset}
${colors.dim}For more information, see README.md or run: node help.js${colors.reset}
`);