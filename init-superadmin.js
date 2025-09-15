require('dotenv').config({ path: '.env.local' });
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

async function initSuperAdmin() {
  console.log('🚀 Initializing Super Admin...\n');

  try {
    // Create connection
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });

    // Test connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection established!\n');

    // Create super_admins table if not exists
    console.log('📦 Creating super_admins table if not exists...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS super_admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'super_admin',
        permissions TEXT,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Super admins table ready\n');

    // Check if super admin already exists
    console.log('🔍 Checking for existing super admin...');
    const [existing] = await sequelize.query(
      'SELECT * FROM super_admins WHERE email = :email',
      {
        replacements: { email: 'lbencomo94@gmail.com' },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existing) {
      console.log('⚠️  Super admin already exists!');
      console.log('   Email: lbencomo94@gmail.com');
      console.log('   Name:', existing.name);
    } else {
      console.log('Creating super admin...');

      // Hash password
      const hashedPassword = await bcrypt.hash('Atec2019chino', 10);

      // Default permissions
      const permissions = JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        employees: ['create', 'read', 'update', 'delete'],
        coupons: ['create', 'read', 'update', 'delete'],
        customers: ['create', 'read', 'update', 'delete'],
        settings: ['read', 'update'],
        analytics: ['read'],
        system: ['manage']
      });

      const [result] = await sequelize.query(
        `INSERT INTO super_admins (email, password, name, role, permissions, is_active, created_at, updated_at)
         VALUES (:email, :password, :name, :role, :permissions, :is_active, NOW(), NOW())
         RETURNING *`,
        {
          replacements: {
            email: 'lbencomo94@gmail.com',
            password: hashedPassword,
            name: 'Luis Bencomo',
            role: 'super_admin',
            permissions: permissions,
            is_active: true
          },
          type: sequelize.QueryTypes.INSERT
        }
      );

      console.log('✅ Super admin created successfully!');
      console.log('\n📝 Super Admin Credentials:');
      console.log('   Email: lbencomo94@gmail.com');
      console.log('   Password: Atec2019chino');
      console.log('   Name: Luis Bencomo');
    }

    // Show statistics
    console.log('\n📊 Database Statistics:');
    const [[adminStats]] = await sequelize.query('SELECT COUNT(*) as count FROM super_admins');
    const [[userStats]] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [[customerStats]] = await sequelize.query('SELECT COUNT(*) as count FROM customers');
    const [[couponStats]] = await sequelize.query('SELECT COUNT(*) as count FROM coupons');

    console.log(`   Super Admins: ${adminStats.count}`);
    console.log(`   Users: ${userStats.count}`);
    console.log(`   Customers: ${customerStats.count}`);
    console.log(`   Coupons: ${couponStats.count}`);

    await sequelize.close();
    console.log('\n✅ Super admin initialization completed!');
    console.log('\n🌐 Access the super admin panel at:');
    console.log('   http://localhost:3000/superadmin');

  } catch (error) {
    console.error('\n❌ Super admin initialization failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initSuperAdmin();