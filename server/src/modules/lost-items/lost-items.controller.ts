import { Request, Response, NextFunction } from 'express';
import { lostItemsService } from './lost-items.service';
import { createLostItemSchema, updateStatusSchema, lostItemIdSchema } from './lost-items.validators';
import { LostItemStatus } from '@prisma/client';
import { z } from 'zod';

const piqueraIdSchema = z.object({ piqueraId: z.string().uuid() });

export class LostItemsController {
  /**
   * POST /api/lost-items
   * Reportar un objeto perdido.
   */
  async report(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createLostItemSchema.parse(req.body);
      const userId = req.user!.userId;

      const item = await lostItemsService.reportLostItem(userId, data);

      res.status(201).json({
        message: 'Objeto perdido reportado. Se notificó al conductor.',
        item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lost-items/piquera/:piqueraId
   * Reportes activos de una piquera (admin/super_admin).
   */
  async getByPiquera(req: Request, res: Response, next: NextFunction) {
    try {
      const { piqueraId } = piqueraIdSchema.parse(req.params);
      const items = await lostItemsService.getByPiquera(piqueraId);
      res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lost-items/me
   * Reportes asociados al conductor autenticado.
   */
  async getMyItems(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const items = await lostItemsService.getByDriver(driverId);
      res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/lost-items/:id/status
   * Actualizar estado del reporte.
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = lostItemIdSchema.parse(req.params);
      const { status } = updateStatusSchema.parse(req.body);

      const item = await lostItemsService.updateStatus(id, status as LostItemStatus);

      res.status(200).json({
        message: `Estado actualizado a "${status}"`,
        item,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const lostItemsController = new LostItemsController();
