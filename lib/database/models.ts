import { DataTypes, Model, Optional, Association, Op } from 'sequelize';
import { getSequelize } from './connection';

// Interfaces para TypeScript
interface CustomerAttributes {
  id: number;
  name: string;
  email: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id'> {}

interface CouponAttributes {
  id: number;
  customerId: number;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  description?: string;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  currentUses: number;
  minimumPurchase?: number;
  appliesTo?: string;
  shopifyPriceRuleId?: string;
  shopifyDiscountCodeId?: string;
  status: 'active' | 'expired' | 'used' | 'cancelled';
  webhookSent: boolean;
  webhookSentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CouponCreationAttributes extends Optional<CouponAttributes, 'id' | 'currentUses' | 'status' | 'webhookSent'> {}

interface CouponUseAttributes {
  id: number;
  couponId: number;
  customerId: number;
  orderId?: string;
  orderAmount?: number;
  discountApplied?: number;
  usedAt: Date;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CouponUseCreationAttributes extends Optional<CouponUseAttributes, 'id'> {}

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  customerId?: number;
  stripeCustomerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

interface SuperAdminAttributes {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'super_admin';
  permissions: string;
  lastLogin?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SuperAdminCreationAttributes extends Optional<SuperAdminAttributes, 'id' | 'role' | 'permissions' | 'isActive'> {}

interface EmployeeAttributes {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'employee';
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'id' | 'role' | 'isActive'> {}

interface OrphanedRuleLogAttributes {
  id: number;
  priceRuleId: string;
  couponCode: string;
  errorMessage: string;
  errorDetails?: any;
  shopifyResponse?: any;
  attemptCount: number;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrphanedRuleLogCreationAttributes extends Optional<OrphanedRuleLogAttributes, 'id' | 'resolved'> {}

// Modelo de Cliente
export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Asociaciones
  public readonly coupons?: Coupon[];
  public readonly couponUses?: CouponUse[];
  public readonly user?: User;

  public static associations: {
    coupons: Association<Customer, Coupon>;
    couponUses: Association<Customer, CouponUse>;
    user: Association<Customer, User>;
  };
}

// Only initialize models on the server side
if (typeof window === 'undefined') {
  const sequelize = getSequelize();

  Customer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      timestamps: true,
      underscored: true
    }
  );
  
  // Initialize OrphanedRuleLog model
  OrphanedRuleLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      priceRuleId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'price_rule_id'
      },
      couponCode: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'coupon_code'
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'error_message'
      },
      errorDetails: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'error_details'
      },
      shopifyResponse: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'shopify_response'
      },
      attemptCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'attempt_count'
      },
      resolved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'resolved_at'
      }
    },
    {
      sequelize,
      modelName: 'OrphanedRuleLog',
      tableName: 'orphaned_rule_logs',
      timestamps: true,
      underscored: true
    }
  );
}

// Modelo de Cupón
export class Coupon extends Model<CouponAttributes, CouponCreationAttributes> implements CouponAttributes {
  public id!: number;
  public customerId!: number;
  public code!: string;
  public discountType!: 'percentage' | 'fixed_amount';
  public discountValue!: number;
  public description?: string;
  public validFrom!: Date;
  public validUntil!: Date;
  public maxUses?: number;
  public currentUses!: number;
  public minimumPurchase?: number;
  public appliesTo?: string;
  public shopifyPriceRuleId?: string;
  public shopifyDiscountCodeId?: string;
  public status!: 'active' | 'expired' | 'used' | 'cancelled';
  public webhookSent!: boolean;
  public webhookSentAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Asociaciones
  public readonly customer?: Customer;
  public readonly couponUses?: CouponUse[];

  public static associations: {
    customer: Association<Coupon, Customer>;
    couponUses: Association<Coupon, CouponUse>;
  };
}

if (typeof window === 'undefined') {
  const sequelize = getSequelize();

  Coupon.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'customer_id',
      references: {
        model: Customer,
        key: 'id'
      }
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed_amount'),
      allowNull: false,
      field: 'discount_type'
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'discount_value'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'valid_from'
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'valid_until'
    },
    maxUses: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: 'max_uses'
    },
    currentUses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'current_uses'
    },
    minimumPurchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'minimum_purchase'
    },
    appliesTo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'applies_to'
    },
    shopifyPriceRuleId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'shopify_price_rule_id'
    },
    shopifyDiscountCodeId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'shopify_discount_code_id'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'used', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    },
    webhookSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'webhook_sent'
    },
    webhookSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'webhook_sent_at'
    }
    },
    {
      sequelize,
      modelName: 'Coupon',
      tableName: 'coupons',
      timestamps: true,
      underscored: true
    }
  );
}

// Modelo de Uso de Cupón
export class CouponUse extends Model<CouponUseAttributes, CouponUseCreationAttributes> implements CouponUseAttributes {
  public id!: number;
  public couponId!: number;
  public customerId!: number;
  public orderId?: string;
  public orderAmount?: number;
  public discountApplied?: number;
  public usedAt!: Date;
  public metadata?: any;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Asociaciones
  public readonly coupon?: Coupon;
  public readonly customer?: Customer;

  public static associations: {
    coupon: Association<CouponUse, Coupon>;
    customer: Association<CouponUse, Customer>;
  };
}

if (typeof window === 'undefined') {
  const sequelize = getSequelize();

  CouponUse.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
    couponId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'coupon_id',
      references: {
        model: Coupon,
        key: 'id'
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'customer_id',
      references: {
        model: Customer,
        key: 'id'
      }
    },
    orderId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'order_id'
    },
    orderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'order_amount'
    },
    discountApplied: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'discount_applied'
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'used_at'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
    },
    {
      sequelize,
      modelName: 'CouponUse',
      tableName: 'coupon_uses',
      timestamps: true,
      underscored: true
    }
  );
}

// Modelo de Usuario (nuevo para integración)
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public customerId?: number;
  public stripeCustomerId?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Asociaciones
  public readonly customer?: Customer;

  public static associations: {
    customer: Association<User, Customer>;
  };
}

// Super Admin Model
export class SuperAdmin extends Model<SuperAdminAttributes, SuperAdminCreationAttributes> implements SuperAdminAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: 'super_admin';
  public permissions!: string;
  public lastLogin?: Date;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Employee Model
export class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: 'employee';
  public isActive!: boolean;
  public lastLogin?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Modelo de Log de Reglas Huérfanas
export class OrphanedRuleLog extends Model<OrphanedRuleLogAttributes, OrphanedRuleLogCreationAttributes> implements OrphanedRuleLogAttributes {
  public id!: number;
  public priceRuleId!: string;
  public couponCode!: string;
  public errorMessage!: string;
  public errorDetails?: any;
  public shopifyResponse?: any;
  public attemptCount!: number;
  public resolved!: boolean;
  public resolvedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

if (typeof window === 'undefined') {
  const sequelize = getSequelize();

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'customer_id',
      references: {
        model: Customer,
        key: 'id'
      }
    },
    stripeCustomerId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'stripe_customer_id'
    }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true
    }
  );

  // Initialize SuperAdmin model
  SuperAdmin.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'super_admin'
      },
      permissions: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: JSON.stringify({
          users: ['create', 'read', 'update', 'delete'],
          employees: ['create', 'read', 'update', 'delete'],
          coupons: ['create', 'read', 'update', 'delete'],
          customers: ['create', 'read', 'update', 'delete'],
          settings: ['read', 'update'],
          analytics: ['read'],
          system: ['manage']
        })
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      }
    },
    {
      sequelize,
      modelName: 'SuperAdmin',
      tableName: 'super_admins',
      timestamps: true,
      underscored: true
    }
  );

  // Initialize Employee model
  Employee.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'employee'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login'
      }
    },
    {
      sequelize,
      modelName: 'Employee',
      tableName: 'employees',
      timestamps: true,
      underscored: true
    }
  );
}

// Definir asociaciones (solo en el servidor)
if (typeof window === 'undefined') {
  Customer.hasMany(Coupon, {
    foreignKey: 'customer_id',
    as: 'coupons'
  });

  Coupon.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });

  Customer.hasMany(CouponUse, {
    foreignKey: 'customer_id',
    as: 'couponUses'
  });

  CouponUse.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });

  Coupon.hasMany(CouponUse, {
    foreignKey: 'coupon_id',
    as: 'couponUses'
  });

  CouponUse.belongsTo(Coupon, {
    foreignKey: 'coupon_id',
    as: 'coupon'
  });

  User.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });

  Customer.hasOne(User, {
    foreignKey: 'customer_id',
    as: 'user'
  });
}

// Funciones helper
export const updateExpiredCoupons = async (): Promise<void> => {
  try {
    const now = new Date();
    await Coupon.update(
      { status: 'expired' },
      {
        where: {
          validUntil: {
            [Op.lt]: now
          },
          status: 'active'
        }
      }
    );
  } catch (error) {
    console.error('Error updating expired coupons:', error);
    throw error;
  }
};

export const findCouponsByEmail = async (email: string): Promise<Coupon[]> => {
  try {
    const customer = await Customer.findOne({
      where: { email },
      include: [{
        model: Coupon,
        as: 'coupons',
        order: [['created_at', 'DESC']]
      }]
    });

    return customer?.coupons || [];
  } catch (error) {
    console.error('Error finding coupons by email:', error);
    throw error;
  }
};

export const findCouponByCode = async (code: string): Promise<Coupon | null> => {
  try {
    return await Coupon.findOne({
      where: { code },
      include: [{
        model: Customer,
        as: 'customer'
      }]
    });
  } catch (error) {
    console.error('Error finding coupon by code:', error);
    throw error;
  }
};

export const createCouponWithCustomer = async (
  customerData: CustomerCreationAttributes,
  couponData: Omit<CouponCreationAttributes, 'customerId'>
): Promise<{ customer: Customer; coupon: Coupon }> => {
  const sequelize = getSequelize();
  const transaction = await sequelize.transaction();

  try {
    // Buscar o crear cliente
    let customer = await Customer.findOne({
      where: { email: customerData.email },
      transaction
    });

    if (!customer) {
      customer = await Customer.create(customerData, { transaction });
    }

    // Crear cupón
    const coupon = await Coupon.create({
      ...couponData,
      customerId: customer.id
    }, { transaction });

    await transaction.commit();

    return { customer, coupon };
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating coupon with customer:', error);
    throw error;
  }
};

// Exportar todo
const models = {
  Customer,
  Coupon,
  CouponUse,
  User,
  SuperAdmin,
  Employee,
  OrphanedRuleLog,
  updateExpiredCoupons,
  findCouponsByEmail,
  findCouponByCode,
  createCouponWithCustomer
};

export default models;