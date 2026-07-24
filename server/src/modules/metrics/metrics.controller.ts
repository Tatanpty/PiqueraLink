import { Request, Response, NextFunction } from 'express';
import { metricsService } from './metrics.service';
import { z } from 'zod';

const piqueraIdSchema = z.object({
  piqueraId: z.string().uuid('ID de piquera debe ser un UUID válido'),
});

export class MetricsController {
  /**
   * GET /api/admin/metrics/global
   * Métricas globales consolidadas del sistema (solo super_admin).
   */
  async getGlobalMetrics(_req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await metricsService.getGlobalMetrics();
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/piqueras/:piqueraId/metrics
   * Métricas locales de una piquera específica (admin o super_admin).
   */
  async getPiqueraMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { piqueraId } = piqueraIdSchema.parse(req.params);
      const metrics = await metricsService.getPiqueraMetrics(piqueraId);
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  }
}

export const metricsController = new MetricsController();
