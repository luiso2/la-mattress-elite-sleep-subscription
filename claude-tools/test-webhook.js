#!/usr/bin/env node

/**
 * Test Stripe Webhook
 * Usage: node test-webhook.js <event-type> [customer-email]
 * Example: node test-webhook.js payment_intent.succeeded john@example.com
 */

require('dotenv').config({ path: './.env.local' });
const axios = require('axios');
const crypto = require('crypto');
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
};

// Common test events
const testEvents = {
  'payment_intent.succeeded': {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2024-10-28.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_' + Date.now(),
        object: 'payment_intent',
        amount: 12000,
        currency: 'usd',
        status: 'succeeded',
        customer: null, // Will be filled if customer provided
        description: 'Test payment for webhook testing',
        metadata: {
          test: 'true',
          timestamp: Date.now().toString()
        }
      }
    }
  },
  'customer.subscription.created': {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2024-10-28.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_' + Date.now(),
        object: 'subscription',
        customer: null, // Will be filled if customer provided
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
        items: {
          data: [{
            id: 'si_test_' + Date.now(),
            price: {
              id: 'price_test_' + Date.now(),
              unit_amount: 1000,
              currency: 'usd',
              recurring: {
                interval: 'month'
              }
            }
          }]
        }
      }
    }
  },
  'customer.subscription.updated': {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2024-10-28.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_test_' + Date.now(),
        object: 'subscription',
        customer: null,
        status: 'active',
        metadata: {
          updated: 'true',
          timestamp: Date.now().toString()
        }
      },
      previous_attributes: {
        metadata: {
          updated: 'false'
        }
      }
    }
  },
  'customer.subscription.deleted': {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2024-10-28.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_test_' + Date.now(),
        object: 'subscription',
        customer: null,
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000)
      }
    }
  },
  'invoice.payment_succeeded': {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2024-10-28.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        id: 'in_test_' + Date.now(),
        object: 'invoice',
        customer: null,
        amount_paid: 1000,
        currency: 'usd',
        status: 'paid',
        subscription: 'sub_test_' + Date.now()
      }
    }
  },
  'invoice.payment_failed': {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2024-10-28.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: 'in_test_' + Date.now(),
        object: 'invoice',
        customer: null,
        amount_due: 1000,
        currency: 'usd',
        status: 'open',
        attempt_count: 1
      }
    }
  }
};

function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

async function sendWebhookEvent(eventType, webhookUrl, customerEmail = null) {
  try {
    console.log(`\n${colors.cyan}🚀 Sending webhook test event: ${eventType}${colors.reset}\n`);

    // Get or create test event
    let event = testEvents[eventType];
    
    if (!event) {
      console.log(`${colors.yellow}⚠️  Using generic event template for: ${eventType}${colors.reset}`);
      event = {
        id: 'evt_test_' + Date.now(),
        object: 'event',
        api_version: '2024-10-28.acacia',
        created: Math.floor(Date.now() / 1000),
        type: eventType,
        data: {
          object: {
            id: 'obj_test_' + Date.now(),
            object: 'test_object',
            metadata: {
              test: 'true',
              event_type: eventType
            }
          }
        }
      };
    }

    // If customer email provided, try to find the customer
    if (customerEmail) {
      console.log(`${colors.blue}Looking up customer: ${customerEmail}${colors.reset}`);
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        console.log(`${colors.green}✓ Found customer: ${customer.id}${colors.reset}`);
        
        // Update event with real customer ID
        if (event.data.object.customer !== undefined) {
          event.data.object.customer = customer.id;
        }
        
        // For subscription events, get real subscription if exists
        if (eventType.includes('subscription')) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 1
          });
          
          if (subscriptions.data.length > 0) {
            const sub = subscriptions.data[0];
            console.log(`${colors.green}✓ Using real subscription: ${sub.id}${colors.reset}`);
            event.data.object = {
              ...sub,
              ...event.data.object,
              id: sub.id,
              customer: customer.id
            };
          }
        }
      } else {
        console.log(`${colors.yellow}⚠️  Customer not found, using test data${colors.reset}`);
      }
    }

    // Prepare payload
    const payload = JSON.stringify(event);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
    const signature = generateSignature(payload, webhookSecret);

    console.log(`${colors.blue}📤 Sending to: ${webhookUrl}${colors.reset}`);
    console.log(`${colors.blue}Event ID: ${event.id}${colors.reset}`);
    console.log(`${colors.blue}Event Type: ${event.type}${colors.reset}`);

    // Send the webhook
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      timeout: 10000
    });

    console.log(`\n${colors.green}✅ Webhook sent successfully!${colors.reset}`);
    console.log(`${colors.blue}Response Status: ${response.status} ${response.statusText}${colors.reset}`);
    
    if (response.data) {
      console.log(`${colors.blue}Response Data:${colors.reset}`);
      console.log(JSON.stringify(response.data, null, 2));
    }

    return true;
  } catch (error) {
    console.error(`\n${colors.red}❌ Webhook send failed!${colors.reset}`);
    
    if (error.response) {
      console.error(`${colors.red}Status: ${error.response.status}${colors.reset}`);
      console.error(`${colors.red}Response: ${JSON.stringify(error.response.data)}${colors.reset}`);
    } else if (error.request) {
      console.error(`${colors.red}No response received. Is the webhook URL correct?${colors.reset}`);
    } else {
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    }
    
    return false;
  }
}

async function listAvailableEvents() {
  console.log(`\n${colors.cyan}📋 Available Test Events:${colors.reset}\n`);
  
  Object.keys(testEvents).forEach(eventType => {
    console.log(`  ${colors.blue}•${colors.reset} ${eventType}`);
  });
  
  console.log(`\n${colors.yellow}You can also use any Stripe event type name${colors.reset}`);
}

// Main execution
async function main() {
  const eventType = process.argv[2];
  const customerEmail = process.argv[3];
  const webhookUrl = process.argv[4] || 'http://localhost:3000/api/webhook';

  if (!eventType || eventType === '--list') {
    console.log(`${colors.yellow}Usage: node test-webhook.js <event-type> [customer-email] [webhook-url]${colors.reset}`);
    console.log(`Example: node test-webhook.js payment_intent.succeeded`);
    console.log(`Example: node test-webhook.js customer.subscription.created john@example.com`);
    console.log(`Example: node test-webhook.js invoice.payment_failed john@example.com http://localhost:3000/api/stripe/webhook`);
    
    await listAvailableEvents();
    process.exit(0);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error(`${colors.red}❌ Error: STRIPE_SECRET_KEY not found in environment variables${colors.reset}`);
    process.exit(1);
  }

  await sendWebhookEvent(eventType, webhookUrl, customerEmail);
}

// Run the script
main().catch(console.error);