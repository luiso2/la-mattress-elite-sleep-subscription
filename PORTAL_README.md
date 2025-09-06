# ELITE SLEEP+ Member Portal

## Overview

The Member Portal allows ELITE SLEEP+ customers to access their membership benefits and view their account status by logging in with their email address.

## Portal Features

### Login Page (`/portal`)
- Simple email-based authentication
- Validates membership against Stripe customer database
- Generates JWT token for portal access

### Dashboard Page (`/portal/dashboard`)
- Displays customer information dynamically from Stripe
- Shows available store credits
- Tracks mattress protector replacements
- Lists all membership benefits
- Shows subscription renewal date

## Implementation Details

### Data Flow
1. Customer enters email on login page
2. System searches for customer in Stripe
3. Validates active subscription
4. Generates JWT token with customer data
5. Dashboard fetches real-time data from Stripe

### Dynamic Data
The portal pulls the following information from Stripe:
- Customer name and email
- Subscription status and renewal date
- Member since date (customer creation date)

### Simulated Data
Currently, these features use default values (can be stored in Stripe metadata):
- Store credit balance ($15/month)
- Protector replacement usage (0 of 3 used)

## Customization

To track actual usage data, you can:

1. **Use Stripe Metadata**: Store credit and replacement data in customer metadata
   ```javascript
   await stripe.customers.update(customerId, {
     metadata: {
       credits_available: '15',
       credits_used: '0',
       protector_used: '0',
       protector_total: '3'
     }
   });
   ```

2. **Use a Database**: Create tables to track:
   - Credit transactions
   - Protector replacement history
   - Usage logs

## URLs

- Production Portal Login: https://stripe-cli-backend-production.up.railway.app/portal
- Portal Dashboard: https://stripe-cli-backend-production.up.railway.app/portal/dashboard

## Security

- JWT tokens expire after 1 hour
- Portal access requires active Stripe subscription
- All data fetched in real-time from Stripe API
