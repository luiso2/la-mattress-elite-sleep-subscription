import { Sequelize } from 'sequelize';

// Only initialize Sequelize on the server side
let sequelize: Sequelize | null = null;

if (typeof window === 'undefined') {
  // Server-side only
  const getDatabaseUrl = () => {
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    // Construct URL from individual variables
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const database = process.env.DB_NAME || 'lamattress_coupons';

    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  };

  sequelize = new Sequelize(getDatabaseUrl(), {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
}

// Function to get sequelize instance (server-side only)
export const getSequelize = (): Sequelize => {
  if (typeof window !== 'undefined') {
    throw new Error('Database connection cannot be used on the client side');
  }
  if (!sequelize) {
    throw new Error('Database connection not initialized');
  }
  return sequelize;
};

// Function to test connection
export const testConnection = async (): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    console.warn('Database connection test skipped on client side');
    return false;
  }

  try {
    const seq = getSequelize();
    await seq.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Function to sync database
export const syncDatabase = async (force = false): Promise<void> => {
  if (typeof window !== 'undefined') {
    console.warn('Database sync skipped on client side');
    return;
  }

  try {
    const seq = getSequelize();
    await seq.sync({ force });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

export { sequelize };
export default sequelize;