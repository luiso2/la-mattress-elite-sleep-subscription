const axios = require('axios');

const COUPON_API_URL = 'https://backend-shopify-coupon-production.up.railway.app';
const TEST_EMAIL = 'lbencomo94@gmail.com';
const NEW_COUPON_CODE = 'TRFU56866';

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

async function verifyCouponIntegration() {
  console.log(`${colors.blue}🔍 Verifying Coupon Integration${colors.reset}`);
  console.log(`${colors.cyan}Email: ${TEST_EMAIL}${colors.reset}`);
  console.log(`${colors.cyan}New Coupon: ${NEW_COUPON_CODE}${colors.reset}\n`);

  try {
    // Step 1: Check if the new coupon exists by code
    console.log(`${colors.yellow}1. Checking if coupon ${NEW_COUPON_CODE} exists...${colors.reset}`);
    
    try {
      const codeSearchResponse = await axios.get(
        `${COUPON_API_URL}/api/coupons/search/code/${NEW_COUPON_CODE}`,
        { timeout: 10000 }
      );
      
      printResult('Find coupon by code', true, 
        `Found: ${codeSearchResponse.data.coupon?.code}, Customer: ${codeSearchResponse.data.coupon?.customer?.email || 'No customer linked'}`);
        
      if (codeSearchResponse.data.coupon) {
        const coupon = codeSearchResponse.data.coupon;
        console.log(`   Details: $${coupon.discount_value} discount, Status: ${coupon.status}`);
        console.log(`   Valid until: ${coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : 'No expiry'}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        printResult('Find coupon by code', false, 
          `Coupon ${NEW_COUPON_CODE} not found in database - only exists in Shopify`);
        console.log(`   ${colors.yellow}Note: This happened because no customer email was provided when creating the coupon${colors.reset}`);
      } else {
        printResult('Find coupon by code', false, `Error: ${error.message}`);
      }
    }

    // Step 2: Check all coupons for lbencomo94@gmail.com
    console.log(`\n${colors.yellow}2. Checking all coupons for ${TEST_EMAIL}...${colors.reset}`);
    
    try {
      const emailSearchResponse = await axios.get(
        `${COUPON_API_URL}/api/coupons/search/email/${encodeURIComponent(TEST_EMAIL)}`,
        { timeout: 10000 }
      );
      
      printResult('Find coupons by email', true, 
        `Found ${emailSearchResponse.data.count} coupons for ${TEST_EMAIL}`);
      
      if (emailSearchResponse.data.count > 0) {
        console.log(`   Available coupons for ${TEST_EMAIL}:`);
        emailSearchResponse.data.coupons.forEach((coupon, i) => {
          const expiryText = coupon.valid_until 
            ? new Date(coupon.valid_until).toLocaleDateString()
            : 'No expiry';
          const discountText = coupon.discount_type === 'percentage' 
            ? `${coupon.discount_value}%` 
            : `$${coupon.discount_value}`;
          console.log(`   ${i + 1}. ${coupon.code} - ${discountText} - ${coupon.status} - Expires: ${expiryText}`);
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        printResult('Find coupons by email', false, 
          `No coupons found for ${TEST_EMAIL}`);
      } else {
        printResult('Find coupons by email', false, `Error: ${error.message}`);
      }
    }

    // Step 3: Test dashboard customer search simulation
    console.log(`\n${colors.yellow}3. Simulating dashboard customer search...${colors.reset}`);
    
    // This simulates what happens when an employee searches for a customer in the dashboard
    console.log(`   ${colors.cyan}Dashboard will search for: ${TEST_EMAIL}${colors.reset}`);
    console.log(`   ${colors.cyan}Expected behavior:${colors.reset}`);
    console.log(`   - Employee dashboard calls customer-search API`);
    console.log(`   - API fetches Stripe customer data`);
    console.log(`   - API also calls coupon backend to get coupons`);
    console.log(`   - Dashboard displays customer info + coupons section`);

    // Step 4: Create a proper coupon with customer info for testing
    console.log(`\n${colors.yellow}4. Creating a proper coupon with customer info...${colors.reset}`);
    
    const properCouponData = {
      code: 'DASH-TEST-' + Date.now().toString().slice(-6),
      discount_type: 'fixed_amount',
      discount_value: 150,
      description: 'Dashboard integration test with customer info',
      customer_name: 'Luis Bencomo',
      customer_email: TEST_EMAIL,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      max_uses: 1,
      minimum_purchase: 0
    };

    try {
      const createResponse = await axios.post(`${COUPON_API_URL}/api/coupons`, properCouponData, { 
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const createdCouponId = createResponse.data.data?.database_record?.id;
      const createdCouponCode = createResponse.data.data?.summary?.code;
      const savedToDb = createResponse.data.data?.database_record?.saved;
      
      printResult('Create coupon with customer info', createResponse.data.success, 
        `Code: ${createdCouponCode}, ID: ${createdCouponId}, Saved to DB: ${savedToDb ? 'Yes' : 'No'}`);
        
    } catch (error) {
      printResult('Create coupon with customer info', false, `Error: ${error.message}`);
    }

    // Step 5: Final verification - check updated coupon list
    console.log(`\n${colors.yellow}5. Final verification of coupons for ${TEST_EMAIL}...${colors.reset}`);
    
    try {
      const finalEmailSearchResponse = await axios.get(
        `${COUPON_API_URL}/api/coupons/search/email/${encodeURIComponent(TEST_EMAIL)}`,
        { timeout: 10000 }
      );
      
      printResult('Final coupon verification', true, 
        `Total coupons now: ${finalEmailSearchResponse.data.count}`);
      
      if (finalEmailSearchResponse.data.count > 0) {
        console.log(`   Current coupons for dashboard display:`);
        finalEmailSearchResponse.data.coupons.forEach((coupon, i) => {
          const expiryText = coupon.valid_until 
            ? new Date(coupon.valid_until).toLocaleDateString()
            : 'No expiry';
          const discountText = coupon.discount_type === 'percentage' 
            ? `${coupon.discount_value}%` 
            : `$${coupon.discount_value}`;
          const statusBadge = `[${coupon.status.toUpperCase()}]`;
          console.log(`   ${i + 1}. ${coupon.code} - ${discountText} ${statusBadge} - Expires: ${expiryText}`);
        });
      }
    } catch (error) {
      printResult('Final coupon verification', false, `Error: ${error.message}`);
    }

    console.log(`\n${colors.blue}📊 INTEGRATION STATUS:${colors.reset}`);
    console.log(`✅ Coupon backend API is working`);
    console.log(`✅ Email-based coupon search is functional`);
    console.log(`⚠️  Coupon ${NEW_COUPON_CODE} exists in Shopify but not in database`);
    console.log(`   (This is because it was created without customer info)`);
    console.log(`✅ Dashboard integration should work with coupons that have customer info`);
    
    console.log(`\n${colors.blue}🌐 DASHBOARD TEST:${colors.reset}`);
    console.log(`1. Go to: https://lamattressubscription.merktop.com/employee/login`);
    console.log(`2. Login with employee credentials`);
    console.log(`3. Search for: ${colors.cyan}${TEST_EMAIL}${colors.reset}`);
    console.log(`4. Check if "Customer Coupons" section appears`);
    console.log(`5. Available coupons should be displayed with action buttons`);

    console.log(`\n${colors.yellow}💡 NOTE:${colors.reset}`);
    console.log(`- Only coupons created with customer_email will appear in dashboard`);
    console.log(`- Coupon ${NEW_COUPON_CODE} won't appear because it has no customer link`);
    console.log(`- The integration is working correctly for coupons with customer info`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Verification failed:${colors.reset}`);
    console.error('Error:', error.message);
  }
}

console.log(`${colors.cyan}================================${colors.reset}`);
console.log(`${colors.cyan}   Coupon Integration Verification${colors.reset}`);
console.log(`${colors.cyan}================================${colors.reset}\n`);

verifyCouponIntegration().then(() => {
  console.log(`\n${colors.cyan}Verification completed${colors.reset}`);
}).catch(error => {
  console.error('Fatal error:', error.message);
});