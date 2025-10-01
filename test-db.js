const { Sequelize } = require('sequelize');

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const database = process.env.DB_NAME || 'lamattress_coupons';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

const sequelize = new Sequelize(getDatabaseUrl(), {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();