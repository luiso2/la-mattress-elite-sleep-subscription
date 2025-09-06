import Stripe from 'stripe';
import { config } from '../config';

class StripeService {
  private stripe: Stripe | null = null;

  private getStripe(): Stripe {
    // Lazy initialization - only create Stripe instance when needed
    if (!this.stripe) {
      // Check if we have the required key
      if (!config.stripe.secretKey) {
        throw new Error('Stripe secret key is not configured');
      }
      
      this.stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2025-08-27.basil',
      });
    }
    return this.stripe;
  }

  async createCustomer(email: string, name?: string) {
    try {
      const customer = await this.getStripe().customers.create({
        email,
        name,
      });
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async createCheckoutSession(
    priceId: string,
    customerId?: string,
    customerEmail?: string,
    successUrl?: string,
    cancelUrl?: string
  ) {
    try {
      const sessionData: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${config.app.url}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${config.app.url}/cancel`,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      };

      if (customerId) {
        sessionData.customer = customerId;
      } else if (customerEmail) {
        sessionData.customer_email = customerEmail;
      }

      const session = await this.getStripe().checkout.sessions.create(sessionData);
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async createBillingPortalSession(customerId: string, returnUrl?: string) {
    try {
      const session = await this.getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || config.app.url,
      });
      return session;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await this.getStripe().subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await this.getStripe().subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, priceId: string) {
    try {
      const subscription = await this.getStripe().subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await this.getStripe().subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });
      
      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  async getCustomerSubscriptions(customerId: string) {
    try {
      const subscriptions = await this.getStripe().subscriptions.list({
        customer: customerId,
        status: 'active',
      });
      return subscriptions.data;
    } catch (error) {
      console.error('Error getting customer subscriptions:', error);
      throw error;
    }
  }

  async constructWebhookEvent(payload: Buffer | string, signature: string) {
    try {
      const event = this.getStripe().webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return null;
    }
  }

  async getCheckoutSession(sessionId: string) {
    try {
      const session = await this.getStripe().checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string) {
    try {
      const customer = await this.getStripe().customers.retrieve(customerId) as Stripe.Customer;
      return customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw error;
    }
  }
}

export default new StripeService();