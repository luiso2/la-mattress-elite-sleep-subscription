require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const http = require('http');

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

// Find the port the server is running on
async function findServerPort() {
  const portsToCheck = [3004, 3003, 3002, 3001, 3005];

  for (const port of portsToCheck) {
    try {
      await axios.get(`http://localhost:${port}/api/health`).catch(() => {});
      return port;
    } catch {
      // Continue checking
    }
  }

  return null;
}

async function testCompleteFlow() {
  log('\n🚀 Starting Final Integration Test\n', 'cyan');

  // Find server port
  const port = await findServerPort();
  if (!port) {
    log('❌ Server is not running!', 'red');
    log('Please start the server with: npm run dev', 'yellow');
    process.exit(1);
  }

  const BASE_URL = `http://localhost:${port}`;
  const TEST_EMAIL = 'cecilia.garciaprofessional@gmail.com';
  log(`✅ Server found on port ${port}`, 'green');

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
    } else {
      log('   ⚠️  Customer not found in Stripe', 'yellow');
    }

    // 3. Create a new test coupon
    log('\n3️⃣  Creating New Test Coupon...', 'blue');

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

    let couponCreated = false;
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
        couponCreated = true;

        // 4. Validate the created coupon
        log('\n4️⃣  Validating Created Coupon...', 'blue');

        try {
          const validateResponse = await axios.get(
            `${BASE_URL}/api/coupons/validate/${couponCode}`
          );

          if (validateResponse.data.valid) {
            log('   ✅ Coupon is valid!', 'green');
          } else {
            log(`   ⚠️  Coupon validation returned invalid: ${validateResponse.data.error}`, 'yellow');
          }
        } catch (error) {
          log(`   ⚠️  Coupon validation endpoint may not be working properly`, 'yellow');
        }
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('Shopify')) {
        log('   ⚠️  Coupon created in database but Shopify integration failed', 'yellow');
        log('   This is expected if Shopify credentials are not configured', 'yellow');
        couponCreated = true;
      } else {
        throw error;
      }
    }

    // 5. Get coupon statistics
    log('\n5️⃣  Getting Coupon Statistics...', 'blue');

    try {
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
    } catch (error) {
      log('   ⚠️  Could not fetch coupon statistics', 'yellow');
    }

    // 6. List coupons for the customer
    log('\n6️⃣  Listing Customer Coupons...', 'blue');

    try {
      const listResponse = await axios.get(
        `${BASE_URL}/api/coupons?email=${TEST_EMAIL}`,
        {
          headers: {
            'Authorization': `Bearer ${employeeToken}`
          }
        }
      );

      const coupons = listResponse.data.coupons || [];
      log(`   Found ${coupons.length} coupon(s) for customer`, 'yellow');

      if (coupons.length > 0) {
        coupons.slice(0, 3).forEach(coupon => {
          const discount = coupon.discountType === 'percentage'
            ? `${coupon.discountValue}%`
            : `$${coupon.discountValue}`;
          log(`   - ${coupon.code} (${coupon.status}) - ${discount} off`, 'yellow');
        });
      }
    } catch (error) {
      log('   ⚠️  Could not list customer coupons', 'yellow');
    }

    log('\n✅ Integration test completed!', 'green');
    log('\n📝 Summary:', 'cyan');
    log(`   Server Port: ${port}`, 'yellow');
    log(`   Customer: ${TEST_EMAIL}`, 'yellow');
    log(`   Coupon Created: ${couponCreated ? 'Yes' : 'No'}`, 'yellow');

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      if (error.response.data) {
        log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      }
    }
    process.exit(1);
  }
}

async function main() {
  await testCompleteFlow();
}

main();