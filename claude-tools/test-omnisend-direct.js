#!/usr/bin/env node

/**
 * Direct Omnisend API Test
 * Tests Omnisend API directly without TypeScript dependencies
 */

require('dotenv').config({ path: '.env.local' });

const testEmail = process.argv[2] || 'lbencomo94@gmail.com';
const apiKey = process.env.OMNISEND_API_KEY;

if (!apiKey) {
  console.error('❌ OMNISEND_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('\n===========================================');
console.log('     OMNISEND DIRECT API TEST');
console.log('===========================================\n');

console.log('📧 Test recipient:', testEmail);
console.log('🔑 API Key:', apiKey.slice(0, 20) + '...');
console.log('\n------------------------------------------\n');

const baseUrl = 'https://api.omnisend.com/v3';

async function makeRequest(endpoint, method, data) {
  try {
    console.log(`   📡 Calling: ${method} ${endpoint}`);
    
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
      console.log(`   ❌ API Error: ${response.status} ${response.statusText}`);
      console.log(`   Response: ${responseText}`);
      return null;
    }

    console.log(`   ✅ Success: ${response.status}`);
    
    if (responseText) {
      try {
        const json = JSON.parse(responseText);
        console.log(`   Response ID: ${json.contactID || json.eventID || 'N/A'}`);
        return json;
      } catch {
        return responseText;
      }
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return null;
  }
}

async function testOmnisend() {
  // Test 1: Create/Update Contact
  console.log('📬 Test 1: Create/Update Contact');
  console.log('----------------------------------');
  
  const contactData = {
    identifiers: [
      {
        type: 'email',
        id: testEmail,
        channels: {
          email: {
            status: 'subscribed',
            statusDate: new Date().toISOString(),
          },
        },
      },
    ],
    firstName: 'Test',
    lastName: 'Customer',
    tags: ['elite-sleep-plus', 'test'],
    customProperties: {
      membershipStatus: 'active',
      portalUrl: 'https://lamattressubscription.merktop.com/portal',
      monthlyCredit: 15,
      annualCredit: 180,
    },
  };
  
  const contactResult = await makeRequest('/contacts', 'POST', contactData);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Trigger Welcome Event
  console.log('\n📬 Test 2: Trigger Welcome Email Event');
  console.log('----------------------------------');
  
  const eventData = {
    email: testEmail,
    systemName: 'elite_sleep_welcome',  // Changed from eventName to systemName
    eventTime: new Date().toISOString(),
    properties: {
      customerName: 'Test Customer',
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
  };
  
  const eventResult = await makeRequest('/events', 'POST', eventData);
  
  // Summary
  console.log('\n===========================================');
  console.log('                SUMMARY');
  console.log('===========================================\n');
  
  if (contactResult && eventResult) {
    console.log('✅ All tests passed successfully!');
    console.log('\n📌 Next Steps:');
    console.log('1. Check your email inbox (including spam)');
    console.log('2. Log into Omnisend dashboard to see the contact');
    console.log('3. Create automation workflows for these events:');
    console.log('   - elite_sleep_welcome');
    console.log('   - subscription_renewed');
    console.log('   - payment_failed');
    console.log('   - subscription_cancelled');
    console.log('   - protector_claimed');
    console.log('   - credit_used');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
    console.log('\n📌 Troubleshooting:');
    console.log('1. Verify your API key is correct');
    console.log('2. Check if your Omnisend account is active');
    console.log('3. Ensure you have API access enabled');
    console.log('4. Check Omnisend dashboard for any restrictions');
  }
  
  console.log('\n🔗 Omnisend Dashboard: https://app.omnisend.com');
  console.log('\n===========================================\n');
}

// Run test
testOmnisend().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});