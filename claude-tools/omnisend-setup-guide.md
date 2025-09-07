# Omnisend Email Integration Setup Guide

## Overview
LA MATTRESS Elite Sleep+ now uses Omnisend for transactional emails to improve deliverability to Gmail and other providers.

## Configuration

### 1. API Key Setup
The Omnisend API key is stored in `.env.local`:
```
OMNISEND_API_KEY=684f01632a862bc64046560a-7qbcxdSwYdszAf4cUMN4aywHYBFK3op67GHHM9QeNsOGS01ZTE
```

### 2. Service Integration
- **Location**: `/lib/services/omnisend.service.ts`
- **Webhook Integration**: `/app/api/webhook/stripe/route.ts`

## Omnisend Events Used

The system triggers these Omnisend events:

1. **elite_sleep_welcome** - New subscription welcome email
2. **subscription_renewed** - Monthly renewal confirmation
3. **payment_failed** - Failed payment notification
4. **subscription_cancelled** - Cancellation confirmation
5. **protector_claimed** - Mattress protector replacement confirmation
6. **credit_used** - Store credit usage notification

## Setting Up Omnisend Automations

### Step 1: Log into Omnisend
Go to: https://app.omnisend.com

### Step 2: Create Automation Workflows

For each event above, create an automation:

1. Go to **Automations** → **Create Workflow**
2. Choose **Custom Event** as trigger
3. Set event name (e.g., `elite_sleep_welcome`)
4. Design your email template
5. Use these variables in your templates:
   - `[[customerName]]` - Customer's name
   - `[[portalUrl]]` - Member portal URL
   - `[[monthlyCredit]]` - Monthly credit amount
   - `[[annualCredit]]` - Annual credit total
   - `[[supportPhone]]` - Support phone number

### Step 3: Email Template Variables

#### Welcome Email (elite_sleep_welcome)
- `customerName` - Member's name
- `portalUrl` - Portal access link
- `monthlyCredit` - $15
- `annualCredit` - $180
- `membershipFee` - $10/month
- `supportPhone` - 1-800-218-3578
- `benefits` - Array of membership benefits

#### Renewal Email (subscription_renewed)
- `customerName` - Member's name
- `creditAdded` - $15
- `nextBillingDate` - Next payment date
- `portalUrl` - Portal access link

#### Payment Failed (payment_failed)
- `customerName` - Member's name
- `updatePaymentUrl` - Portal URL to update payment
- `supportPhone` - Support number

#### Cancellation (subscription_cancelled)
- `customerName` - Member's name
- `accessEndDate` - When access ends
- `reactivateUrl` - URL to reactivate
- `supportPhone` - Support number

#### Protector Claimed (protector_claimed)
- `customerName` - Member's name
- `protectorNumber` - Which protector (1, 2, or 3)
- `claimDate` - Date claimed
- `remainingProtectors` - How many left
- `processingTime` - 24-48 hours

#### Credit Used (credit_used)
- `customerName` - Member's name
- `amountUsed` - Amount of credit used
- `remainingCredit` - Remaining balance
- `transactionDate` - Date of use
- `portalUrl` - Portal access link

## Testing

### Test Email Sending
```bash
# Test Omnisend integration
node claude-tools/test-omnisend-direct.js your-email@example.com
```

### Test Webhook Integration
1. Create a test subscription in Stripe
2. Check Omnisend dashboard for:
   - New contact created
   - Event triggered
   - Email sent

## Monitoring

### Check Email Delivery
1. Go to Omnisend Dashboard
2. Navigate to **Reports** → **Campaign Reports**
3. Check delivery rates, opens, and clicks

### Contact Management
1. Go to **Audience** → **Contacts**
2. Search for customer by email
3. View contact properties and tags
4. Check event history

## Troubleshooting

### Emails Not Sending
1. Verify API key is correct in `.env.local`
2. Check Omnisend automation is active
3. Ensure event names match exactly
4. Check Omnisend account has sufficient credits

### Gmail Delivery Issues
Omnisend handles SPF/DKIM automatically, but ensure:
1. Automation emails have proper subject lines
2. Content doesn't trigger spam filters
3. From name is clear (LA MATTRESS)

### Testing Individual Events
```bash
# Create/update contact only
node claude-tools/test-omnisend-direct.js email@example.com

# Test specific webhook event
curl -X POST http://localhost:3000/api/webhook/stripe \
  -H "stripe-signature: test" \
  -d '{"type":"customer.subscription.created"}'
```

## Benefits of Omnisend

✅ **Better Deliverability** - Omnisend manages sender reputation
✅ **No SMTP Issues** - API-based, no SMTP configuration needed
✅ **Analytics** - Track opens, clicks, and conversions
✅ **Templates** - Visual email designer in Omnisend
✅ **Automation** - Complex workflows and segmentation
✅ **Compliance** - Built-in unsubscribe management

## Support

- **Omnisend Support**: support@omnisend.com
- **API Documentation**: https://api-docs.omnisend.com/
- **Dashboard**: https://app.omnisend.com