import { Request, Response, NextFunction } from 'express';
import { queueService } from './queue.service';
import { piqueraIdParamSchema } from './queue.validators';

export class QueueController {
  /**
   * POST /api/queue/join/:piqueraId
   * Conductor se enlista en la cola de una piquera.
   */
  async join(req: Request, res: Response, next: NextFunction) {
    try {
      const { piqueraId } = piqueraIdParamSchema.parse(req.params);
      const driverId = req.user!.userId;

      const result = await queueService.joinQueue(driverId, piqueraId);

      res.status(201).json({
        message: `Te has unido a la cola en posición ${result.position}`,
        turn: result.turn,
        position: result.position,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/queue/leave/:piqueraId
   * Conductor abandona la cola voluntariamente.
   */
  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const { piqueraId } = piqueraIdParamSchema.parse(req.params);
      const driverId = req.user!.userId;

      const result = await queueService.leaveQueue(driverId, piqueraId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/queue/position/:piqueraId
   * Obtener posición actual del conductor en cola.
   */
  async getPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { piqueraId } = piqueraIdParamSchema.parse(req.params);
      const driverId = req.user!.userId;

      const result = await queueService.getPosition(driverId, piqueraId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/queue/status/:piqueraId
   * Ver estado completo de la cola (cualquier autenticado).
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { piqueraId } = piqueraIdParamSchema.parse(req.params);

      const result = await queueService.getQueueStatus(piqueraId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const queueController = new QueueController();
