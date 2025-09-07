#!/usr/bin/env node

/**
 * Omnisend Email Service Test Script
 * Tests the Omnisend API integration for LA MATTRESS Elite Sleep+
 */

require('dotenv').config({ path: '.env.local' });

// Set the API key
process.env.OMNISEND_API_KEY = process.argv[3] || process.env.OMNISEND_API_KEY;

if (!process.env.OMNISEND_API_KEY) {
  console.error('❌ Please provide Omnisend API key:');
  console.error('   node test-omnisend.js <email> <api_key>');
  console.error('   OR set OMNISEND_API_KEY in .env.local');
  process.exit(1);
}

const testEmail = process.argv[2] || 'lbencomo94@gmail.com';

console.log('\n===========================================');
console.log('     OMNISEND EMAIL SERVICE TEST');
console.log('===========================================\n');

console.log('📧 Test recipient:', testEmail);
console.log('🔑 API Key:', process.env.OMNISEND_API_KEY.slice(0, 10) + '...');
console.log('\n------------------------------------------\n');

// Import the Omnisend service
const OmnisendService = require('../lib/services/omnisend.service.ts').default;

async function testOmnisendEmails() {
  const results = [];
  
  console.log('🚀 Starting Omnisend email tests...\n');
  
  // Test 1: Welcome Email
  console.log('📬 Test 1: Sending Welcome Email');
  console.log('----------------------------------');
  try {
    const result = await OmnisendService.sendWelcomeEmail(
      testEmail,
      'Test Customer',
      'cus_test_123'
    );
    if (result) {
      console.log('   ✅ Welcome email sent successfully!');
      results.push({ test: 'Welcome Email', status: 'Success' });
    } else {
      console.log('   ⚠️  Welcome email sent but no response received');
      results.push({ test: 'Welcome Email', status: 'Warning' });
    }
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.push({ test: 'Welcome Email', status: 'Failed', error: error.message });
  }
  
  // Wait a bit between emails
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Renewal Confirmation
  console.log('\n📬 Test 2: Sending Renewal Confirmation');
  console.log('----------------------------------');
  try {
    const result = await OmnisendService.sendRenewalConfirmation(
      testEmail,
      'Test Customer'
    );
    if (result) {
      console.log('   ✅ Renewal confirmation sent successfully!');
      results.push({ test: 'Renewal Confirmation', status: 'Success' });
    } else {
      console.log('   ⚠️  Renewal email sent but no response received');
      results.push({ test: 'Renewal Confirmation', status: 'Warning' });
    }
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.push({ test: 'Renewal Confirmation', status: 'Failed', error: error.message });
  }
  
  // Wait a bit between emails
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Payment Failed Email
  console.log('\n📬 Test 3: Sending Payment Failed Email');
  console.log('----------------------------------');
  try {
    const result = await OmnisendService.sendPaymentFailedEmail(
      testEmail,
      'Test Customer'
    );
    if (result) {
      console.log('   ✅ Payment failed email sent successfully!');
      results.push({ test: 'Payment Failed', status: 'Success' });
    } else {
      console.log('   ⚠️  Payment failed email sent but no response received');
      results.push({ test: 'Payment Failed', status: 'Warning' });
    }
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.push({ test: 'Payment Failed', status: 'Failed', error: error.message });
  }
  
  // Wait a bit between emails
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Cancellation Email
  console.log('\n📬 Test 4: Sending Cancellation Email');
  console.log('----------------------------------');
  try {
    const result = await OmnisendService.sendCancellationEmail(
      testEmail,
      'Test Customer',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    );
    if (result) {
      console.log('   ✅ Cancellation email sent successfully!');
      results.push({ test: 'Cancellation', status: 'Success' });
    } else {
      console.log('   ⚠️  Cancellation email sent but no response received');
      results.push({ test: 'Cancellation', status: 'Warning' });
    }
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.push({ test: 'Cancellation', status: 'Failed', error: error.message });
  }
  
  // Wait a bit between emails
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 5: Protector Claimed Email
  console.log('\n📬 Test 5: Sending Protector Claimed Email');
  console.log('----------------------------------');
  try {
    const result = await OmnisendService.sendProtectorClaimedEmail(
      testEmail,
      1,
      'Test Customer'
    );
    if (result) {
      console.log('   ✅ Protector claimed email sent successfully!');
      results.push({ test: 'Protector Claimed', status: 'Success' });
    } else {
      console.log('   ⚠️  Protector email sent but no response received');
      results.push({ test: 'Protector Claimed', status: 'Warning' });
    }
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.push({ test: 'Protector Claimed', status: 'Failed', error: error.message });
  }
  
  // Wait a bit between emails
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 6: Credit Used Email
  console.log('\n📬 Test 6: Sending Credit Used Email');
  console.log('----------------------------------');
  try {
    const result = await OmnisendService.sendCreditUsedEmail(
      testEmail,
      15,
      165,
      'Test Customer'
    );
    if (result) {
      console.log('   ✅ Credit used email sent successfully!');
      results.push({ test: 'Credit Used', status: 'Success' });
    } else {
      console.log('   ⚠️  Credit email sent but no response received');
      results.push({ test: 'Credit Used', status: 'Warning' });
    }
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.push({ test: 'Credit Used', status: 'Failed', error: error.message });
  }
  
  // Summary
  console.log('\n===========================================');
  console.log('                SUMMARY');
  console.log('===========================================\n');
  
  const successCount = results.filter(r => r.status === 'Success').length;
  const warningCount = results.filter(r => r.status === 'Warning').length;
  const failedCount = results.filter(r => r.status === 'Failed').length;
  
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📊 Total Tests: ${results.length}\n`);
  
  // Detailed results
  console.log('Detailed Results:');
  console.log('-----------------');
  results.forEach((result, index) => {
    const icon = result.status === 'Success' ? '✅' : 
                 result.status === 'Warning' ? '⚠️' : '❌';
    console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n📌 Next Steps:');
  console.log('---------------');
  console.log('1. Check your email inbox (including spam folder)');
  console.log('2. Verify email content and formatting');
  console.log('3. Check Omnisend dashboard for delivery status');
  console.log('4. Ensure event names match your Omnisend automation setup');
  console.log('\n🔗 Omnisend Dashboard: https://app.omnisend.com');
  console.log('\n===========================================\n');
}

// Test API connection first
async function testApiConnection() {
  console.log('🔌 Testing Omnisend API Connection...');
  console.log('--------------------------------------');
  
  try {
    const response = await fetch('https://api.omnisend.com/v3/contacts', {
      method: 'GET',
      headers: {
        'X-API-KEY': process.env.OMNISEND_API_KEY,
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('   ✅ API connection successful!');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return true;
    } else {
      const error = await response.text();
      console.log('   ❌ API connection failed!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Connection error:', error.message);
    return false;
  }
}

// Run tests
async function main() {
  // Test API connection first
  const connected = await testApiConnection();
  
  if (!connected) {
    console.log('\n❌ Cannot proceed without valid API connection.');
    console.log('Please check your API key and try again.\n');
    process.exit(1);
  }
  
  console.log('\n✅ API connection verified. Proceeding with email tests...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run email tests
  await testOmnisendEmails();
}

main().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});