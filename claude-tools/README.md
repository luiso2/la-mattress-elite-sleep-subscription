# 🛠️ Claude Tools for Stripe

Command-line utilities for managing Stripe subscriptions, customers, and webhooks.

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

## 🚀 Installation

1. Navigate to the claude-tools directory:
```bash
cd claude-tools
```

2. Install dependencies:
```bash
npm install
```

3. Verify configuration:
```bash
npm run check
```

## ⚙️ Configuration

The tools use the `.env.local` file from the parent directory. Ensure you have:

```env
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
JWT_SECRET=your-secret-key
```

## 🔧 Available Tools

### 1. Find Customer (`find-customer.js`)
Search for customers by email and view detailed information.

```bash
node find-customer.js <email>

# Example
node find-customer.js john@example.com
```

**Shows:**
- Customer details (ID, name, email, created date)
- Subscriptions (status, amount, billing dates)
- Payment methods
- Recent invoices
- Total lifetime value
- Metadata

### 2. Test Webhook (`test-webhook.js`)
Send test webhook events to your local server.

```bash
node test-webhook.js <event-type> [customer-email] [webhook-url]

# Examples
node test-webhook.js --list                                    # List available events
node test-webhook.js payment_intent.succeeded
node test-webhook.js customer.subscription.created john@example.com
node test-webhook.js invoice.payment_failed john@example.com http://localhost:3000/api/webhook
```

**Available Events:**
- `payment_intent.succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. List Subscriptions (`list-subscriptions.js`)
View all subscriptions with detailed analytics.

```bash
node list-subscriptions.js [status]

# Examples
node list-subscriptions.js              # All subscriptions
node list-subscriptions.js active       # Only active
node list-subscriptions.js canceled     # Only canceled
node list-subscriptions.js past_due     # Past due subscriptions
```

**Shows:**
- Subscription summary (total, active, MRR, ARR)
- Status breakdown
- Detailed list with customer info
- Churn metrics

### 4. Manage Metadata (`manage-metadata.js`)
View and modify customer metadata.

```bash
node manage-metadata.js <email> <action> [key] [value]

# Examples
node manage-metadata.js john@example.com get                              # View all metadata
node manage-metadata.js john@example.com set credits_available 150        # Set value
node manage-metadata.js john@example.com remove old_key                   # Remove key
node manage-metadata.js john@example.com clear                            # Clear all
node manage-metadata.js john@example.com template elite-sleep-active      # Apply template
```

**Available Templates:**
- `elite-sleep-active` - Set up active Elite Sleep+ member
- `elite-sleep-canceled` - Mark as canceled member
- `reset-protectors` - Reset all protector replacements
- `reset-credits` - Reset all credit values

### 5. Check Configuration (`check-config.js`)
Verify your Stripe setup and configuration.

```bash
node check-config.js
```

**Checks:**
- Environment variables
- Stripe API connection
- Products and prices
- Webhook configuration
- Customer statistics
- Project file structure

## 📚 Usage Examples

### Complete Customer Setup
```bash
# 1. Find customer
node find-customer.js arman@lamattress.com

# 2. Set up as Elite Sleep+ member
node manage-metadata.js arman@lamattress.com template elite-sleep-active

# 3. Verify setup
node find-customer.js arman@lamattress.com

# 4. Test webhook
node test-webhook.js customer.subscription.created arman@lamattress.com
```

### Debug Subscription Issues
```bash
# 1. Check all subscriptions
node list-subscriptions.js

# 2. Find specific customer
node find-customer.js customer@example.com

# 3. Check their metadata
node manage-metadata.js customer@example.com get

# 4. Test webhook events
node test-webhook.js invoice.payment_failed customer@example.com
```

### Reset Customer Benefits
```bash
# Reset credits
node manage-metadata.js john@example.com template reset-credits

# Reset protectors
node manage-metadata.js john@example.com template reset-protectors

# Or manually set specific values
node manage-metadata.js john@example.com set credits_available 180
node manage-metadata.js john@example.com set protector_1_used false
```

## 🎯 Quick Commands (npm scripts)

```bash
npm run find -- john@example.com              # Find customer
npm run webhook -- --list                     # List webhook events
npm run subs                                  # List all subscriptions
npm run subs -- active                        # List active subscriptions
npm run metadata -- john@example.com get      # View metadata
npm run check                                 # Check configuration
```

## 🔍 Troubleshooting

### Common Issues

**1. STRIPE_SECRET_KEY not found**
- Ensure `.env.local` exists in parent directory
- Check that the file contains your Stripe keys

**2. Customer not found**
- Verify the email is correct
- Check if using test vs live mode
- Ensure customer exists in your Stripe account

**3. Webhook test fails**
- Verify your local server is running
- Check the webhook URL (default: http://localhost:3000/api/webhook)
- Ensure STRIPE_WEBHOOK_SECRET matches your webhook endpoint

**4. Connection refused**
- Check your internet connection
- Verify Stripe API key is valid
- Ensure you're not rate-limited

### Test vs Live Mode

The tools automatically detect if you're using test or live keys:
- Test keys: `sk_test_...` and `pk_test_...`
- Live keys: `sk_live_...` and `pk_live_...`

⚠️ **Warning:** Be careful when using live mode - real charges will be processed!

## 💡 Pro Tips

1. **Always verify with test mode first** before using live keys
2. **Use templates** for consistent metadata setup
3. **Check configuration** regularly with `npm run check`
4. **Test webhooks locally** before deploying
5. **Monitor MRR/ARR** with list-subscriptions

## 📞 Support

For issues or questions:
- Check existing customer: `node find-customer.js <email>`
- Verify configuration: `node check-config.js`
- Test webhooks: `node test-webhook.js --list`

## 📄 License

MIT - LA Mattress Development Team

---

**Built for LA Mattress Elite Sleep+ Subscription Portal**