import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export interface UserData {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  planName?: string;
  customerId?: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  stripeCustomerId?: string;
}

class AuthService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(payload: JWTPayload): string {
    const secret = config.jwt.secret || 'default-secret';
    const expiresIn = config.jwt.expiresIn || '7d';
    const options: any = {
      expiresIn: expiresIn,
    };
    return jwt.sign(payload, secret, options);
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const secret = config.jwt.secret || 'default-secret';
      const decoded = jwt.verify(token, secret) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  generateSessionToken(): string {
    const secret = config.jwt.secret || 'default-secret';
    const options: any = { expiresIn: '24h' };
    return jwt.sign(
      {
        sessionId: this.generateId(),
        timestamp: Date.now()
      },
      secret,
      options
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async createUser(email: string, password: string, name?: string): Promise<UserData> {
    // Dynamic import for server-only code
    const { User, Customer, getSequelize } = await import('../database/server-only');
    const sequelize = getSequelize();
    const transaction = await sequelize.transaction();

    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email },
        transaction
      });

      if (existingUser) {
        await transaction.rollback();
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Check if customer exists with this email
      let customer = await Customer.findOne({
        where: { email },
        transaction
      });

      // Create customer if doesn't exist
      if (!customer) {
        customer = await Customer.create({
          email,
          name: name || email.split('@')[0],
          phone: ''
        }, { transaction });
      }

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        customerId: customer.id
      }, { transaction });

      await transaction.commit();

      return {
        id: user.id.toString(),
        email: user.email,
        name: customer.name,
        customerId: customer.id,
        stripeCustomerId: user.stripeCustomerId
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<(UserData & { password: string }) | null> {
    try {
      const { User, Customer } = await import('../database/server-only');
      const user = await User.findOne({
        where: { email },
        include: [{
          model: Customer,
          as: 'customer'
        }]
      });

      if (!user) return null;

      return {
        id: user.id.toString(),
        email: user.email,
        password: user.password,
        name: user.customer?.name,
        customerId: user.customerId,
        stripeCustomerId: user.stripeCustomerId
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findUserById(userId: string): Promise<UserData | null> {
    try {
      const { User, Customer } = await import('../database/server-only');
      const user = await User.findByPk(parseInt(userId), {
        include: [{
          model: Customer,
          as: 'customer'
        }]
      });

      if (!user) return null;

      return {
        id: user.id.toString(),
        email: user.email,
        name: user.customer?.name,
        customerId: user.customerId,
        stripeCustomerId: user.stripeCustomerId
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<UserData>): Promise<UserData | null> {
    const { User, Customer, getSequelize } = await import('../database/server-only');
    const sequelize = getSequelize();
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(parseInt(userId), {
        include: [{
          model: Customer,
          as: 'customer'
        }],
        transaction
      });

      if (!user) {
        await transaction.rollback();
        return null;
      }

      // Update user fields
      if (updates.stripeCustomerId !== undefined) {
        user.stripeCustomerId = updates.stripeCustomerId;
      }

      await user.save({ transaction });

      // Update customer fields if name is provided
      if (updates.name && user.customer) {
        user.customer.name = updates.name;
        await user.customer.save({ transaction });
      }

      await transaction.commit();

      return {
        id: user.id.toString(),
        email: user.email,
        name: user.customer?.name,
        customerId: user.customerId,
        stripeCustomerId: user.stripeCustomerId,
        subscriptionId: updates.subscriptionId,
        subscriptionStatus: updates.subscriptionStatus,
        planName: updates.planName
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating user:', error);
      return null;
    }
  }

  async updateUserByEmail(email: string, updates: Partial<UserData>): Promise<UserData | null> {
    try {
      const { User } = await import('../database/server-only');
      const user = await User.findOne({ where: { email } });
      if (!user) return null;

      return this.updateUser(user.id.toString(), updates);
    } catch (error) {
      console.error('Error updating user by email:', error);
      return null;
    }
  }

  // Initialize database connection
  async initializeDatabase(): Promise<void> {
    try {
      const { getSequelize } = await import('../database/server-only');
      const sequelize = getSequelize();
      await sequelize.authenticate();
      console.log('✅ Database connection established');

      // Sync models (create tables if they don't exist)
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
}

export default new AuthService();