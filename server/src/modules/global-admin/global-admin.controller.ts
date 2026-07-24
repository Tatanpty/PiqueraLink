import { Request, Response, NextFunction } from 'express';
import { globalAdminService } from './global-admin.service';
import { z } from 'zod';

const piqueraIdSchema = z.object({
  piqueraId: z.string().uuid('ID de piquera debe ser un UUID válido'),
});

export class GlobalAdminController {
  async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await globalAdminService.getSystemOverview();
      res.status(200).json(overview);
    } catch (error) {
      next(error);
    }
  }

  async getAllPiqueras(_req: Request, res: Response, next: NextFunction) {
    try {
      const piqueras = await globalAdminService.getAllPiquerasWithMetrics();
      res.status(200).json(piqueras);
    } catch (error) {
      next(error);
    }
  }

  async getPiqueraDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { piqueraId } = piqueraIdSchema.parse(req.params);
      const detail = await globalAdminService.getPiqueraDetail(piqueraId);
      res.status(200).json(detail);
    } catch (error) {
      next(error);
    }
  }
}

export const globalAdminController = new GlobalAdminController();
