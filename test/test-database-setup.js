require('dotenv').config({ path: '.env.local' });
const { Sequelize } = require('sequelize');

async function testDatabaseSetup() {
  console.log('🔍 Testing Database Connection and Setup...\n');

  try {
    // Create connection
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });

    // Test connection
    console.log('📡 Testing connection...');
    await sequelize.authenticate();
    console.log('✅ Connection established successfully!\n');

    // Check existing tables
    console.log('📊 Checking existing tables...');
    const [results] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Existing tables:');
    results.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if our required tables exist
    const requiredTables = ['users', 'customers', 'coupons', 'coupon_uses'];
    const existingTables = results.map(r => r.table_name);

    console.log('\n📋 Required tables check:');
    requiredTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });

    // Check customers table data
    console.log('\n👥 Checking customers table...');
    const [customers] = await sequelize.query('SELECT COUNT(*) as count FROM customers');
    console.log(`Total customers: ${customers[0].count}`);

    // Check for specific customer
    console.log('\n🔍 Looking for cecilia.garciaprofessional@gmail.com...');
    const [cecilia] = await sequelize.query(
      'SELECT * FROM customers WHERE email = :email',
      {
        replacements: { email: 'cecilia.garciaprofessional@gmail.com' },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (cecilia && cecilia.length > 0) {
      console.log('✅ Customer found:');
      console.log(JSON.stringify(cecilia[0], null, 2));

      // Check coupons for this customer
      const [coupons] = await sequelize.query(
        'SELECT * FROM coupons WHERE customer_id = :customerId ORDER BY created_at DESC',
        {
          replacements: { customerId: cecilia[0].id },
          type: sequelize.QueryTypes.SELECT
        }
      );

      console.log(`\n🎟️ Coupons for this customer: ${coupons.length}`);
      if (coupons.length > 0) {
        console.log('Recent coupons:');
        coupons.slice(0, 3).forEach(coupon => {
          console.log(`  - ${coupon.code} (${coupon.status}) - ${coupon.discount_type}: ${coupon.discount_value}`);
        });
      }
    } else {
      console.log('❌ Customer not found in database');
    }

    // Check users table
    console.log('\n👤 Checking users table...');
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log(`Total users: ${users[0].count}`);

    // Check coupon statistics
    console.log('\n📈 Coupon Statistics:');
    const [stats] = await sequelize.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as used,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired
      FROM coupons
    `);
    console.log(`Total coupons: ${stats[0].total}`);
    console.log(`Active: ${stats[0].active}`);
    console.log(`Used: ${stats[0].used}`);
    console.log(`Expired: ${stats[0].expired}`);

    await sequelize.close();
    console.log('\n✅ Database setup test completed successfully!');

  } catch (error) {
    console.error('\n❌ Database setup test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testDatabaseSetup();