import { Request, Response, NextFunction } from 'express';
import { adminToolsService } from './admin-tools.service';
import {
  exportReportQuerySchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from './admin-tools.validators';
import { AccountStatus } from '@prisma/client';

export class AdminToolsController {
  /**
   * GET /api/admin/reports/export?format=csv&startDate=...&endDate=...&piqueraId=...
   * Generar y descargar reporte.
   */
  async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const query = exportReportQuerySchema.parse(req.query);
      const reportData = await adminToolsService.generateReport(query);

      if (query.format === 'csv') {
        const csv = adminToolsService.generateCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="piqueralink-report.csv"');
        res.status(200).send(csv);
      } else {
        res.status(200).json(reportData);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id/status
   * Bloquear, suspender o reactivar un usuario.
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const { status, reason } = updateUserStatusSchema.parse(req.body);

      const result = await adminToolsService.updateUserStatus(
        id,
        status as AccountStatus,
        reason
      );

      const actionMsg = {
        active: 'reactivado',
        suspended: 'suspendido',
        banned: 'bloqueado permanentemente',
      };

      res.status(200).json({
        message: `Usuario ${actionMsg[status]}`,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users?role=driver&status=active
   * Listar usuarios con filtros.
   */
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, status } = req.query as { role?: string; status?: string };
      const users = await adminToolsService.listUsers({ role, status });
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }
}

export const adminToolsController = new AdminToolsController();
