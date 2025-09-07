import { config } from '../config';

interface OmnisendContact {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  customProperties?: Record<string, any>;
}

interface OmnisendEvent {
  email: string;
  eventName: string;
  properties?: Record<string, any>;
}

class OmnisendService {
  private apiKey: string;
  private baseUrl = 'https://api.omnisend.com/v3';
  
  constructor() {
    this.apiKey = process.env.OMNISEND_API_KEY || '';
  }

  private async makeRequest(endpoint: string, method: string, data?: any) {
    if (!this.apiKey) {
      console.warn('Omnisend API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Omnisend API error:', error);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Omnisend request failed:', error);
      return null;
    }
  }

  /**
   * Create or update a contact in Omnisend
   */
  async createOrUpdateContact(contact: OmnisendContact) {
    const contactData = {
      identifiers: [
        {
          type: 'email',
          id: contact.email,
          channels: {
            email: {
              status: 'subscribed',
              statusDate: new Date().toISOString(),
            },
          },
        },
      ],
      firstName: contact.firstName,
      lastName: contact.lastName,
      tags: contact.tags || ['elite-sleep-plus'],
      customProperties: {
        ...contact.customProperties,
        membershipStatus: 'active',
        portalUrl: 'https://lamattressubscription.merktop.com/portal',
      },
    };

    return this.makeRequest('/contacts', 'POST', contactData);
  }

  /**
   * Trigger a transactional email event
   */
  async triggerEvent(eventData: OmnisendEvent) {
    const event = {
      email: eventData.email,
      systemName: eventData.eventName,  // Omnisend API uses 'systemName' not 'eventName'
      eventTime: new Date().toISOString(),
      properties: eventData.properties || {},
    };

    return this.makeRequest('/events', 'POST', event);
  }

  /**
   * Send welcome email for new Elite Sleep+ subscription
   */
  async sendWelcomeEmail(email: string, customerName?: string, customerId?: string) {
    console.log(`Sending welcome email via Omnisend to ${email}`);
    
    // First, create/update the contact
    await this.createOrUpdateContact({
      email,
      firstName: customerName?.split(' ')[0],
      lastName: customerName?.split(' ').slice(1).join(' '),
      tags: ['elite-sleep-plus', 'new-member'],
      customProperties: {
        stripeCustomerId: customerId,
        membershipStartDate: new Date().toISOString(),
        monthlyCredit: 15,
        annualCredit: 180,
        protectorReplacements: 3,
      },
    });

    // Trigger the welcome email event
    return this.triggerEvent({
      email,
      eventName: 'elite_sleep_welcome',
      properties: {
        customerName: customerName || 'Valued Member',
        portalUrl: 'https://lamattressubscription.merktop.com/portal',
        monthlyCredit: '$15',
        annualCredit: '$180',
        membershipFee: '$10/month',
        supportPhone: '1-800-218-3578',
        benefits: [
          '$180 Annual Store Credit',
          'Free Delivery & Setup',
          'Lifetime Warranty Protection',
          '3 Free Mattress Protector Replacements',
          'One-Year Low Price Guarantee',
        ],
      },
    });
  }

  /**
   * Send subscription renewal confirmation
   */
  async sendRenewalConfirmation(email: string, customerName?: string) {
    return this.triggerEvent({
      email,
      eventName: 'subscription_renewed',
      properties: {
        customerName: customerName || 'Valued Member',
        creditAdded: '$15',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        portalUrl: 'https://lamattressubscription.merktop.com/portal',
      },
    });
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedEmail(email: string, customerName?: string) {
    return this.triggerEvent({
      email,
      eventName: 'payment_failed',
      properties: {
        customerName: customerName || 'Valued Member',
        updatePaymentUrl: 'https://lamattressubscription.merktop.com/portal',
        supportPhone: '1-800-218-3578',
      },
    });
  }

  /**
   * Send cancellation confirmation
   */
  async sendCancellationEmail(email: string, customerName?: string, endDate?: string) {
    return this.triggerEvent({
      email,
      eventName: 'subscription_cancelled',
      properties: {
        customerName: customerName || 'Valued Member',
        accessEndDate: endDate || 'end of current billing period',
        reactivateUrl: 'https://lamattressubscription.merktop.com/portal',
        supportPhone: '1-800-218-3578',
      },
    });
  }

  /**
   * Send protector replacement confirmation
   */
  async sendProtectorClaimedEmail(email: string, protectorNumber: number, customerName?: string) {
    return this.triggerEvent({
      email,
      eventName: 'protector_claimed',
      properties: {
        customerName: customerName || 'Valued Member',
        protectorNumber,
        claimDate: new Date().toLocaleDateString(),
        remainingProtectors: 3 - protectorNumber,
        processingTime: '24-48 hours',
      },
    });
  }

  /**
   * Send credit usage confirmation
   */
  async sendCreditUsedEmail(email: string, amount: number, remainingCredit: number, customerName?: string) {
    return this.triggerEvent({
      email,
      eventName: 'credit_used',
      properties: {
        customerName: customerName || 'Valued Member',
        amountUsed: `$${amount}`,
        remainingCredit: `$${remainingCredit}`,
        transactionDate: new Date().toLocaleDateString(),
        portalUrl: 'https://lamattressubscription.merktop.com/portal',
      },
    });
  }

  /**
   * Update contact tags
   */
  async updateContactTags(email: string, tags: string[]) {
    return this.makeRequest(`/contacts/${email}/tags`, 'POST', { tags });
  }

  /**
   * Add contact to a segment
   */
  async addToSegment(email: string, segmentId: string) {
    return this.makeRequest(`/segments/${segmentId}/contacts`, 'POST', {
      emails: [email],
    });
  }
}

export default new OmnisendService();