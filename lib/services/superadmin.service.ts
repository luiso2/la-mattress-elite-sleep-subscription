import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface SuperAdminData {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: any;
  lastLogin?: Date;
  isActive: boolean;
}

export interface SuperAdminJWTPayload {
  adminId: string;
  email: string;
  role: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalEmployees: number;
  totalCustomers: number;
  totalCoupons: number;
  activeCoupons: number;
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  recentActivity: any[];
}

class SuperAdminService {
  // Authenticate super admin
  async authenticate(email: string, password: string): Promise<{
    success: boolean;
    token?: string;
    admin?: SuperAdminData;
    error?: string;
  }> {
    try {
      const { SuperAdmin } = await import('../database/server-only');

      const admin = await SuperAdmin.findOne({
        where: { email, isActive: true }
      });

      if (!admin) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Update last login
      await admin.update({ lastLogin: new Date() });

      // Generate token
      const token = this.generateToken({
        adminId: admin.id.toString(),
        email: admin.email,
        role: admin.role
      });

      return {
        success: true,
        token,
        admin: {
          id: admin.id.toString(),
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: JSON.parse(admin.permissions),
          lastLogin: admin.lastLogin,
          isActive: admin.isActive
        }
      };
    } catch (error: any) {
      console.error('Super admin authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }

  // Create super admin (for initial setup)
  async createSuperAdmin(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<{
    success: boolean;
    admin?: SuperAdminData;
    error?: string;
  }> {
    try {
      const { SuperAdmin, getSequelize } = await import('../database/server-only');
      const sequelize = getSequelize();
      const transaction = await sequelize.transaction();

      try {
        // Check if super admin already exists
        const existing = await SuperAdmin.findOne({
          where: { email: data.email },
          transaction
        });

        if (existing) {
          await transaction.rollback();
          return {
            success: false,
            error: 'Super admin already exists'
          };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create super admin
        const admin = await SuperAdmin.create({
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: 'super_admin',
          isActive: true
        }, { transaction });

        await transaction.commit();

        return {
          success: true,
          admin: {
            id: admin.id.toString(),
            email: admin.email,
            name: admin.name,
            role: admin.role,
            permissions: JSON.parse(admin.permissions),
            isActive: admin.isActive
          }
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      return {
        success: false,
        error: error.message || 'Failed to create super admin'
      };
    }
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const { User, Customer, Coupon, Employee, getSequelize } = await import('../database/server-only');
      const sequelize = getSequelize();

      // Get counts
      const [
        totalUsers,
        totalCustomers,
        totalCoupons,
        activeCoupons,
        totalEmployees
      ] = await Promise.all([
        User.count(),
        Customer.count(),
        Coupon.count(),
        Coupon.count({ where: { status: 'active' } }),
        Employee.count()
      ]);

      // Get recent activity from coupons instead of coupon_uses
      const recentCoupons = await Coupon.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['name', 'email']
        }],
        attributes: ['id', 'code', 'status', 'createdAt']
      });

      // Calculate revenue (simulated for now)
      const totalDiscountGiven = totalCoupons * 50; // Simulated average discount

      // Build recent activity from recent coupons
      const recentActivity = recentCoupons.map(coupon => ({
        type: 'coupon_created',
        detail: `New coupon: ${coupon.code} for ${coupon.customer?.name || 'Unknown customer'}`,
        timestamp: coupon.createdAt
      }));

      return {
        totalUsers,
        totalEmployees,
        totalCustomers,
        totalCoupons,
        activeCoupons,
        revenue: {
          total: totalDiscountGiven * 10, // Simulated revenue
          thisMonth: totalDiscountGiven * 3,
          lastMonth: totalDiscountGiven * 2
        },
        recentActivity
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalUsers: 0,
        totalEmployees: 0,
        totalCustomers: 0,
        totalCoupons: 0,
        activeCoupons: 0,
        revenue: {
          total: 0,
          thisMonth: 0,
          lastMonth: 0
        },
        recentActivity: []
      };
    }
  }

  // User management
  async getUsers(limit = 50, offset = 0) {
    try {
      const { User, Customer } = await import('../database/server-only');
      const users = await User.findAll({
        limit,
        offset,
        include: [{
          model: Customer,
          as: 'customer'
        }],
        order: [['createdAt', 'DESC']]
      });

      return users.map(user => ({
        id: user.id,
        email: user.email,
        customerName: user.customer?.name,
        stripeCustomerId: user.stripeCustomerId,
        createdAt: user.createdAt
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async deleteUser(userId: string) {
    try {
      const { User } = await import('../database/server-only');
      const user = await User.findByPk(parseInt(userId));

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      await user.destroy();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  // Customer management
  async getCustomers(limit = 50, offset = 0) {
    try {
      const { Customer, Coupon } = await import('../database/server-only');
      const customers = await Customer.findAll({
        limit,
        offset,
        include: [{
          model: Coupon,
          as: 'coupons'
        }],
        order: [['createdAt', 'DESC']]
      });

      return customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalCoupons: customer.coupons?.length || 0,
        createdAt: customer.createdAt
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  // Coupon management
  async getAllCoupons(limit = 50, offset = 0) {
    try {
      const { Coupon, Customer } = await import('../database/server-only');
      const coupons = await Coupon.findAll({
        limit,
        offset,
        include: [{
          model: Customer,
          as: 'customer'
        }],
        order: [['createdAt', 'DESC']]
      });

      return coupons.map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        customerName: coupon.customer?.name,
        customerEmail: coupon.customer?.email,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        status: coupon.status,
        validUntil: coupon.validUntil,
        currentUses: coupon.currentUses,
        maxUses: coupon.maxUses
      }));
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return [];
    }
  }

  async deleteCoupon(couponId: string) {
    try {
      const { Coupon } = await import('../database/server-only');
      const coupon = await Coupon.findByPk(parseInt(couponId));

      if (!coupon) {
        return { success: false, error: 'Coupon not found' };
      }

      await coupon.destroy();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      return { success: false, error: error.message };
    }
  }

  // System settings
  async getSystemSettings() {
    // This could be expanded to store settings in database
    return {
      siteName: 'LA Mattress Management',
      stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
      shopifyEnabled: !!process.env.SHOPIFY_API_KEY,
      emailEnabled: !!process.env.EMAIL_USER,
      maintenanceMode: false
    };
  }

  async updateSystemSettings(settings: any) {
    // This could be expanded to store settings in database
    return { success: true, settings };
  }

  // Token management
  generateToken(payload: SuperAdminJWTPayload): string {
    const secret = config.jwt.secret || 'default-secret';
    return jwt.sign(payload, secret, { expiresIn: '8h' });
  }

  verifyToken(token: string): SuperAdminJWTPayload | null {
    try {
      const secret = config.jwt.secret || 'default-secret';
      return jwt.verify(token, secret) as SuperAdminJWTPayload;
    } catch (error) {
      console.error('Super admin token verification failed:', error);
      return null;
    }
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Check if super admin exists (for initial setup)
  async checkSuperAdminExists(): Promise<boolean> {
    try {
      const { SuperAdmin } = await import('../database/server-only');
      const count = await SuperAdmin.count();
      return count > 0;
    } catch (error) {
      console.error('Error checking super admin existence:', error);
      return false;
    }
  }
}

export const superAdminService = new SuperAdminService();
export default superAdminService;

export async function verifySuperAdminToken(token: string): Promise<SuperAdminJWTPayload | null> {
  return superAdminService.verifyToken(token);
}