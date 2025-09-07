#!/usr/bin/env node

/**
 * Gmail Delivery Fix Test
 * Tests different configurations to ensure delivery to Gmail
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const testEmail = process.argv[2] || 'lbencomo94@gmail.com';

console.log('\n===========================================');
console.log('     GMAIL DELIVERY OPTIMIZATION TEST');
console.log('===========================================\n');

console.log('📧 Testing delivery to:', testEmail);
console.log('\nCommon Gmail delivery issues:');
console.log('1. SPF/DKIM records not configured');
console.log('2. Email content triggering spam filters');
console.log('3. Sender reputation issues');
console.log('4. Missing or incorrect headers\n');

// Optimized configuration for Gmail delivery
async function sendOptimizedEmail(testNumber, config, description) {
  console.log(`\n🔧 Test ${testNumber}: ${description}`);
  console.log('---------------------------');
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587, // Use 587 for better Gmail compatibility
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      ...config
    });
    
    // Verify connection
    await transporter.verify();
    console.log('   ✅ Connection verified');
    
    // Create a unique subject to avoid threading
    const uniqueId = Date.now().toString(36);
    const subject = `LA MATTRESS Membership Confirmation #${uniqueId}`;
    
    // Send email with Gmail-friendly headers
    const info = await transporter.sendMail({
      from: `"LA MATTRESS Store" <${process.env.EMAIL_USER}>`, // Use clear sender name
      to: testEmail,
      subject: subject,
      headers: {
        'X-Priority': '3', // Normal priority
        'X-Mailer': 'LA MATTRESS Notification System',
        'List-Unsubscribe': `<mailto:unsubscribe@merktop.com>`,
        'Precedence': 'bulk',
        'X-Entity-Ref-ID': uniqueId,
        'Message-ID': `<${uniqueId}@merktop.com>`,
        'Reply-To': 'noreply@merktop.com',
        'Return-Path': process.env.EMAIL_USER
      },
      text: generatePlainText(),
      html: generateHtmlContent(testNumber, description),
      alternatives: [{
        contentType: 'text/html',
        content: generateHtmlContent(testNumber, description)
      }]
    });
    
    console.log('   ✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Subject: ${subject}`);
    return true;
    
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    return false;
  }
}

function generatePlainText() {
  return `
Welcome to LA MATTRESS Elite Sleep+!

Your membership is now active and you have access to:
- $180 Annual Store Credit ($15/month)
- Free Delivery & Professional Setup
- Lifetime Warranty Protection
- 3 Free Mattress Protector Replacements

Access Your Member Portal:
Visit: https://lamattressubscription.merktop.com/portal
Login with your email address - no password needed!

Need Help?
Call us at 1-800-218-3578

Thank you for choosing LA MATTRESS!

---
This is a transactional email from LA MATTRESS regarding your Elite Sleep+ membership.
To unsubscribe, please contact our support team.
  `.trim();
}

function generateHtmlContent(testNumber, description) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LA MATTRESS Elite Sleep+ Membership</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #00bcd4 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">LA MATTRESS</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px;">Elite Sleep+ Membership Active</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0;">Welcome to Elite Sleep+!</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Your membership is confirmed! You now have access to exclusive benefits worth over $500 annually.
              </p>
              
              <!-- Benefits -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #00bcd4;">
                    <h3 style="color: #1e40af; margin: 0 0 15px 0;">Your Benefits:</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #333333; line-height: 1.8;">
                      <li><strong>$180 Annual Store Credit</strong> - $15 monthly</li>
                      <li><strong>Free Delivery & Setup</strong></li>
                      <li><strong>Lifetime Warranty Protection</strong></li>
                      <li><strong>3 Free Mattress Protector Replacements</strong></li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
                <tr>
                  <td style="background-color: #ffd700; border-radius: 5px;">
                    <a href="https://lamattressubscription.merktop.com/portal" style="display: inline-block; padding: 15px 35px; color: #1e40af; text-decoration: none; font-weight: bold; font-size: 16px;">
                      ACCESS MEMBER PORTAL
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Contact Info -->
              <p style="color: #666666; text-align: center; margin: 30px 0 0 0; font-size: 14px;">
                Questions? Call us at <strong>1-800-218-3578</strong>
              </p>
              
              <!-- Test Info -->
              <div style="background-color: #f0f0f0; padding: 10px; margin-top: 30px; border-radius: 5px;">
                <p style="margin: 0; font-size: 11px; color: #888888; text-align: center;">
                  Test ${testNumber}: ${description}<br>
                  Sent: ${new Date().toISOString()}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                © 2025 LA MATTRESS - Elite Sleep+ Program<br>
                This is a transactional email regarding your membership.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Alternative email providers for testing
async function testAlternativeEmail() {
  console.log('\n🔧 Alternative Test: Sending via different configuration');
  console.log('---------------------------');
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    await transporter.verify();
    console.log('   ✅ Gmail SMTP connection verified');
  } catch (error) {
    console.log('   ℹ️  Gmail SMTP not available (expected if not using Gmail account)');
  }
}

// Check DNS and domain reputation
async function checkDomainReputation() {
  console.log('\n🔍 Domain Reputation Check');
  console.log('---------------------------');
  console.log('   Domain: merktop.com');
  console.log('\n   To improve Gmail delivery:');
  console.log('   1. Configure SPF record: v=spf1 include:_spf.hostinger.com ~all');
  console.log('   2. Configure DKIM signing in Hostinger');
  console.log('   3. Add DMARC record: v=DMARC1; p=none; rua=mailto:dmarc@merktop.com');
  console.log('   4. Warm up IP reputation by sending gradually');
  console.log('   5. Avoid spam trigger words in content');
  console.log('   6. Include unsubscribe link in emails');
}

// Main execution
async function runTests() {
  const results = [];
  
  // Test 1: Standard configuration with Gmail optimizations
  results.push(await sendOptimizedEmail(1, {
    port: 587,
    secure: false
  }, 'STARTTLS with Gmail-friendly headers'));
  
  // Test 2: SSL configuration
  results.push(await sendOptimizedEmail(2, {
    port: 465,
    secure: true
  }, 'SSL/TLS with Gmail-friendly headers'));
  
  // Test 3: With explicit authentication method
  results.push(await sendOptimizedEmail(3, {
    port: 587,
    secure: false,
    authMethod: 'LOGIN'
  }, 'STARTTLS with LOGIN auth'));
  
  // Additional checks
  await testAlternativeEmail();
  await checkDomainReputation();
  
  // Summary
  console.log('\n===========================================');
  console.log('                 SUMMARY');
  console.log('===========================================\n');
  
  const successCount = results.filter(r => r).length;
  console.log(`✅ ${successCount} out of ${results.length} emails sent successfully\n`);
  
  console.log('📌 Next Steps for Gmail Delivery:');
  console.log('----------------------------------');
  console.log('1. Check ALL Gmail folders:');
  console.log('   • Primary, Social, Promotions, Updates tabs');
  console.log('   • Spam/Junk folder');
  console.log('   • All Mail folder');
  console.log('\n2. Search in Gmail using:');
  console.log('   • from:info@merktop.com');
  console.log('   • from:merktop.com');
  console.log('   • subject:"LA MATTRESS"');
  console.log('\n3. Add to contacts:');
  console.log('   • Add info@merktop.com to your Gmail contacts');
  console.log('   • This prevents future emails from going to spam');
  console.log('\n4. Check Gmail filters:');
  console.log('   • Settings → Filters and Blocked Addresses');
  console.log('   • Make sure merktop.com is not blocked');
  console.log('\n5. If still not receiving:');
  console.log('   • The domain may need SPF/DKIM configuration');
  console.log('   • Contact Hostinger support to verify email service');
  console.log('   • Try sending to a different email provider for testing');
  
  console.log('\n===========================================\n');
}

// Run all tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});