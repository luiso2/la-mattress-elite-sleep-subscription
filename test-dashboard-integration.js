const axios = require('axios');

// Test configuration
const COUPON_API_URL = 'https://backend-shopify-coupon-production.up.railway.app';
const TEST_EMAIL = 'dashboard-test@example.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function printResult(test, success, details) {
  const status = success ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  console.log(`${status} - ${test}`);
  if (details) {
    console.log(`   ${colors.cyan}${details}${colors.reset}`);
  }
}

async function testDashboardIntegration() {
  console.log(`${colors.blue}🧪 Testing Dashboard-Coupon Integration${colors.reset}\n`);

  try {
    // Step 1: Create test coupons for dashboard testing
    console.log(`${colors.yellow}1. Creating test coupons for dashboard integration...${colors.reset}`);
    
    const testCoupons = [
      {
        code: 'DASH-ACTIVE-' + Date.now().toString().slice(-4),
        discount_type: 'percentage',
        discount_value: 15,
        description: 'Active dashboard test coupon',
        customer_name: 'Dashboard Test User',
        customer_email: TEST_EMAIL,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        code: 'DASH-EXPIRED-' + Date.now().toString().slice(-4),
        discount_type: 'fixed_amount',
        discount_value: 25,
        description: 'Expired dashboard test coupon',
        customer_name: 'Dashboard Test User',
        customer_email: TEST_EMAIL,
        valid_until: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Yesterday
      }
    ];

    const createdCoupons = [];
    for (const couponData of testCoupons) {
      try {
        const response = await axios.post(`${COUPON_API_URL}/api/coupons`, couponData, { timeout: 15000 });
        createdCoupons.push({
          id: response.data.data?.database_record?.id,
          code: response.data.data?.summary?.code,
          status: response.data.success ? 'created' : 'failed'
        });
        printResult(`Create coupon ${couponData.code}`, response.data.success, 
          `ID: ${response.data.data?.database_record?.id}`);
      } catch (error) {
        printResult(`Create coupon ${couponData.code}`, false, `Error: ${error.message}`);
      }
    }

    // Step 2: Test coupon search by email
    console.log(`\n${colors.yellow}2. Testing coupon search by email...${colors.reset}`);
    
    try {
      const searchResponse = await axios.get(`${COUPON_API_URL}/api/coupons/search/email/${TEST_EMAIL}`, { timeout: 10000 });
      const foundCoupons = searchResponse.data.count >= 1;
      printResult('Search coupons by email', foundCoupons, 
        `Found ${searchResponse.data.count} coupons`);
      
      if (foundCoupons) {
        console.log('   Available coupons for dashboard display:');
        searchResponse.data.coupons.slice(0, 3).forEach((coupon, i) => {
          console.log(`   ${i + 1}. ${coupon.code} - ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : '$'} (${coupon.status})`);
        });
      }
    } catch (error) {
      printResult('Search coupons by email', false, `Error: ${error.message}`);
    }

    // Step 3: Test coupon status update (mark as used)
    console.log(`\n${colors.yellow}3. Testing coupon status update...${colors.reset}`);
    
    if (createdCoupons.length > 0 && createdCoupons[0].id) {
      try {
        const statusResponse = await axios.patch(
          `${COUPON_API_URL}/api/coupons/db/${createdCoupons[0].id}/status`,
          { status: 'used' },
          { timeout: 10000 }
        );
        
        printResult('Update coupon status to used', statusResponse.data.success, 
          `${statusResponse.data.coupon?.code}: ${statusResponse.data.coupon?.old_status} → ${statusResponse.data.coupon?.new_status}`);
      } catch (error) {
        printResult('Update coupon status to used', false, `Error: ${error.message}`);
      }
    }

    // Step 4: Test coupon deletion
    console.log(`\n${colors.yellow}4. Testing coupon deletion...${colors.reset}`);
    
    if (createdCoupons.length > 1 && createdCoupons[1].id) {
      try {
        const deleteResponse = await axios.delete(
          `${COUPON_API_URL}/api/coupons/db/${createdCoupons[1].id}`,
          { timeout: 10000 }
        );
        
        printResult('Delete coupon', deleteResponse.data.success, 
          `Deleted: ${deleteResponse.data.deleted?.code}`);
      } catch (error) {
        printResult('Delete coupon', false, `Error: ${error.message}`);
      }
    }

    // Step 5: Final verification
    console.log(`\n${colors.yellow}5. Final verification of remaining coupons...${colors.reset}`);
    
    try {
      const finalSearchResponse = await axios.get(`${COUPON_API_URL}/api/coupons/search/email/${TEST_EMAIL}`, { timeout: 10000 });
      printResult('Final coupon count verification', true, 
        `Remaining coupons: ${finalSearchResponse.data.count}`);
      
      if (finalSearchResponse.data.coupons.length > 0) {
        console.log('   Final coupon statuses:');
        finalSearchResponse.data.coupons.forEach((coupon, i) => {
          console.log(`   ${i + 1}. ${coupon.code} - Status: ${coupon.status} - ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : '$'}`);
        });
      }
    } catch (error) {
      printResult('Final verification', false, `Error: ${error.message}`);
    }

    // Instructions for manual dashboard testing
    console.log(`\n${colors.blue}📋 DASHBOARD TESTING INSTRUCTIONS:${colors.reset}`);
    console.log('To test the complete integration in the employee dashboard:');
    console.log('');
    console.log('1. 🌐 Open the employee dashboard in your browser');
    console.log('2. 🔐 Login with your employee credentials');
    console.log(`3. 🔍 Search for customer email: ${colors.cyan}${TEST_EMAIL}${colors.reset}`);
    console.log('4. 📊 Verify that the "Customer Coupons" section appears');
    console.log('5. 👁️  Check that coupons show correct status badges');
    console.log('6. 🔘 Test "Mark as Used" button on active coupons');
    console.log('7. ❌ Test "Delete" button on any coupon');
    console.log('8. 🔄 Verify that actions refresh the data automatically');
    console.log('');
    console.log(`${colors.yellow}Expected behavior:${colors.reset}`);
    console.log('- Customer coupons section should be visible after search');
    console.log('- Active coupons should have "Mark as Used" button');
    console.log('- All coupons should have "Delete" button');
    console.log('- Status colors should match coupon states');
    console.log('- Actions should show confirmation dialogs');
    console.log('- Page should refresh coupon data after actions');

    console.log(`\n${colors.green}🎉 Dashboard integration test setup completed!${colors.reset}`);
    
    // Cleanup option
    console.log(`\n${colors.yellow}🧹 CLEANUP:${colors.reset}`);
    console.log(`To clean up test coupons, run:`);
    console.log(`DELETE ${COUPON_API_URL}/api/coupons/db/email/${TEST_EMAIL}?deleteAll=true`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Integration test failed:${colors.reset}`);
    console.error('Error:', error.message);
  }
}

console.log(`${colors.cyan}================================${colors.reset}`);
console.log(`${colors.cyan}   Dashboard Integration Test${colors.reset}`);
console.log(`${colors.cyan}================================${colors.reset}\n`);

testDashboardIntegration().then(() => {
  console.log(`\n${colors.cyan}Integration test completed${colors.reset}`);
}).catch(error => {
  console.error('Fatal error:', error.message);
});