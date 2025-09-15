import bcrypt from 'bcryptjs';

export interface EmployeeEnvData {
  email: string;
  password: string;
  name: string;
}

export interface EmployeeData {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

class EmployeeSyncService {
  // Parse employees from environment variables
  getEmployeesFromEnv(): EmployeeEnvData[] {
    const employees: EmployeeEnvData[] = [];

    // Loop through employee environment variables (EMPLOYEE_1_EMAIL, EMPLOYEE_2_EMAIL, etc.)
    for (let i = 1; i <= 20; i++) { // Check up to 20 employees
      const email = process.env[`EMPLOYEE_${i}_EMAIL`];
      const password = process.env[`EMPLOYEE_${i}_PASSWORD`];
      const name = process.env[`EMPLOYEE_${i}_NAME`];

      if (email && password && name) {
        employees.push({
          email: email.trim(),
          password: password.trim(),
          name: name.trim()
        });
      }
    }

    return employees;
  }

  // Sync employees from .env to database
  async syncEmployeesToDatabase(): Promise<{
    success: boolean;
    created: number;
    updated: number;
    total: number;
    error?: string;
  }> {
    try {
      const { Employee, getSequelize } = await import('../database/server-only');
      const sequelize = getSequelize();

      const envEmployees = this.getEmployeesFromEnv();
      let created = 0;
      let updated = 0;

      if (envEmployees.length === 0) {
        return {
          success: true,
          created: 0,
          updated: 0,
          total: 0
        };
      }

      // Use transaction for all operations
      const transaction = await sequelize.transaction();

      try {
        for (const envEmployee of envEmployees) {
          // Check if employee already exists
          const existingEmployee = await Employee.findOne({
            where: { email: envEmployee.email },
            transaction
          });

          // Hash password
          const hashedPassword = await bcrypt.hash(envEmployee.password, 10);

          if (existingEmployee) {
            // Update existing employee
            await existingEmployee.update({
              name: envEmployee.name,
              password: hashedPassword,
              isActive: true
            }, { transaction });
            updated++;
          } else {
            // Create new employee
            await Employee.create({
              email: envEmployee.email,
              password: hashedPassword,
              name: envEmployee.name,
              role: 'employee',
              isActive: true
            }, { transaction });
            created++;
          }
        }

        await transaction.commit();

        return {
          success: true,
          created,
          updated,
          total: envEmployees.length
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error: any) {
      console.error('Error syncing employees to database:', error);
      return {
        success: false,
        created: 0,
        updated: 0,
        total: 0,
        error: error.message || 'Failed to sync employees'
      };
    }
  }

  // Get all employees from database
  async getAllEmployees(): Promise<EmployeeData[]> {
    try {
      const { Employee } = await import('../database/server-only');

      const employees = await Employee.findAll({
        attributes: ['id', 'email', 'name', 'role', 'isActive', 'lastLogin', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });

      return employees.map(employee => ({
        id: employee.id.toString(),
        email: employee.email,
        name: employee.name,
        role: employee.role,
        isActive: employee.isActive,
        lastLogin: employee.lastLogin,
        createdAt: employee.createdAt
      }));
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  // Delete employee by ID
  async deleteEmployee(employeeId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { Employee } = await import('../database/server-only');

      const employee = await Employee.findByPk(parseInt(employeeId));

      if (!employee) {
        return {
          success: false,
          error: 'Employee not found'
        };
      }

      await employee.destroy();

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete employee'
      };
    }
  }

  // Toggle employee active status
  async toggleEmployeeStatus(employeeId: string, isActive: boolean): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { Employee } = await import('../database/server-only');

      const employee = await Employee.findByPk(parseInt(employeeId));

      if (!employee) {
        return {
          success: false,
          error: 'Employee not found'
        };
      }

      await employee.update({ isActive });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating employee status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update employee status'
      };
    }
  }

  // Create new employee manually
  async createEmployee(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<{
    success: boolean;
    employee?: EmployeeData;
    error?: string;
  }> {
    try {
      const { Employee, getSequelize } = await import('../database/server-only');
      const sequelize = getSequelize();
      const transaction = await sequelize.transaction();

      try {
        // Check if employee already exists
        const existing = await Employee.findOne({
          where: { email: data.email },
          transaction
        });

        if (existing) {
          await transaction.rollback();
          return {
            success: false,
            error: 'Employee with this email already exists'
          };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create employee
        const employee = await Employee.create({
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: 'employee',
          isActive: true
        }, { transaction });

        await transaction.commit();

        return {
          success: true,
          employee: {
            id: employee.id.toString(),
            email: employee.email,
            name: employee.name,
            role: employee.role,
            isActive: employee.isActive,
            createdAt: employee.createdAt
          }
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error: any) {
      console.error('Error creating employee:', error);
      return {
        success: false,
        error: error.message || 'Failed to create employee'
      };
    }
  }

  // Update employee
  async updateEmployee(employeeId: string, data: {
    name: string;
    email: string;
    password?: string;
  }): Promise<{
    success: boolean;
    employee?: EmployeeData;
    error?: string;
  }> {
    try {
      const { Employee, getSequelize } = await import('../database/server-only');
      const sequelize = getSequelize();
      const transaction = await sequelize.transaction();

      try {
        // Find employee
        const employee = await Employee.findByPk(parseInt(employeeId), { transaction });

        if (!employee) {
          await transaction.rollback();
          return {
            success: false,
            error: 'Employee not found'
          };
        }

        // Check if email is already taken by another employee
        if (data.email !== employee.email) {
          const existingEmployee = await Employee.findOne({
            where: { email: data.email },
            transaction
          });

          if (existingEmployee) {
            await transaction.rollback();
            return {
              success: false,
              error: 'Email is already taken by another employee'
            };
          }
        }

        // Prepare update data
        const updateData: any = {
          name: data.name,
          email: data.email
        };

        // Only hash and update password if provided
        if (data.password && data.password.trim() !== '') {
          updateData.password = await bcrypt.hash(data.password, 10);
        }

        // Update employee
        await employee.update(updateData, { transaction });

        await transaction.commit();

        return {
          success: true,
          employee: {
            id: employee.id.toString(),
            email: employee.email,
            name: employee.name,
            role: employee.role,
            isActive: employee.isActive,
            createdAt: employee.createdAt
          }
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error: any) {
      console.error('Error updating employee:', error);
      return {
        success: false,
        error: error.message || 'Failed to update employee'
      };
    }
  }
}

export const employeeSyncService = new EmployeeSyncService();
export default employeeSyncService;