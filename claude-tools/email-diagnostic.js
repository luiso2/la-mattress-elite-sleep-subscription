#!/usr/bin/env node

/**
 * Email Diagnostic Tool
 * Tests email configuration and sends simple test emails
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const testEmail = process.argv[2] || 'lbencomo94@gmail.com';

console.log('\n===========================================');
console.log('     EMAIL CONFIGURATION DIAGNOSTIC');
console.log('===========================================\n');

// Display current configuration
console.log('📋 Current Configuration:');
console.log('---------------------------');
console.log(`HOST: ${process.env.EMAIL_HOST}`);
console.log(`PORT: ${process.env.EMAIL_PORT}`);
console.log(`SECURE: ${process.env.EMAIL_SECURE}`);
console.log(`USER: ${process.env.EMAIL_USER}`);
console.log(`PASSWORD: ${process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET'}`);
console.log(`FROM: ${process.env.EMAIL_FROM}`);
console.log(`TEST RECIPIENT: ${testEmail}`);

// Check for missing configuration
const missingConfig = [];
if (!process.env.EMAIL_HOST) missingConfig.push('EMAIL_HOST');
if (!process.env.EMAIL_PORT) missingConfig.push('EMAIL_PORT');
if (!process.env.EMAIL_USER) missingConfig.push('EMAIL_USER');
if (!process.env.EMAIL_PASSWORD) missingConfig.push('EMAIL_PASSWORD');

if (missingConfig.length > 0) {
  console.log('\n❌ Missing configuration:');
  missingConfig.forEach(item => console.log(`   - ${item}`));
  process.exit(1);
}

console.log('\n✅ All required configuration present\n');

// Test different transporter configurations
async function testConfiguration(config, description) {
  console.log(`\n🔧 Testing: ${description}`);
  console.log('---------------------------');
  
  try {
    const transporter = nodemailer.createTransport(config);
    
    // Verify connection
    console.log('   Verifying connection...');
    await transporter.verify();
    console.log('   ✅ Connection successful!');
    
    // Send test email
    console.log('   Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"LA MATTRESS Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: `[DIAGNOSTIC TEST] ${description} - ${new Date().toLocaleTimeString()}`,
      text: `This is a diagnostic test email.\n\nConfiguration: ${description}\n\nTime: ${new Date().toISOString()}\n\nIf you receive this, the email configuration is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Email Diagnostic Test</h2>
            <p><strong>Configuration:</strong> ${description}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Recipient:</strong> ${testEmail}</p>
            <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #666;">If you receive this email, the configuration is working correctly.</p>
            <div style="background: #e3f2fd; padding: 10px; border-radius: 5px; margin-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #1e40af;">
                <strong>Technical Details:</strong><br>
                Host: ${config.host}<br>
                Port: ${config.port}<br>
                Secure: ${config.secure}<br>
                From: ${process.env.EMAIL_USER}
              </p>
            </div>
          </div>
        </div>
      `
    });
    
    console.log('   ✅ Email sent!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    return true;
    
  } catch (error) {
    console.log('   ❌ Failed!');
    console.log(`   Error: ${error.message}`);
    if (error.responseCode) {
      console.log(`   Response Code: ${error.responseCode}`);
    }
    if (error.command) {
      console.log(`   Command: ${error.command}`);
    }
    return false;
  }
}

// Main diagnostic function
async function runDiagnostic() {
  const results = [];
  
  // Test 1: Original configuration (SSL)
  const config1 = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  results.push(await testConfiguration(config1, 'SSL Configuration (Port 465)'));
  
  // Test 2: Try with STARTTLS (Port 587)
  const config2 = {
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  results.push(await testConfiguration(config2, 'STARTTLS Configuration (Port 587)'));
  
  // Test 3: Try with different auth method
  const config3 = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    authMethod: 'PLAIN',
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  };
  results.push(await testConfiguration(config3, 'SSL with PLAIN auth'));
  
  // Summary
  console.log('\n===========================================');
  console.log('            DIAGNOSTIC SUMMARY');
  console.log('===========================================\n');
  
  const successCount = results.filter(r => r).length;
  
  if (successCount === 0) {
    console.log('❌ All configurations failed!');
    console.log('\nPossible issues:');
    console.log('1. Check if the email credentials are correct');
    console.log('2. Ensure the SMTP server allows connections from your IP');
    console.log('3. Check if port 465/587 is not blocked by firewall');
    console.log('4. Verify that "Less secure app access" is enabled (if using Gmail)');
    console.log('5. Try using an app-specific password if 2FA is enabled');
    console.log('\nFor Hostinger:');
    console.log('- Make sure you\'re using the correct SMTP server');
    console.log('- Check if your hosting plan includes email services');
    console.log('- Verify the email account exists and is active');
  } else {
    console.log(`✅ ${successCount} out of ${results.length} configurations worked!`);
    console.log('\nWorking configurations can be used for sending emails.');
    console.log(`Check ${testEmail} inbox (and spam folder) for test emails.`);
  }
  
  console.log('\n===========================================\n');
}

// Run the diagnostic
runDiagnostic().catch(error => {
  console.error('\n❌ Diagnostic failed with error:', error.message);
  process.exit(1);
});