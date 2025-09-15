import { NextRequest } from 'next/server';
import stripeService from '@/lib/services/stripe.service';
import authService from '@/lib/services/auth.service';
import emailService from '@/lib/services/email.service';
import omnisendService from '@/lib/services/omnisend.service';
import { ApiResponse } from '@/lib/utils/api-response';
import Stripe from 'stripe';

// Function to send data to Google Apps Script
async function sendToGoogleAppsScript(data: any) {
  try {
    const gasWebhookUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
    if (!gasWebhookUrl) {
      console.warn('Google Apps Script webhook URL not configured');
      return;
    }

    const response = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Data sent to Google Apps Script successfully');
  } catch (error) {
    console.error('Error sending data to Google Apps Script:', error);
  }
}

// Track if welcome email has been sent to avoid duplicates
const welcomeEmailSent = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return ApiResponse.badRequest('No stripe signature found');
    }

    // Get raw body
    const body = await request.text();
    
    // Construct and verify webhook event
    const event = await stripeService.constructWebhookEvent(body, signature);
    
    if (!event) {
      return ApiResponse.badRequest('Invalid webhook signature');
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return ApiResponse.success({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return ApiResponse.serverError('Webhook processing failed', error);
  }
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  if (session.mode === 'subscription' && session.subscription) {
    const customerId = session.customer as string;
    const customer = await stripeService.getCustomer(customerId);
    
    if (customer && customer.email) {
      // Update user with subscription info
      await authService.updateUserByEmail(customer.email, {
        stripeCustomerId: customerId,
        subscriptionId: session.subscription as string,
        subscriptionStatus: 'active',
      });

      // Send data to Google Apps Script
      await sendToGoogleAppsScript({
        name: customer.name || 'Cliente',
        email: customer.email,
        message: 'Gracias por registrarte en Elite Sleep+'
      });

      // Send welcome email only if not sent before
      if (!welcomeEmailSent.has(customer.email)) {
        console.log(`Sending welcome email via Omnisend to ${customer.email}`);
        // Use Omnisend for welcome email
        await omnisendService.sendWelcomeEmail(customer.email, customer.name || undefined, customerId);
        welcomeEmailSent.add(customer.email);
        
        // Store in customer metadata that welcome email was sent
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2024-10-28.acacia',
          });
          await stripe.customers.update(customerId, {
            metadata: {
              ...customer.metadata,
              welcome_email_sent: 'true',
              welcome_email_date: new Date().toISOString(),
            }
          });
        } catch (error) {
          console.error('Error updating customer metadata:', error);
        }
      }
    }
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customer = await stripeService.getCustomer(subscription.customer as string);
  
  if (customer && customer.email) {
    await authService.updateUserByEmail(customer.email, {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    });

    // Send data to Google Apps Script
    await sendToGoogleAppsScript({
      name: customer.name || 'Cliente',
      email: customer.email,
      message: 'Gracias por registrarte en Elite Sleep+'
    });

    // Check if this is the first subscription (welcome email not sent)
    const welcomeEmailAlreadySent = customer.metadata?.welcome_email_sent === 'true';
    
    if (!welcomeEmailAlreadySent && !welcomeEmailSent.has(customer.email)) {
      console.log(`Sending welcome email via Omnisend to new subscriber: ${customer.email}`);
      // Use Omnisend for welcome email
      await omnisendService.sendWelcomeEmail(customer.email, customer.name || undefined, customer.id);
      welcomeEmailSent.add(customer.email);
      
      // Update customer metadata
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2024-10-28.acacia',
        });
        await stripe.customers.update(customer.id, {
          metadata: {
            ...customer.metadata,
            welcome_email_sent: 'true',
            welcome_email_date: new Date().toISOString(),
          }
        });
      } catch (error) {
        console.error('Error updating customer metadata:', error);
      }
    } else {
      console.log(`Subscription renewed for ${customer.email} - no welcome email needed`);
    }
  }
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customer = await stripeService.getCustomer(subscription.customer as string);
  
  if (customer && customer.email) {
    await authService.updateUserByEmail(customer.email, {
      subscriptionStatus: subscription.status,
    });
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customer = await stripeService.getCustomer(subscription.customer as string);
  
  if (customer && customer.email) {
    await authService.updateUserByEmail(customer.email, {
      subscriptionId: undefined,
      subscriptionStatus: 'canceled',
    });

    // Use Omnisend for cancellation email
    await omnisendService.sendCancellationEmail(customer.email, customer.name || undefined);
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as any;
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  
  // Check if this is the first payment (subscription creation) or a renewal
  const isFirstPayment = invoice.billing_reason === 'subscription_create';
  
  if (invoice.subscription) {
    const subscription = await stripeService.getSubscription(invoice.subscription as string);
    const customer = await stripeService.getCustomer(subscription.customer as string);
    
    if (customer && customer.email) {
      await authService.updateUserByEmail(customer.email, {
        subscriptionStatus: 'active',
      });
      
      // Only send welcome email for first payment
      if (isFirstPayment) {
        const welcomeEmailAlreadySent = customer.metadata?.welcome_email_sent === 'true';

        if (!welcomeEmailAlreadySent && !welcomeEmailSent.has(customer.email)) {
          console.log(`First payment received - sending welcome email to ${customer.email}`);

          // Use nodemailer email service for welcome email
          const emailSent = await emailService.sendLaMattressWelcomeEmail(
            customer.email,
            customer.name || undefined
          );

          if (emailSent) {
            console.log(`Welcome email sent successfully to ${customer.email}`);
            welcomeEmailSent.add(customer.email);

            // Send coupon creation request to Google Apps Script
            console.log(`Sending coupon creation request for ${customer.email}`);
            await sendToGoogleAppsScript({
              name: customer.name || 'Cliente',
              email: customer.email,
              message: 'First payment received - create $15 coupon'
            });

            // Update customer metadata
            try {
              const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
                apiVersion: '2024-10-28.acacia',
              });
              await stripe.customers.update(customer.id, {
                metadata: {
                  ...customer.metadata,
                  welcome_email_sent: 'true',
                  welcome_email_date: new Date().toISOString(),
                  coupon_requested: 'true',
                }
              });
            } catch (error) {
              console.error('Error updating customer metadata:', error);
            }
          } else {
            console.error(`Failed to send welcome email to ${customer.email}`);
          }
        }
      } else {
        console.log(`Renewal payment for ${customer.email} - no email sent`);
      }
    }
  }
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as any;
  const customer = await stripeService.getCustomer(invoice.customer as string);
  
  if (customer && customer.email) {
    // Use Omnisend for payment failed email
    await omnisendService.sendPaymentFailedEmail(customer.email, customer.name || undefined);
    
    // Update subscription status
    await authService.updateUserByEmail(customer.email, {
      subscriptionStatus: 'past_due',
    });
  }
}

// Disable body parsing for this route (Stripe needs raw body)
export const runtime = 'nodejs';