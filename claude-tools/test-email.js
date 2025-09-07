#!/usr/bin/env node

/**
 * Email Testing Tool for LA MATTRESS Elite Sleep+
 * Usage: node claude-tools/test-email.js [email] [template]
 * 
 * Templates available:
 * - welcome (default): Welcome email for new subscribers
 * - cancelled: Subscription cancellation email
 * - payment-failed: Payment failure notification
 * 
 * Example:
 * node claude-tools/test-email.js user@example.com welcome
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

// Get command line arguments
const args = process.argv.slice(2);
const recipientEmail = args[0] || 'lbencomo94@gmail.com';
const templateType = args[1] || 'welcome';
const customerName = args[2] || 'Test Customer';

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const templates = {
  welcome: {
    subject: 'Welcome to LA MATTRESS Elite Sleep+ - Your Membership is Active! 🎉',
    html: `
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
                <p style="margin: 10px 0;"><strong>${recipientEmail}</strong></p>
                <p style="margin: 15px 0; font-size: 14px; color: #666;">No password needed - just enter your email to access your dashboard instantly!</p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://lamattressubscription.merktop.com/portal" class="cta-button">ACCESS YOUR MEMBER PORTAL</a>
              </div>
              
              <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <p style="margin: 0; font-size: 14px;"><strong>Monthly Billing:</strong> Your membership fee of $10/month will be automatically charged to your payment method. You're getting $15 in credits for just $10 - that's 150% value!</p>
              </div>
              
              <p style="margin-top: 25px; font-size: 14px; color: #666;">
                <strong>Need Help?</strong><br>
                Visit us in-store or call <strong>1-800-218-3578</strong><br>
                Our team is here to help you make the most of your Elite Sleep+ membership.
              </p>
              
              <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 25px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  <strong>⚠️ TEST EMAIL</strong><br>
                  This is a test email sent from the development environment.<br>
                  Sent to: ${recipientEmail} | Template: ${templateType}
                </p>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 5px 0;"><strong>LA MATTRESS</strong></p>
              <p style="margin: 5px 0;">Elite Sleep+ Premium Membership Program</p>
              <p style="margin: 10px 0; font-size: 11px;">This email confirms your subscription to Elite Sleep+. You can manage your membership anytime through the member portal.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  cancelled: {
    subject: 'LA MATTRESS Elite Sleep+ - Subscription Cancelled',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Cancelled</h1>
            </div>
            <div class="content">
              <p>We're sorry to see you go!</p>
              <p>Your Elite Sleep+ subscription has been cancelled.</p>
              <p style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 25px; text-align: center;">
                <strong>⚠️ TEST EMAIL</strong> - Template: ${templateType}
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  'payment-failed': {
    subject: 'LA MATTRESS Elite Sleep+ - Payment Failed ⚠️',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff9800; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }
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
              <p>Please update your payment method to avoid service interruption.</p>
              <p style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 25px; text-align: center;">
                <strong>⚠️ TEST EMAIL</strong> - Template: ${templateType}
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }
};

// Main function
async function sendTestEmail() {
  try {
    console.log('\n========================================');
    console.log('LA MATTRESS Elite Sleep+ - Email Test Tool');
    console.log('========================================\n');
    
    // Check if email credentials are configured
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.error('❌ Error: Email credentials not configured in .env.local');
      console.log('\nPlease ensure these variables are set:');
      console.log('- EMAIL_USER');
      console.log('- EMAIL_PASSWORD');
      process.exit(1);
    }

    console.log('📧 Email Configuration:');
    console.log(`   Host: ${emailConfig.host}`);
    console.log(`   Port: ${emailConfig.port}`);
    console.log(`   From: ${emailConfig.auth.user}`);
    console.log(`   To: ${recipientEmail}`);
    console.log(`   Template: ${templateType}`);
    console.log(`   Customer Name: ${customerName}\n`);

    // Verify transporter connection
    console.log('🔌 Testing email server connection...');
    await transporter.verify();
    console.log('✅ Email server connection successful!\n');

    // Get template
    const template = templates[templateType];
    if (!template) {
      console.error(`❌ Error: Template "${templateType}" not found`);
      console.log('\nAvailable templates:');
      Object.keys(templates).forEach(t => console.log(`  - ${t}`));
      process.exit(1);
    }

    // Send email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"LA MATTRESS Elite Sleep+" <${emailConfig.auth.user}>`,
      to: recipientEmail,
      subject: `[TEST] ${template.subject}`,
      html: template.html,
      text: template.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Accepted: ${info.accepted.join(', ')}`);
    
    if (info.rejected && info.rejected.length > 0) {
      console.log(`   ⚠️ Rejected: ${info.rejected.join(', ')}`);
    }

    console.log('\n========================================');
    console.log('✨ Test completed successfully!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('   1. EMAIL_USER and EMAIL_PASSWORD in .env.local');
      console.log('   2. Enable "Less secure app access" if using Gmail');
      console.log('   3. Use app-specific password for 2FA accounts');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Please check:');
      console.log('   1. EMAIL_HOST and EMAIL_PORT settings');
      console.log('   2. Firewall/antivirus blocking the connection');
      console.log('   3. SMTP server is accessible');
    }
    
    console.log('\n========================================\n');
    process.exit(1);
  }
}

// Run the test
sendTestEmail();