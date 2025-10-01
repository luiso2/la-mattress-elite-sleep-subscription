import { OrphanedRuleLog } from '../database/server-only';
import { Op } from 'sequelize';

export class OrphanedRuleLogService {
  
  /**
   * Buscar logs por código de cupón
   */
  static async findLogsByCouponCode(couponCode: string) {
    try {
      const logs = await OrphanedRuleLog.findAll({
        where: {
          couponCode: {
            [Op.iLike]: `%${couponCode}%`
          }
        },
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: logs,
        count: logs.length
      };
    } catch (error: any) {
      console.error('Error searching logs by coupon code:', error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0
      };
    }
  }

  /**
   * Buscar logs por ID de regla de precio
   */
  static async findLogsByPriceRuleId(priceRuleId: string) {
    try {
      const logs = await OrphanedRuleLog.findAll({
        where: {
          priceRuleId
        },
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: logs,
        count: logs.length
      };
    } catch (error: any) {
      console.error('Error searching logs by price rule ID:', error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0
      };
    }
  }

  /**
   * Obtener todos los logs no resueltos
   */
  static async getUnresolvedLogs() {
    try {
      const logs = await OrphanedRuleLog.findAll({
        where: {
          resolved: false
        },
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: logs,
        count: logs.length
      };
    } catch (error: any) {
      console.error('Error getting unresolved logs:', error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0
      };
    }
  }

  /**
   * Marcar un log como resuelto
   */
  static async markAsResolved(logId: number) {
    try {
      const [updatedCount] = await OrphanedRuleLog.update(
        {
          resolved: true,
          resolvedAt: new Date()
        },
        {
          where: { id: logId }
        }
      );

      if (updatedCount === 0) {
        return {
          success: false,
          error: 'Log not found'
        };
      }

      return {
        success: true,
        message: 'Log marked as resolved'
      };
    } catch (error: any) {
      console.error('Error marking log as resolved:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener estadísticas de logs
   */
  static async getLogStats() {
    try {
      const totalLogs = await OrphanedRuleLog.count();
      const unresolvedLogs = await OrphanedRuleLog.count({
        where: { resolved: false }
      });
      const resolvedLogs = await OrphanedRuleLog.count({
        where: { resolved: true }
      });

      // Logs de los últimos 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentLogs = await OrphanedRuleLog.count({
        where: {
          createdAt: {
            [Op.gte]: sevenDaysAgo
          }
        }
      });

      return {
        success: true,
        data: {
          total: totalLogs,
          unresolved: unresolvedLogs,
          resolved: resolvedLogs,
          recentLogs: recentLogs,
          resolutionRate: totalLogs > 0 ? ((resolvedLogs / totalLogs) * 100).toFixed(2) : '0.00'
        }
      };
    } catch (error: any) {
      console.error('Error getting log stats:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener logs con paginación
   */
  static async getLogsWithPagination(page: number = 1, limit: number = 10, resolved?: boolean) {
    try {
      const offset = (page - 1) * limit;
      const whereClause: any = {};
      
      if (resolved !== undefined) {
        whereClause.resolved = resolved;
      }

      const { count, rows } = await OrphanedRuleLog.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        success: true,
        data: {
          logs: rows,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(count / limit),
            hasPrevPage: page > 1
          }
        }
      };
    } catch (error: any) {
      console.error('Error getting logs with pagination:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}