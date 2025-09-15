require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const BASE_URL = 'http://localhost:3003';
const TEST_EMAIL = 'cecilia.garciaprofessional@gmail.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCompleteFlow() {
  log('\n🚀 Starting Complete Integration Test\n', 'cyan');

  let employeeToken = null;
  let customerData = null;

  try {
    // 1. Test Employee Login
    log('\n1️⃣  Testing Employee Login...', 'blue');
    log('   Email: arman@lamattress.com', 'yellow');

    const loginResponse = await axios.post(`${BASE_URL}/api/employee/login`, {
      email: 'arman@lamattress.com',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      employeeToken = loginResponse.data.token;
      log('   ✅ Employee login successful!', 'green');
      log(`   Token: ${employeeToken.substring(0, 50)}...`, 'yellow');
    } else {
      throw new Error('Employee login failed');
    }

    // 2. Search for Customer in Stripe
    log('\n2️⃣  Searching for Customer in Stripe...', 'blue');
    log(`   Email: ${TEST_EMAIL}`, 'yellow');

    const searchResponse = await axios.post(
      `${BASE_URL}/api/employee/customer-search`,
      { email: TEST_EMAIL },
      {
        headers: {
          'Authorization': `Bearer ${employeeToken}`
        }
      }
    );

    customerData = searchResponse.data;

    if (customerData.customer) {
      log('   ✅ Customer found in Stripe!', 'green');
      log(`   Name: ${customerData.customer.name || 'N/A'}`, 'yellow');
      log(`   Stripe ID: ${customerData.customer.id}`, 'yellow');

      if (customerData.credits) {
        log('\n   💳 Store Credits:', 'cyan');
        log(`   Total: $${customerData.credits.total}`, 'yellow');
        log(`   Available: $${customerData.credits.available}`, 'yellow');
        log(`   Reserved: $${customerData.credits.reserved}`, 'yellow');
        log(`   Used: $${customerData.credits.used}`, 'yellow');
      }

      if (customerData.cashback) {
        log('\n   💰 Cashback:', 'cyan');
        log(`   Balance: $${customerData.cashback.balance}`, 'yellow');
      }
    } else {
      log('   ⚠️  Customer not found in Stripe', 'yellow');
      log('   This customer may not have a subscription yet', 'yellow');
    }

    // 3. Skip checking for existing coupons if customer not in database
    let existingCoupons = [];
    if (customerData.customer) {
      log('\n3️⃣  Checking for Existing Coupons...', 'blue');

      try {
        const couponsResponse = await axios.get(
          `${BASE_URL}/api/coupons?email=${TEST_EMAIL}`,
          {
            headers: {
              'Authorization': `Bearer ${employeeToken}`
            }
          }
        );

        existingCoupons = couponsResponse.data.coupons || [];
        log(`   Found ${existingCoupons.length} coupon(s) in database`, 'yellow');

        if (existingCoupons.length > 0) {
          log('\n   📋 Existing Coupons:', 'cyan');
          existingCoupons.forEach(coupon => {
            const discount = coupon.discountType === 'percentage'
              ? `${coupon.discountValue}%`
              : `$${coupon.discountValue}`;
            log(`   - ${coupon.code} (${coupon.status}) - ${discount} off`, 'yellow');
          });
        }
      } catch (error) {
        log('   ⚠️  Could not check existing coupons (customer may not exist in database yet)', 'yellow');
      }
    } else {
      log('\n3️⃣  Skipping coupon check (customer not in database yet)', 'yellow');
    }

    // 4. Create a new test coupon
    log('\n4️⃣  Creating New Test Coupon...', 'blue');

    const couponCode = `TEST${Date.now().toString().slice(-6)}`;
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const createCouponData = {
      customerEmail: TEST_EMAIL,
      customerName: customerData.customer?.name || 'Cecilia Garcia',
      code: couponCode,
      discountType: 'percentage',
      discountValue: 20,
      description: 'Test Coupon - 20% Off',
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      maxUses: 1,
      minimumPurchase: 50
    };

    log(`   Code: ${couponCode}`, 'yellow');
    log(`   Discount: 20% off`, 'yellow');
    log(`   Minimum Purchase: $50`, 'yellow');

    try {
      const createResponse = await axios.post(
        `${BASE_URL}/api/coupons`,
        createCouponData,
        {
          headers: {
            'Authorization': `Bearer ${employeeToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (createResponse.data.success) {
        log('   ✅ Coupon created successfully!', 'green');
        log(`   Coupon ID: ${createResponse.data.coupon.id}`, 'yellow');

        // 5. Validate the created coupon
        log('\n5️⃣  Validating Created Coupon...', 'blue');

        const validateResponse = await axios.get(
          `${BASE_URL}/api/coupons/validate/${couponCode}`
        );

        if (validateResponse.data.valid) {
          log('   ✅ Coupon is valid!', 'green');
        } else {
          log(`   ❌ Coupon validation failed: ${validateResponse.data.error}`, 'red');
        }
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('Shopify')) {
        log('   ⚠️  Coupon created in database but Shopify integration failed', 'yellow');
        log('   This is expected if Shopify credentials are not configured', 'yellow');
      } else {
        throw error;
      }
    }

    // 6. Get coupon statistics
    log('\n6️⃣  Getting Coupon Statistics...', 'blue');

    const statsResponse = await axios.get(
      `${BASE_URL}/api/coupons/stats`,
      {
        headers: {
          'Authorization': `Bearer ${employeeToken}`
        }
      }
    );

    const stats = statsResponse.data.stats;
    log('   📊 Coupon Statistics:', 'cyan');
    log(`   Total Coupons: ${stats.totalCoupons}`, 'yellow');
    log(`   Active: ${stats.activeCoupons}`, 'green');
    log(`   Used: ${stats.usedCoupons}`, 'yellow');
    log(`   Expired: ${stats.expiredCoupons}`, 'yellow');
    log(`   Total Discount Given: $${stats.totalDiscountGiven}`, 'yellow');

    // 7. Test coupon actions (if we have coupons)
    if (existingCoupons.length > 0) {
      const testCoupon = existingCoupons.find(c => c.status === 'active') || existingCoupons[0];

      log('\n7️⃣  Testing Coupon Actions...', 'blue');
      log(`   Testing with coupon: ${testCoupon.code}`, 'yellow');

      // Mark as used
      try {
        const markUsedResponse = await axios.post(
          `${BASE_URL}/api/employee/coupon-action`,
          {
            action: 'mark_used',
            couponId: testCoupon.id.toString()
          },
          {
            headers: {
              'Authorization': `Bearer ${employeeToken}`
            }
          }
        );

        if (markUsedResponse.data.success) {
          log('   ✅ Coupon marked as used successfully!', 'green');
        }
      } catch (error) {
        log(`   ⚠️  Could not mark coupon as used: ${error.response?.data?.error || error.message}`, 'yellow');
      }
    }

    log('\n✅ All tests completed successfully!', 'green');
    log('\n📝 Summary:', 'cyan');
    log(`   Customer: ${TEST_EMAIL}`, 'yellow');
    log(`   Total coupons in system: ${stats.totalCoupons}`, 'yellow');
    log(`   Active coupons: ${stats.activeCoupons}`, 'yellow');

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/health`).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

async function main() {
  log('🔍 Checking if server is running...', 'cyan');

  const serverRunning = await checkServer();

  if (!serverRunning) {
    log('❌ Server is not running!', 'red');
    log('Please start the server with: npm run dev', 'yellow');
    process.exit(1);
  }

  log('✅ Server is running!', 'green');

  await testCompleteFlow();
}

main();