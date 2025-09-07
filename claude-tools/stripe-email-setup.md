# Stripe Email Configuration for LA MATTRESS Elite Sleep+

## 1. Enable Customer Emails in Stripe Dashboard

Go to: https://dashboard.stripe.com/settings/emails

### Customer Email Settings:
- ✅ **Successful payments** - ON
- ✅ **Successful subscriptions** - ON
- ✅ **Refunds** - ON
- ✅ **Subscription updates** - ON
- ✅ **Failed payment notifications** - ON

## 2. Customize Email Branding

Go to: https://dashboard.stripe.com/settings/branding

### Brand Settings:
- **Brand name:** LA MATTRESS Elite Sleep+
- **Primary color:** #1e40af
- **Accent color:** #00bcd4
- **Logo:** Upload LA MATTRESS logo

### Custom Email Footer Text:
```
Thank you for being an Elite Sleep+ member!

Your benefits include:
• $180 annual store credit ($15/month)
• Free delivery & professional setup
• Lifetime warranty protection
• 3 free mattress protector replacements

Access your member portal: https://lamattressubscription.merktop.com/portal

Questions? Call us at 1-800-218-3578
```

## 3. Configure Receipt Settings

Go to: https://dashboard.stripe.com/settings/public

### Public Business Information:
- **Business name:** LA MATTRESS
- **Support email:** support@lamattress.com
- **Support phone:** 1-800-218-3578
- **Support URL:** https://lamattressubscription.merktop.com/portal
- **Statement descriptor:** LA MATTRESS ELITE

## 4. Set Up Invoice Settings (for subscriptions)

Go to: https://dashboard.stripe.com/settings/billing/invoice

### Invoice Template:
- **Default payment terms:** Due upon receipt
- **Default footer:**
```
LA MATTRESS Elite Sleep+ Membership
Monthly membership: $10
Monthly credit received: $15

This invoice is for your Elite Sleep+ membership. 
Your benefits are active and available for use.
```

## 5. Customer Portal Configuration

Go to: https://dashboard.stripe.com/settings/billing/portal

### Enable Features:
- ✅ Update payment methods
- ✅ View billing history
- ✅ Download invoices
- ✅ Cancel subscriptions
- ❌ Pause subscriptions (disable this)
- ❌ Switch plans (disable this)

### Portal Branding:
- Use same colors and logo as email branding
- Add welcome message:
```
Welcome to your LA MATTRESS Elite Sleep+ billing portal.
Here you can manage your payment method and view your billing history.
For your member benefits, visit: https://lamattressubscription.merktop.com/portal
```

## 6. Subscription Email Triggers

Stripe will automatically send emails for these events:

1. **New Subscription Created**
   - Customer receives confirmation with first invoice
   - Includes payment amount and next billing date

2. **Payment Successful**
   - Monthly receipt sent automatically
   - Shows $10 charge for Elite Sleep+ membership

3. **Payment Failed**
   - Customer notified immediately
   - Includes link to update payment method

4. **Subscription Cancelled**
   - Confirmation of cancellation
   - Shows when access ends

## 7. API Configuration for Custom Emails

If you still want custom emails via webhook, update the customer with email preferences:

```javascript
// When creating/updating customer
const customer = await stripe.customers.create({
  email: 'customer@example.com',
  name: 'John Doe',
  metadata: {
    welcome_email_sent: 'false',
    stripe_emails_enabled: 'true'
  },
  invoice_settings: {
    custom_fields: [
      {
        name: 'Membership',
        value: 'Elite Sleep+ Active'
      }
    ],
    footer: 'Thank you for your Elite Sleep+ membership!'
  }
});

// When creating subscription
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_id' }],
  metadata: {
    program: 'Elite Sleep+',
    benefits: '$180 annual credit, free delivery, lifetime warranty'
  },
  description: 'LA MATTRESS Elite Sleep+ Monthly Membership'
});
```

## 8. Testing Stripe Emails

To test if emails are working:

1. Create a test subscription in Stripe Test Mode
2. Use your email as the customer
3. Complete a test payment
4. Check if you receive Stripe's automatic emails

## 9. Advantages of Using Stripe Emails

✅ **Reliability:** No SMTP configuration needed
✅ **Deliverability:** Stripe has excellent email reputation
✅ **Automatic:** No webhook code required
✅ **Professional:** Pre-designed responsive templates
✅ **Multi-language:** Automatic translation support
✅ **Compliance:** Includes required legal text

## 10. Webhook + Stripe Emails Strategy

Best approach for LA MATTRESS:

1. **Let Stripe handle:**
   - Payment receipts
   - Failed payment notifications
   - Subscription confirmations
   - Cancellation confirmations

2. **Use custom emails for:**
   - Welcome message with portal instructions (one-time only)
   - Special promotions
   - Protector replacement confirmations
   - Credit usage notifications

This hybrid approach ensures reliable delivery while maintaining custom branding where needed.