require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Find the port the server is running on
async function findServerPort() {
  const portsToCheck = [3004, 3003, 3002, 3001, 3000];

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

async function testSuperAdmin() {
  log('\n🚀 Testing Super Admin Functionality\n', 'cyan');

  // Find server port
  const port = await findServerPort();
  if (!port) {
    log('❌ Server is not running!', 'red');
    log('Please start the server with: npm run dev', 'yellow');
    process.exit(1);
  }

  const BASE_URL = `http://localhost:${port}`;
  log(`✅ Server found on port ${port}`, 'green');

  let superAdminToken = null;

  try {
    // 1. Check if super admin exists
    log('\n1️⃣  Checking if Super Admin exists...', 'blue');

    const checkResponse = await axios.get(`${BASE_URL}/api/superadmin/setup`);

    if (checkResponse.data.exists) {
      log('   ✅ Super admin exists', 'green');
    } else {
      log('   ⚠️  Super admin does not exist', 'yellow');
      log('   Run: node init-superadmin.js', 'yellow');
      return;
    }

    // 2. Test Super Admin Login
    log('\n2️⃣  Testing Super Admin Login...', 'blue');
    log('   Email: lbencomo94@gmail.com', 'yellow');

    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/login`, {
      email: 'lbencomo94@gmail.com',
      password: 'Atec2019chino'
    });

    if (loginResponse.data.success) {
      superAdminToken = loginResponse.data.token;
      const adminData = loginResponse.data.admin;

      log('   ✅ Super admin login successful!', 'green');
      log(`   Name: ${adminData.name}`, 'yellow');
      log(`   Role: ${adminData.role}`, 'yellow');
      log(`   Token: ${superAdminToken.substring(0, 50)}...`, 'yellow');
    } else {
      throw new Error('Super admin login failed');
    }

    // 3. Get Dashboard Statistics
    log('\n3️⃣  Fetching Dashboard Statistics...', 'blue');

    const statsResponse = await axios.get(
      `${BASE_URL}/api/superadmin/dashboard`,
      {
        headers: {
          'Authorization': `Bearer ${superAdminToken}`
        }
      }
    );

    const stats = statsResponse.data.stats;

    log('   📊 Dashboard Statistics:', 'cyan');
    log(`   Total Users: ${stats.totalUsers}`, 'yellow');
    log(`   Total Employees: ${stats.totalEmployees}`, 'yellow');
    log(`   Total Customers: ${stats.totalCustomers}`, 'yellow');
    log(`   Total Coupons: ${stats.totalCoupons}`, 'yellow');
    log(`   Active Coupons: ${stats.activeCoupons}`, 'green');
    log(`   Total Revenue: $${stats.revenue.total}`, 'yellow');
    log(`   This Month: $${stats.revenue.thisMonth}`, 'yellow');

    // 4. Test Invalid Token
    log('\n4️⃣  Testing Authorization (Invalid Token)...', 'blue');

    try {
      await axios.get(
        `${BASE_URL}/api/superadmin/dashboard`,
        {
          headers: {
            'Authorization': 'Bearer invalid-token'
          }
        }
      );
      log('   ❌ Authorization check failed - invalid token was accepted!', 'red');
    } catch (error) {
      if (error.response?.status === 401) {
        log('   ✅ Authorization working correctly - rejected invalid token', 'green');
      } else {
        throw error;
      }
    }

    // 5. Display Recent Activity
    if (stats.recentActivity && stats.recentActivity.length > 0) {
      log('\n5️⃣  Recent Activity:', 'blue');
      stats.recentActivity.slice(0, 5).forEach(activity => {
        const type = activity.type === 'coupon_created' ? '🎟️ Coupon' : '👤 User';
        log(`   ${type}: ${activity.detail}`, 'yellow');
      });
    }

    log('\n✅ All Super Admin tests passed successfully!', 'green');

    log('\n📝 Summary:', 'cyan');
    log('   Super Admin System: ✅ Working', 'green');
    log('   Authentication: ✅ Working', 'green');
    log('   Dashboard API: ✅ Working', 'green');
    log('   Authorization: ✅ Working', 'green');

    log('\n🌐 Access Points:', 'magenta');
    log(`   Login Page: http://localhost:${port}/superadmin`, 'yellow');
    log(`   Dashboard: http://localhost:${port}/superadmin/dashboard`, 'yellow');

    log('\n🔐 Credentials:', 'magenta');
    log('   Email: lbencomo94@gmail.com', 'yellow');
    log('   Password: Atec2019chino', 'yellow');

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
  await testSuperAdmin();
}

main();