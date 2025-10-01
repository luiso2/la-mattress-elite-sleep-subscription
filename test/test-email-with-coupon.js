// Test email with coupon code included
const nodemailer = require('nodemailer');

// Gmail configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'lamattress.brand@gmail.com',
    pass: 'wkoprekbimslzesx'
  }
});

// Send welcome email with coupon code
async function sendWelcomeEmailWithCoupon() {
  const email = 'lbencomo94@gmail.com';
  const customerName = 'Luis Bencomo';
  const couponCode = 'WELCOME15LA';  // Example coupon code from Shopify
  const portalUrl = 'https://lamattressubscription.merktop.com/portal';

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
            <h2 style="color: #1e40af;">Hello ${customerName}!</h2>

            <p style="font-size: 16px;">Congratulations! Your <strong>Elite Sleep+ membership</strong> has been successfully activated. You now have access to exclusive benefits worth over $500 annually!</p>

            <div style="background: #fff3e0; border: 2px solid #ffd700; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <h2 style="color: #1e40af; margin-top: 0;">🎁 Your First Month $15 Discount Coupon</h2>
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 15px 0;">
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Your exclusive coupon code:</p>
                <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 2px; margin: 15px 0;">
                  ${couponCode}
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
              <div class="benefit-item"><strong>10% Cashback Program</strong> - Earn cashback on every in-store purchase</div>
            </div>

            <div class="info-section">
              <h3 style="color: #1e40af; margin-top: 0;">How to Use Your Coupon:</h3>
              <p style="margin: 10px 0;"><strong>Online:</strong> Enter code <strong>${couponCode}</strong> at checkout</p>
              <p style="margin: 10px 0;"><strong>In-Store:</strong> Show this email or mention the code to your sales associate</p>
            </div>

            <div class="info-section">
              <h3 style="color: #1e40af; margin-top: 0;">Access Your Member Portal:</h3>
              <p style="margin: 10px 0;">Track your benefits and manage your account at:</p>
              <p style="margin: 10px 0;"><strong>${portalUrl}</strong></p>
              <p style="margin: 10px 0;">Login with: <strong>${email}</strong></p>
            </div>

            <div style="text-align: center;">
              <a href="${portalUrl}" class="cta-button">ACCESS YOUR MEMBER PORTAL</a>
            </div>

            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #4caf50;">
              <p style="margin: 0; font-size: 14px;"><strong>💡 Pro Tip:</strong> Save this email! Your coupon code <strong>${couponCode}</strong> is valid for 30 days. You're getting $15 off on top of all your other Elite Sleep+ benefits!</p>
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
            <p style="margin: 10px 0; font-size: 11px;">This email confirms your subscription and includes your $15 discount coupon. Keep it for your records.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    console.log('📧 Sending welcome email with coupon code to:', email);
    console.log('🎟️ Coupon Code:', couponCode);
    console.log('👤 Customer Name:', customerName);
    console.log('\nThis simulates the real email that will be sent when:');
    console.log('1. Stripe webhook confirms first payment');
    console.log('2. Google Apps Script creates the coupon in Shopify');
    console.log('3. The coupon code is returned to our system\n');

    const info = await transporter.sendMail({
      from: '"LA Mattress Elite Sleep+" <lamattress.brand@gmail.com>',
      to: email,
      subject: `🎉 Welcome to Elite Sleep+! Your coupon code: ${couponCode}`,
      html,
      text: `
        Welcome to LA MATTRESS Elite Sleep+!

        Hello ${customerName}!

        YOUR $15 DISCOUNT COUPON CODE: ${couponCode}
        Valid for 30 days • Minimum purchase: $50

        HOW TO USE:
        • Online: Enter code ${couponCode} at checkout
        • In-Store: Show this email or mention the code

        Your Elite Sleep+ Benefits:
        • $180 Annual Store Credit ($15/month)
        • Free Delivery & Setup
        • Lifetime Warranty Protection
        • 3 Free Mattress Protector Replacements
        • One-Year Low Price Guarantee
        • 10% Cashback Program

        Access Your Member Portal:
        ${portalUrl}
        Login with: ${email}

        Need Help? Call 1-800-218-3578

        Thank you for joining Elite Sleep+!
        LA MATTRESS Team
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n📬 Check lbencomo94@gmail.com inbox for:');
    console.log('   ✓ Welcome message');
    console.log('   ✓ Coupon code: ' + couponCode);
    console.log('   ✓ How to use instructions');
    console.log('   ✓ Portal access details');

  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

// Run the test
console.log('='.repeat(60));
console.log('LA MATTRESS - Elite Sleep+ Welcome Email with Coupon Code');
console.log('='.repeat(60) + '\n');

sendWelcomeEmailWithCoupon();