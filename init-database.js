require('dotenv').config({ path: '.env.local' });
const { Sequelize, DataTypes } = require('sequelize');

async function initDatabase() {
  console.log('🚀 Initializing Database...\n');

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
    console.log('✅ Connection established!\n');

    // Create Users table
    console.log('📦 Creating users table if not exists...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        stripe_customer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready\n');

    // Check if Cecilia exists in customers
    console.log('🔍 Checking for cecilia.garciaprofessional@gmail.com...');
    const [existingCustomer] = await sequelize.query(
      'SELECT * FROM customers WHERE email = :email',
      {
        replacements: { email: 'cecilia.garciaprofessional@gmail.com' },
        type: sequelize.QueryTypes.SELECT
      }
    );

    let customerId;
    if (!existingCustomer || existingCustomer.length === 0) {
      console.log('Creating customer cecilia.garciaprofessional@gmail.com...');
      const [result] = await sequelize.query(
        `INSERT INTO customers (name, email, phone, created_at, updated_at)
         VALUES (:name, :email, :phone, NOW(), NOW())
         RETURNING id`,
        {
          replacements: {
            name: 'Cecilia Garcia',
            email: 'cecilia.garciaprofessional@gmail.com',
            phone: ''
          },
          type: sequelize.QueryTypes.INSERT
        }
      );
      customerId = result[0].id;
      console.log(`✅ Customer created with ID: ${customerId}`);
    } else {
      customerId = existingCustomer[0].id;
      console.log(`✅ Customer already exists with ID: ${customerId}`);
    }

    // Check coupons for Cecilia
    console.log('\n📊 Checking coupons for Cecilia...');
    const [coupons] = await sequelize.query(
      'SELECT * FROM coupons WHERE customer_id = :customerId',
      {
        replacements: { customerId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const couponCount = coupons ? coupons.length : 0;
    console.log(`Found ${couponCount} coupons`);
    if (couponCount > 0) {
      console.log('Recent coupons:');
      coupons.slice(0, 5).forEach(coupon => {
        console.log(`  - ${coupon.code} (${coupon.status}) - ${coupon.discount_type}: $${coupon.discount_value}`);
      });
    }

    // Create sample coupon for testing if none exist
    if (couponCount === 0) {
      console.log('\n🎟️ Creating sample coupon for testing...');
      const couponCode = `TEST${Date.now().toString().slice(-6)}`;
      const [newCoupon] = await sequelize.query(
        `INSERT INTO coupons (
          customer_id, code, discount_type, discount_value,
          description, valid_from, valid_until, max_uses,
          current_uses, status, webhook_sent, created_at, updated_at
        ) VALUES (
          :customerId, :code, 'percentage', 15.00,
          'Test coupon - 15% off', NOW(), NOW() + INTERVAL '30 days', 1,
          0, 'active', false, NOW(), NOW()
        ) RETURNING *`,
        {
          replacements: {
            customerId,
            code: couponCode
          },
          type: sequelize.QueryTypes.INSERT
        }
      );
      console.log(`✅ Created test coupon: ${couponCode}`);
    }

    // Display summary
    console.log('\n📈 Database Summary:');
    const [[customerStats]] = await sequelize.query('SELECT COUNT(*) as count FROM customers');
    const [[couponStats]] = await sequelize.query('SELECT COUNT(*) as count FROM coupons');
    const [[userStats]] = await sequelize.query('SELECT COUNT(*) as count FROM users');

    console.log(`Total customers: ${customerStats.count}`);
    console.log(`Total coupons: ${couponStats.count}`);
    console.log(`Total users: ${userStats.count}`);

    // Show active coupons for Cecilia
    console.log('\n🎯 Active coupons for cecilia.garciaprofessional@gmail.com:');
    const [activeCoupons] = await sequelize.query(
      `SELECT code, discount_type, discount_value, valid_until
       FROM coupons
       WHERE customer_id = :customerId
       AND status = 'active'
       AND valid_until > NOW()
       ORDER BY created_at DESC`,
      {
        replacements: { customerId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (activeCoupons.length > 0) {
      activeCoupons.forEach(coupon => {
        const validUntil = new Date(coupon.valid_until).toLocaleDateString();
        console.log(`  ✅ ${coupon.code} - ${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : '$' + coupon.discount_value} off (valid until ${validUntil})`);
      });
    } else {
      console.log('  No active coupons found');
    }

    await sequelize.close();
    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n📝 Test info:');
    console.log('  Customer email: cecilia.garciaprofessional@gmail.com');
    console.log('  Customer ID:', customerId);

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initDatabase();