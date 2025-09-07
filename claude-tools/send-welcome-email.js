#!/usr/bin/env node

/**
 * Send Welcome Email via Omnisend
 * Sends a welcome email to a specific recipient
 */

require('dotenv').config({ path: '.env.local' });

const recipientEmail = process.argv[2] || 'lbencomo94@gmail.com';
const customerName = process.argv[3] || 'Valued Member';

const apiKey = process.env.OMNISEND_API_KEY;

if (!apiKey) {
  console.error('❌ OMNISEND_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('\n===========================================');
console.log('     SENDING WELCOME EMAIL');
console.log('===========================================\n');

console.log('📧 Recipient:', recipientEmail);
console.log('👤 Customer Name:', customerName);
console.log('\n------------------------------------------\n');

const baseUrl = 'https://api.omnisend.com/v3';

async function makeRequest(endpoint, method, data) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      if (responseText) console.log(`Response: ${responseText}`);
      return null;
    }

    if (responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText || true;
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function sendWelcomeEmail() {
  // Step 1: Create/Update Contact
  console.log('📝 Step 1: Creating/Updating Contact...');
  
  const contactData = {
    identifiers: [
      {
        type: 'email',
        id: recipientEmail,
        channels: {
          email: {
            status: 'subscribed',
            statusDate: new Date().toISOString(),
          },
        },
      },
    ],
    firstName: customerName.split(' ')[0],
    lastName: customerName.split(' ').slice(1).join(' ') || '',
    tags: ['elite-sleep-plus', 'new-member'],
    customProperties: {
      membershipStatus: 'active',
      membershipStartDate: new Date().toISOString(),
      monthlyCredit: 15,
      annualCredit: 180,
      protectorReplacements: 3,
      portalUrl: 'https://lamattressubscription.merktop.com/portal',
    },
  };
  
  const contactResult = await makeRequest('/contacts', 'POST', contactData);
  
  if (contactResult) {
    console.log('   ✅ Contact created/updated successfully');
    console.log(`   Contact ID: ${contactResult.contactID || 'Updated existing'}`);
  } else {
    console.log('   ❌ Failed to create/update contact');
    return false;
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: Trigger Welcome Event
  console.log('\n📬 Step 2: Triggering Welcome Email Event...');
  
  const eventData = {
    email: recipientEmail,
    systemName: 'elite_sleep_welcome',
    eventTime: new Date().toISOString(),
    properties: {
      customerName: customerName,
      portalUrl: 'https://lamattressubscription.merktop.com/portal',
      monthlyCredit: '$15',
      annualCredit: '$180',
      membershipFee: '$10/month',
      supportPhone: '1-800-218-3578',
      benefits: [
        '$180 Annual Store Credit ($15/month)',
        'Free Delivery & Professional Setup',
        'Lifetime Warranty Protection',
        '3 Free Mattress Protector Replacements',
        'One-Year Low Price Guarantee',
      ],
      welcomeMessage: 'Welcome to LA MATTRESS Elite Sleep+! Your membership is now active.',
      accessInstructions: 'Access your member portal anytime - no password needed, just use your email!',
    },
  };
  
  const eventResult = await makeRequest('/events', 'POST', eventData);
  
  if (eventResult !== null) {
    console.log('   ✅ Welcome email event triggered successfully');
    return true;
  } else {
    console.log('   ❌ Failed to trigger welcome email event');
    return false;
  }
}

async function main() {
  console.log('🚀 Sending LA MATTRESS Elite Sleep+ Welcome Email...\n');
  
  const success = await sendWelcomeEmail();
  
  console.log('\n===========================================');
  console.log('                RESULT');
  console.log('===========================================\n');
  
  if (success) {
    console.log('✅ Welcome email sent successfully!');
    console.log('\n📌 What happens next:');
    console.log('1. Omnisend processes the event');
    console.log('2. If automation is set up, email will be sent');
    console.log('3. Check inbox (including spam folder)');
    console.log('4. Email should arrive within 1-2 minutes');
    
    console.log('\n📧 Email Details:');
    console.log(`   To: ${recipientEmail}`);
    console.log(`   From: LA MATTRESS Elite Sleep+`);
    console.log(`   Subject: Welcome to Elite Sleep+ Membership`);
    console.log(`   Content: Membership benefits and portal access`);
  } else {
    console.log('❌ Failed to send welcome email');
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check Omnisend API key is valid');
    console.log('2. Verify Omnisend account is active');
    console.log('3. Check Omnisend dashboard for errors');
    console.log('4. Ensure automation "elite_sleep_welcome" exists');
  }
  
  console.log('\n🔗 Check Omnisend Dashboard:');
  console.log('   https://app.omnisend.com/');
  console.log('   → Go to Audience → Contacts');
  console.log(`   → Search for: ${recipientEmail}`);
  console.log('   → Check Events tab for "elite_sleep_welcome"');
  
  console.log('\n===========================================\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});