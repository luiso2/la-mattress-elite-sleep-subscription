import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (!config.email.auth.user || !config.email.auth.pass) {
      console.warn('Email credentials not configured. Email service disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      },
    });
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email service connected successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured. Skipping email send.');
      return false;
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Elite Sleep+!</h1>
            </div>
            <div class="content">
              <h2>Hello${name ? ` ${name}` : ''}!</h2>
              <p>Thank you for joining Elite Sleep+. Your journey to better sleep starts here.</p>
              <p>With your subscription, you'll have access to:</p>
              <ul>
                <li>Personalized sleep tracking and analysis</li>
                <li>Expert-curated sleep improvement programs</li>
                <li>Relaxing soundscapes and meditations</li>
                <li>Daily sleep tips and insights</li>
              </ul>
              <a href="${config.app.url}/dashboard" class="button">Get Started</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© 2024 Elite Sleep+. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Elite Sleep+ 🌙',
      html,
    });
  }

  async sendLaMattressWelcomeEmail(email: string, customerName?: string, couponCode?: string): Promise<boolean> {
    const portalUrl = 'https://lamattressubscription.merktop.com/portal';

    // Generate a default coupon code if not provided (for display purposes)
    const displayCouponCode = couponCode || 'ELITE15-' + Date.now().toString().slice(-6);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #00bcd4 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
            .benefits-box { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #00bcd4; }
            .benefit-item { margin: 15px 0; padding-left: 25px; position: relative; }
            .benefit-item:before { content: "✓"; position: absolute; left: 0; color: #00bcd4; font-weight: bold; font-size: 18px; }
            .cta-button { display: inline-block; padding: 15px 35px; background: #ffd700; color: #1e40af; text-decoration: none; border-radius: 5px; margin: 25px 0; font-weight: bold; font-size: 16px; }
            .info-section { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
            .highlight { color: #1e40af; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">LA MATTRESS</div>
              <h1 style="margin: 10px 0; font-size: 28px;">Welcome to Elite Sleep+!</h1>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">Your Premium Membership is Now Active</p>
            </div>
            <div class="content">
              <h2 style="color: #1e40af;">Hello${customerName ? ` ${customerName}` : ''}!</h2>
              
              <p style="font-size: 16px;">Congratulations! Your <strong>Elite Sleep+ membership</strong> has been successfully activated. You now have access to exclusive benefits worth over $500 annually!</p>
              
              <div style="background: #fff3e0; border: 2px solid #ffd700; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <h2 style="color: #1e40af; margin-top: 0;">🎁 Your First Month $15 Discount Coupon</h2>
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 15px 0;">
                  <p style="margin: 5px 0; font-size: 14px; color: #666;">Your exclusive coupon code:</p>
                  <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 2px; margin: 15px 0;">
                    ${displayCouponCode}
                  </div>
                  <p style="margin: 5px 0; font-size: 14px; color: #666;">Valid for 30 days • Minimum purchase: $50</p>
                </div>
                <p style="font-size: 14px; color: #666; margin: 10px 0;">Use this code online or show it in-store for instant savings!</p>
              </div>

              <div class="benefits-box">
                <h3 style="color: #1e40af; margin-top: 0;">Your Elite Sleep+ Benefits:</h3>
                <div class="benefit-item"><strong>$180 Annual Store Credit</strong> - $15 automatically added to your account every month</div>
                <div class="benefit-item"><strong>Free Delivery & Setup</strong> - Professional white glove service on all purchases</div>
                <div class="benefit-item"><strong>Lifetime Warranty Protection</strong> - Complete coverage for your mattress investment</div>
                <div class="benefit-item"><strong>3 Free Mattress Protector Replacements</strong> - Keep your mattress fresh and clean</div>
                <div class="benefit-item"><strong>One-Year Low Price Guarantee</strong> - Shop with confidence</div>
              </div>
              
              <div class="info-section">
                <h3 style="color: #1e40af; margin-top: 0;">How to Access Your Member Portal:</h3>
                <p style="margin: 10px 0;">Simply visit our member portal and log in with <strong>the email address associated with your subscription</strong>:</p>
                <p style="margin: 10px 0;"><strong>${email}</strong></p>
                <p style="margin: 15px 0; font-size: 14px; color: #666;">No password needed - just enter your email to access your dashboard instantly!</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${portalUrl}" class="cta-button">ACCESS YOUR MEMBER PORTAL</a>
              </div>
              
              <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <p style="margin: 0; font-size: 14px;"><strong>Monthly Billing:</strong> Your membership fee of $10/month will be automatically charged to your payment method. You're getting $15 in credits for just $10 - that's 150% value!</p>
              </div>
              
              <p style="margin-top: 25px; font-size: 14px; color: #666;">
                <strong>Need Help?</strong><br>
                Visit us in-store or call <strong>1-800-218-3578</strong><br>
                Our team is here to help you make the most of your Elite Sleep+ membership.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 5px 0;"><strong>LA MATTRESS</strong></p>
              <p style="margin: 5px 0;">Elite Sleep+ Premium Membership Program</p>
              <p style="margin: 10px 0; font-size: 11px;">This email confirms your subscription to Elite Sleep+. You can manage your membership anytime through the member portal.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to LA MATTRESS Elite Sleep+ - Your Membership is Active! 🎉',
      html,
    });
  }

  async sendSubscriptionConfirmation(email: string, planName: string): Promise<boolean> {
    // This is now deprecated - use sendLaMattressWelcomeEmail instead
    return this.sendLaMattressWelcomeEmail(email);
  }

  async sendCancellationConfirmation(email: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Cancelled</h1>
            </div>
            <div class="content">
              <p>We're sorry to see you go!</p>
              <p>Your Elite Sleep+ subscription has been cancelled. You'll continue to have access to your account until the end of your current billing period.</p>
              <p>We'd love to have you back anytime. If you change your mind, you can easily reactivate your subscription.</p>
              <a href="${config.app.url}" class="button">Reactivate Subscription</a>
              <p>Thank you for being part of the Elite Sleep+ community.</p>
            </div>
            <div class="footer">
              <p>© 2024 Elite Sleep+. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Elite Sleep+ - Subscription Cancelled',
      html,
    });
  }

  async sendPaymentFailedEmail(email: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff9800; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Issue</h1>
            </div>
            <div class="content">
              <div class="alert">
                <strong>Action Required:</strong> We were unable to process your payment.
              </div>
              <p>We encountered an issue processing your recent payment for Elite Sleep+.</p>
              <p>To avoid any interruption in your service, please update your payment method.</p>
              <a href="${config.app.url}/billing" class="button">Update Payment Method</a>
              <p>If you have any questions or need assistance, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2024 Elite Sleep+. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Elite Sleep+ - Payment Failed ⚠️',
      html,
    });
  }

  async sendTradeInCouponEmail(
    email: string, 
    data: {
      customerName: string;
      couponCode: string;
      discountValue: number;
      discountType: 'percentage' | 'fixed_amount';
      expiryDate?: Date;
      minimumPurchase?: number;
    }
  ): Promise<boolean> {
    const formattedDiscountValue = data.discountType === 'percentage' 
      ? `${data.discountValue}%` 
      : `${data.discountValue}`;

    const expiryDateFormatted = data.expiryDate 
      ? data.expiryDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'No expiration';

    const minimumPurchaseText = data.minimumPurchase && data.minimumPurchase > 0
      ? `Minimum purchase: ${data.minimumPurchase}`
      : 'No minimum purchase required';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #00bcd4 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
            .coupon-box { background: #fff3e0; border: 2px solid #ffd700; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; }
            .coupon-code { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; }
            .code-display { font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 2px; margin: 15px 0; }
            .cta-button { display: inline-block; padding: 15px 35px; background: #ffd700; color: #1e40af; text-decoration: none; border-radius: 5px; margin: 25px 0; font-weight: bold; font-size: 16px; }
            .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00bcd4; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
            .highlight { color: #1e40af; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">LA MATTRESS</div>
              <h1 style="margin: 10px 0; font-size: 28px;">Your Trade-In Credit is Ready!</h1>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">Thank you for choosing LA Mattress</p>
            </div>
            <div class="content">
              <h2 style="color: #1e40af;">Hello ${data.customerName}!</h2>
              
              <p style="font-size: 16px;">Great news! Your <strong>Trade-In Credit</strong> has been successfully processed and is ready to use on your next purchase.</p>
              
              <div class="coupon-box">
                <h2 style="color: #1e40af; margin-top: 0;">🎁 Your Trade-In Credit Coupon</h2>
                <div class="coupon-code">
                  <p style="margin: 5px 0; font-size: 14px; color: #666;">Your exclusive coupon code:</p>
                  <div class="code-display">
                    ${data.couponCode}
                  </div>
                  <p style="margin: 5px 0; font-size: 16px; color: #1e40af; font-weight: bold;">Value: ${formattedDiscountValue}</p>
                  <p style="margin: 5px 0; font-size: 14px; color: #666;">${minimumPurchaseText}</p>
                  <p style="margin: 5px 0; font-size: 14px; color: #666;">Valid until: ${expiryDateFormatted}</p>
                </div>
                <p style="font-size: 14px; color: #666; margin: 10px 0;">Use this code online at checkout or show it to our staff in-store!</p>
              </div>

              <div class="info-box">
                <h3 style="color: #1e40af; margin-top: 0;">How to Use Your Credit:</h3>
                <p style="margin: 10px 0;"><strong>Online:</strong> Enter the code ${data.couponCode} at checkout</p>
                <p style="margin: 10px 0;"><strong>In-Store:</strong> Show this email or provide the code to our sales associate</p>
                <p style="margin: 10px 0; font-size: 14px; color: #666;">This mattress credit trade-in only applies to equal or larger size mattresses.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://mattressstoreslosangeles.com" class="cta-button">SHOP NOW</a>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <p style="margin: 0; font-size: 14px;"><strong>Thank You for Your Trade-In!</strong><br>
                We appreciate your business and look forward to helping you find your perfect new mattress.</p>
              </div>
              
              <p style="margin-top: 25px; font-size: 14px; color: #666;">
                <strong>Need Help?</strong><br>
                Visit us at any LA Mattress location or call <strong>1-800-233-7534</strong><br>
                Our sleep experts are ready to assist you!
              </p>
            </div>
            <div class="footer">
              <p style="margin: 5px 0;"><strong>LA MATTRESS</strong></p>
              <p style="margin: 5px 0;">Your Trusted Sleep Partner Since 1989</p>
              <p style="margin: 10px 0; font-size: 11px;">This email confirms your Trade-In Credit. Please keep it for your records.</p>
              <p style="margin: 10px 0; font-size: 11px;">© 2024 LA Mattress. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🎁 ${data.customerName}, Your ${formattedDiscountValue} Trade-In Credit is Ready!`,
      html,
    });
  }
}

export default new EmailService();